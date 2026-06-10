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

    const playNote = (freq: number, start: number, duration: number) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
      
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + start + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start(audioCtx.currentTime + start);
      oscillator.stop(audioCtx.currentTime + start + duration);
    };

    // Play a "Ding-Dong" sequence
    playNote(880, 0, 0.6);   // A5
    playNote(659.25, 0.3, 0.8); // E5

    // Close context after playing
    setTimeout(() => {
      audioCtx.close().catch(() => {});
    }, 1500);
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
