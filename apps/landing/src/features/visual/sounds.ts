/*
 * Adapted from Visual Effect (src/sounds/TaskSounds.ts) by Kit Langton.
 * Copyright (c) 2025 Kit Langton. MIT License: https://github.com/kitlangton/visual-effect
 *
 * Changes: Tone.js is imported lazily after the first user gesture, sound is a persisted
 * preference (off by default under prefers-reduced-motion), and the unused cues are dropped.
 */
import { useSyncExternalStore } from "react";

import type * as ToneNS from "tone";

type Tone = typeof ToneNS;

const PENTATONIC_SCALE = ["C", "D", "E", "G", "A"] as const;
const BASE_OCTAVE = 3;
/** Notes within this window are voiced as one chord in the same octave. */
const CHORD_WINDOW_MS = 100;

interface Engine {
  readonly Tone: Tone;
  readonly success: ToneNS.PolySynth;
  readonly running: ToneNS.PolySynth;
  readonly bass: ToneNS.PolySynth;
  readonly interrupt: ToneNS.PolySynth;
  readonly reset: ToneNS.PolySynth;
  readonly death: ToneNS.PolySynth;
  readonly config: ToneNS.PolySynth;
  readonly notification: ToneNS.PolySynth;
  readonly finalizer: ToneNS.PolySynth;
}

async function createEngine(): Promise<Engine> {
  const Tone = await import("tone");
  await Tone.start();

  const volume = new Tone.Volume(-12).toDestination();
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).connect(volume);
  const distortion = new Tone.Distortion({ distortion: 0.8, wet: 1 }).connect(volume);

  const synth = (
    oscillator: string,
    envelope: { attack: number; decay: number; sustain: number; release: number },
    output: ToneNS.ToneAudioNode = reverb,
  ) =>
    new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscillator },
      envelope,
    } as ToneNS.SynthOptions).connect(output);

  const transport = Tone.getTransport();

  if (transport.state !== "started") transport.start();

  return {
    Tone,
    success: synth("triangle", { attack: 0.02, decay: 0.3, sustain: 0.1, release: 1.2 }),
    running: synth("sine", { attack: 0.002, decay: 0.08, sustain: 0, release: 0.1 }),
    bass: synth("sawtooth", { attack: 0.02, decay: 0.4, sustain: 0.1, release: 0.8 }),
    interrupt: synth("triangle", { attack: 0.001, decay: 0.08, sustain: 0, release: 0.04 }),
    reset: synth("sine", { attack: 0.004, decay: 0.18, sustain: 0, release: 0.12 }),
    death: synth(
      "fatsawtooth10",
      { attack: 0.01, decay: 0.5, sustain: 0.3, release: 1.5 },
      distortion,
    ),
    config: synth("triangle", { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }),
    notification: synth("triangle", { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.4 }),
    finalizer: synth("square4", { attack: 0.005, decay: 0.12, sustain: 0.05, release: 0.25 }),
  };
}

// Preference: "on" | "off" in localStorage; unset follows prefers-reduced-motion.

const STORAGE_KEY = "ek:visual-sound";
const listeners = new Set<() => void>();

function readEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "on") return true;
    if (stored === "off") return false;
  } catch {
    // Storage can be blocked; fall through to the system default.
  }

  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
  };
}

/** Whether playground sounds are on. Always `false` during SSR. */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, readEnabled, () => false);
}

export function setSoundEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Not persisted, but the listeners below still update this page.
  }

  for (const listener of listeners) listener();
  if (enabled) sounds.unlock();
}

class TaskSounds {
  private engine: Promise<Engine> | null = null;
  private currentNoteIndex = 0;
  private chordWindowStart: number | null = null;
  private chordStep = 0;
  private chordBaseIndex = 0;
  private chordBaseOctave = BASE_OCTAVE;
  private playingFailure = false;
  private playingInterrupt = false;

  /**
   * Loads Tone.js and starts the audio context. Call from a click or key handler: browsers
   * only allow audio after a user gesture. Does nothing while sound is off.
   */
  unlock() {
    if (this.engine || typeof window === "undefined" || !readEnabled()) return;

    this.engine = createEngine();
    this.engine.catch(() => {
      this.engine = null;
    });
  }

  private async ready(): Promise<Engine | null> {
    if (!this.engine || !readEnabled()) return null;

    try {
      return await this.engine;
    } catch {
      return null;
    }
  }

  private inChordWindow(now: number) {
    return this.chordWindowStart !== null && now - this.chordWindowStart <= CHORD_WINDOW_MS;
  }

