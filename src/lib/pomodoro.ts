// src/lib/pomodoro.ts

export async function playDingSound() {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    // Resume context if suspended
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    /**
     * Play a single note with smooth attack and long tail.
     * @param freq       - Frequency in Hz
     * @param startSec   - When to start relative to audioCtx.currentTime
     * @param decaySec   - Duration of the natural decay (reverb tail)
     * @param peakGain   - Peak volume (0–1)
     * @param type       - Oscillator waveform
     */
    const playNote = (
      freq: number,
      startSec: number,
      decaySec: number,
      peakGain = 0.22,
      type: OscillatorType = "sine"
    ) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + startSec);

      // Smooth attack → sustain → long decay (bell-like)
      gain.gain.setValueAtTime(0.001, now + startSec);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startSec + 0.06);
      gain.gain.exponentialRampToValueAtTime(peakGain * 0.6, now + startSec + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + startSec + decaySec);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + startSec);
      osc.stop(now + startSec + decaySec + 0.05);
    };

    // ─── "Ding-Dong-Ding" — gentle 3-note ascending + descending chime ───
    // Note 1: E5 (659 Hz) — main strike
    playNote(659.25, 0.0,  2.2, 0.22);
    // Note 2: G5 (784 Hz) — one step up, overlapping
    playNote(784.0,  0.45, 2.0, 0.18);
    // Note 3: C6 (1047 Hz) — high resolution note
    playNote(1046.5, 0.90, 2.5, 0.14);
    // Soft shimmer overlay on note 3 for richness (triangle wave, detuned)
    playNote(1050.0, 0.90, 2.2, 0.06, "triangle");

    // Close context after all notes have decayed
    setTimeout(() => {
      audioCtx.close().catch(() => {});
    }, 4000);
  } catch (error) {
    console.warn("Unable to play Pomodoro sound", error);
  }
}


export async function showPomodoroNotification(title: string, body: string) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission === "granted") {
    try {
      // 1. Try direct notification
      new Notification(title, {
        body,
        icon: "/icon.png",
        tag: "pomodoro-notification",
        requireInteraction: true,
      });
    } catch (err) {
      // 2. Fallback to service worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          registration.showNotification(title, {
            body,
            icon: "/icon.png",
            badge: "/icon.png",
            tag: "pomodoro-notification",
            requireInteraction: true,
          });
        }
      }
    }
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
