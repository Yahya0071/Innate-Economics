/**
 * Innate Audio Engine (محرك التغذية الصوتية الفطرية الخفيفة)
 * 
 * Procedural micro-sound synthesizer using the native Web Audio API.
 * ZERO external audio files. Zero latency. Fully deterministic and safe for SSR/Node.
 */

const STORAGE_KEY = 'innate_audio_muted';

let audioCtx: AudioContext | null = null;
let activeTensionOsc: OscillatorNode | null = null;
let activeTensionGain: GainNode | null = null;

/**
 * Lazily initialize and resume the browser AudioContext upon user gesture.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Check if audio is globally muted.
 * Persisted in localStorage under 'innate_audio_muted'.
 */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return true;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    // Also check legacy key if present
    const legacy = localStorage.getItem('innate_sound_muted');
    if (legacy !== null) {
      return legacy === 'true';
    }
  } catch {
    // LocalStorage might be restricted
  }
  return false;
}

/**
 * Set the global mute state and persist to localStorage.
 */
export function setSoundMuted(muted: boolean): boolean {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
      localStorage.setItem('innate_sound_muted', muted ? 'true' : 'false');
    } catch {
      // LocalStorage might be restricted
    }
  }

  // Stop any ongoing hums if muting
  if (muted) {
    stopTensionHum();
  }

  return muted;
}

/**
 * Toggle the global sound mute state.
 */
export function toggleSound(): boolean {
  const next = !isSoundMuted();
  return setSoundMuted(next);
}

/**
 * 1. playCoinSound (رنين معدني خافت عند كسب أو إنفاق الذهب/الموارد)
 * Simulates a light, resonant metallic coin clink using high-harmonic sine waves.
 */
export function playCoinSound(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const frequencies = [1760, 2637]; // A6 and E7 harmonic interval

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);

      gain.gain.setValueAtTime(0.05, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.22);
    });
  } catch {
    // Fail silently on blocked audio
  }
}

/**
 * 2. playTensionHum (تردد منخفض يعبر عن ارتفاع التوتر أو اقتراب هلع السيولة/تآكل المرعى)
 * Produces a low-frequency rumble modulated by the danger level (0.0 to 1.0).
 */
export function playTensionHum(level: number = 0.5): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const clampedLevel = Math.max(0, Math.min(1, level));
    if (clampedLevel <= 0.05) {
      stopTensionHum();
      return;
    }

    const now = ctx.currentTime;
    const baseFreq = 50 + clampedLevel * 45; // 50Hz up to 95Hz low hum
    const targetGain = 0.02 + clampedLevel * 0.06;

    if (!activeTensionOsc || !activeTensionGain) {
      activeTensionOsc = ctx.createOscillator();
      activeTensionGain = ctx.createGain();

      activeTensionOsc.type = 'sawtooth';
      activeTensionOsc.frequency.setValueAtTime(baseFreq, now);

      // Lowpass filter to muffle harsh harmonics into a deep vibration
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140 + clampedLevel * 60, now);

      activeTensionGain.gain.setValueAtTime(0.001, now);
      activeTensionGain.gain.linearRampToValueAtTime(targetGain, now + 0.15);

      activeTensionOsc.connect(filter);
      filter.connect(activeTensionGain);
      activeTensionGain.connect(ctx.destination);

      activeTensionOsc.start(now);
    } else {
      activeTensionOsc.frequency.setTargetAtTime(baseFreq, now, 0.1);
      activeTensionGain.gain.setTargetAtTime(targetGain, now, 0.1);
    }
  } catch {
    // Fail silently
  }
}

/**
 * Stop any active tension hum immediately.
 */
export function stopTensionHum(): void {
  if (activeTensionGain && activeTensionOsc && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      activeTensionGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
      setTimeout(() => {
        try {
          activeTensionOsc?.stop();
          activeTensionOsc?.disconnect();
          activeTensionGain?.disconnect();
        } catch {
          // Ignore cleanup errors
        } finally {
          activeTensionOsc = null;
          activeTensionGain = null;
        }
      }, 120);
    } catch {
      activeTensionOsc = null;
      activeTensionGain = null;
    }
  }
}

/**
 * 3. playSoftClick (نقرة فيزيائية ناعمة عند تحريك المنزلقات)
 * Ultra-short tactile micro-click simulating tactile hardware.
 */
export function playSoftClick(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.025);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.025);
  } catch {
    // Fail silently
  }
}

/**
 * 4. playSuccessChime (نغمة استقرار التوازن أو تحقيق التراكم الرأسمالي)
 * Harmonic 3-note chime evoking resolution, prosperity, and equilibrium.
 */
export function playSuccessChime(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonic progression: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const noteStart = now + idx * 0.08;
      const noteDuration = 0.32;

      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.05, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  } catch {
    // Fail silently
  }
}

// Backward-compatible aliases for legacy imports
export const playTactileTick = playSoftClick;
export const playCoinChime = playCoinSound;
export const playCoin = playCoinSound;
export const playTick = playSoftClick;

/**
 * Generic soft tone for UI navigation or clicks.
 */
export function playTone(freq = 440, duration = 0.05): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Fail silently
  }
}

/**
 * Water droplet / well flow sound.
 */
export function playWaterDrop(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.12);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch {
    // Fail silently
  }
}

/**
 * Low warning / exhaustion / bank run thud.
 */
export function playWarningThud(): void {
  if (isSoundMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  } catch {
    // Fail silently
  }
}