  private nextNote(octaveOffset: number) {
    const now = Date.now();

    if (!this.inChordWindow(now)) {
      this.chordWindowStart = now;
      this.chordStep = 0;
      this.chordBaseIndex = this.currentNoteIndex % PENTATONIC_SCALE.length;
      this.chordBaseOctave = BASE_OCTAVE + octaveOffset;
    }

    const note = PENTATONIC_SCALE[(this.chordBaseIndex + this.chordStep) % PENTATONIC_SCALE.length];
    this.chordStep++;
    this.currentNoteIndex = (this.currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2);

    return `${note}${this.chordBaseOctave}`;
  }

  async running() {
    const engine = await this.ready();
    // An octave above the failure bass and below the success triads.
    engine?.running.triggerAttackRelease(this.nextNote(1), "32n", undefined, 0.25);
  }

  /** Completions inside the chord window walk up a major triad, so they sound together. */
  async success() {
    const engine = await this.ready();
    if (!engine) return;

    const now = Date.now();

    if (!this.inChordWindow(now)) {
      this.chordWindowStart = now;
      this.chordStep = 0;
      this.chordBaseIndex = this.currentNoteIndex % PENTATONIC_SCALE.length;
      this.chordBaseOctave = BASE_OCTAVE + 1;
    }

    const root = `${PENTATONIC_SCALE[this.chordBaseIndex]}${this.chordBaseOctave}`;
    const triad = [0, 4, 7] as const;
    const note = engine.Tone.Frequency(root)
      .transpose(triad[this.chordStep % triad.length] ?? 0)
      .toNote();
    this.chordStep++;
    this.currentNoteIndex = (this.currentNoteIndex + 1) % (PENTATONIC_SCALE.length * 2);

    engine.success.triggerAttackRelease(note, "4n");
  }

  async failure() {
    if (this.playingFailure) return;
    const engine = await this.ready();
    if (!engine) return;

    // Guards against stacking bass notes when several nodes fail at once.
    this.playingFailure = true;
    const note = `${PENTATONIC_SCALE[this.currentNoteIndex % PENTATONIC_SCALE.length]}${BASE_OCTAVE - 1}`;
    this.currentNoteIndex = (this.currentNoteIndex + 1) % PENTATONIC_SCALE.length;
    engine.bass.triggerAttackRelease(note, "4n", engine.Tone.now(), 0.65);

    setTimeout(() => {
      this.playingFailure = false;
    }, 200);
  }

  async interrupted() {
    if (this.playingInterrupt) return;
    const engine = await this.ready();
    if (!engine) return;

    this.playingInterrupt = true;
    const now = engine.Tone.now();
    engine.interrupt.triggerAttackRelease("C5", "32n", now, 0.6);
    engine.interrupt.triggerAttackRelease("E5", "32n", now + 0.07, 0.6);

    setTimeout(() => {
      this.playingInterrupt = false;
    }, 200);
  }

  async death() {
    const engine = await this.ready();
    if (!engine) return;

    const now = engine.Tone.now();
    engine.death.triggerAttackRelease(`D#${BASE_OCTAVE}`, "32n", now, 0.45);
    engine.death.triggerAttackRelease(`C${BASE_OCTAVE - 2}`, "1n", now + 0.1, 0.55);
  }

  async reset() {
    const engine = await this.ready();
    if (!engine) return;

    const now = engine.Tone.now();
    engine.reset.triggerAttackRelease(`G${BASE_OCTAVE}`, "16n", now, 0.6);
    engine.reset.triggerAttackRelease(`C${BASE_OCTAVE}`, "16n", now + 0.1, 0.6);
  }

  async configChange() {
    const engine = await this.ready();
    engine?.config.triggerAttackRelease("G5", "16n", undefined, 0.6);
  }

  /** A soft blip when a finalizer is registered, an octave up when it runs and another when done. */
  async finalizerCreated() {
    const engine = await this.ready();
    engine?.finalizer.triggerAttackRelease(this.nextNote(0), "32n", undefined, 0.25);
  }

  async finalizerRunning() {
    const engine = await this.ready();
    engine?.finalizer.triggerAttackRelease(this.nextNote(1), "16n", undefined, 0.3);
  }

  async finalizerCompleted() {
    const engine = await this.ready();
    engine?.finalizer.triggerAttackRelease(this.nextNote(2), "8n", undefined, 0.35);
  }

  async notification() {
    const engine = await this.ready();
    if (!engine) return;

    const now = engine.Tone.now();
    engine.notification.triggerAttackRelease("C5", "16n", now, 0.4);
    engine.notification.triggerAttackRelease("E5", "16n", now + 0.12, 0.4);
  }
}

export const sounds = new TaskSounds();
