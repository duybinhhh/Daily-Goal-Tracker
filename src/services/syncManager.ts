// src/services/syncManager.ts
import { getPendingQueue, removeFromSyncQueue } from "./indexedDb";
import { useGoalStore } from "../store/goalStore";
import api from "./api";

// LocalStorage lock keys and values (fallback for non-secure HTTP contexts)
const LS_LOCK_KEY = "sync_offline_data_ls_lock";
const LS_LOCK_TIMEOUT_MS = 10000; // 10s safety timeout

let myTabId = "";
function getTabId(): string {
  if (!myTabId) {
    myTabId = Math.random().toString(36).substring(2, 15);
  }
  return myTabId;
}

function acquireLocalStorageLock(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  const now = Date.now();
  const lockVal = localStorage.getItem(LS_LOCK_KEY);
  if (lockVal) {
    try {
      const { timestamp, tabId } = JSON.parse(lockVal);
      // If held by another tab and not timed out, skip
      if (tabId !== getTabId() && now - timestamp < LS_LOCK_TIMEOUT_MS) {
        return false;
      }
    } catch (e) {
      // Overwrite malformed lock data
    }
  }
  localStorage.setItem(LS_LOCK_KEY, JSON.stringify({ timestamp: now, tabId: getTabId() }));
  return true;
}

function releaseLocalStorageLock() {
  if (typeof window === "undefined" || !window.localStorage) return;
  const lockVal = localStorage.getItem(LS_LOCK_KEY);
  if (lockVal) {
    try {
      const { tabId } = JSON.parse(lockVal);
      if (tabId === getTabId()) {
        localStorage.removeItem(LS_LOCK_KEY);
      }
    } catch (e) {
      localStorage.removeItem(LS_LOCK_KEY);
    }
  }
}

// Singleton sync lock — fallback for environments without Web Locks or LocalStorage
let isSyncing = false;
let lastSyncAt = 0;
const MIN_SYNC_INTERVAL_MS = 2000; // minimum 2s between sync attempts

async function runSyncOfflineData() {
  // Guard: too soon since last sync
  const now = Date.now();
  if (now - lastSyncAt < MIN_SYNC_INTERVAL_MS) {
    console.log("[Sync Manager] Sync cooldown active, skipping.");
    return;
  }

  if (!navigator.onLine) return;

  const queue = await getPendingQueue();
  if (queue.length === 0) return;

  lastSyncAt = Date.now();
  console.log(`[Sync Manager] Starting sync of ${queue.length} pending actions...`);

  const store = useGoalStore.getState();
  store.setIsSyncing(true);

  try {
    for (const action of queue) {
      if (action.action === "complete") {
        try {
          // Verify item still exists in queue before sending (prevents race condition in multi-tab)
          const { getSyncAction } = await import("./indexedDb");
          const stillPending = await getSyncAction(action.id);
          if (!stillPending) {
            console.log(`[Sync Manager] Action ${action.id} already processed, skipping.`);
            continue;
          }

          // Send to server first
          await api.post(`/api/goals/${action.goalId}/complete`, {
            note: action.payload.note,
            completed_at: action.payload.completed_at,
            log_id: action.id, // Pass client-side log UUID to prevent database duplicates
          });

          // Remove AFTER sending successfully
          await removeFromSyncQueue(action.id);
          console.log(`[Sync Manager] Synced action ${action.id} successfully.`);
        } catch (err: any) {
          console.error(`[Sync Manager] Failed to sync action ${action.id}:`, err);

          // On network / 5xx error, leave the item in the queue so it can be retried.
          if (!err.response || err.response.status >= 500) {
            // Stop processing and break out of the sync loop.
            // Next online sync or manual sync will retry this item.
            break;
          }

          // On 4xx errors (e.g. goal deleted or user unauthorized), the action is invalid,
          // so discard it to prevent permanently blocking the sync queue.
          await removeFromSyncQueue(action.id);
        }
      }
    }
  } finally {
    store.setIsSyncing(false);

    // Refresh UI with server data after sync
    try {
      await Promise.all([
        store.fetchGoals(),
        store.fetchStats(),
        store.fetchHistory(),
      ]);
    } catch (err) {
      console.error("[Sync Manager] Error refreshing stores post-sync:", err);
    }
  }
}

export async function syncOfflineData() {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return navigator.locks.request("sync_offline_data_lock", { ifAvailable: true }, async (lock) => {
      if (!lock) {
        console.log("[Sync Manager] Another tab is syncing (locked), skipping.");
        return;
      }
      await runSyncOfflineData();
    });
  }

  // Fallback: LocalStorage lock + in-memory locks
  if (isSyncing) {
    console.log("[Sync Manager] Sync already in progress (memory lock), skipping.");
    return;
  }

  if (!acquireLocalStorageLock()) {
    console.log("[Sync Manager] Another tab is syncing (localstorage lock), skipping.");
    return;
  }

  isSyncing = true;
  try {
    await runSyncOfflineData();
  } finally {
    isSyncing = false;
    releaseLocalStorageLock();
  }
}

// NOTE: Do NOT add window.addEventListener("online", ...) here.
// App.tsx already handles this to avoid duplicate listeners.

