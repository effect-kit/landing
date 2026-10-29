import { Cause, Effect, Exit, Fiber, Option } from "effect";

import { sounds } from "./sounds";

/** What a node shows. Mirrors Visual Effect's `EffectState`. */
export type NodeState =
  | { readonly _tag: "Idle" }
  | { readonly _tag: "Running"; readonly startedAt: number }
  | {
      readonly _tag: "Succeeded";
      readonly value: string;
      readonly startedAt: number;
      readonly endedAt: number;
    }
  | {
      readonly _tag: "Failed";
      readonly error: string;
      readonly startedAt: number;
      readonly endedAt: number;
    }
  | { readonly _tag: "Interrupted"; readonly startedAt: number; readonly endedAt: number }
  | { readonly _tag: "Died"; readonly error: string };

export type NodeTag = NodeState["_tag"];

export interface Notification {
  readonly id: number;
  readonly text: string;
}

export interface TimelineSegment {
  readonly kind: "running" | "waiting";
  readonly start: number;
  readonly end: number | null;
}

/** A cleanup registered in a scope. Mirrors Visual Effect's `Finalizer`. */
export interface FinalizerCard {
  readonly id: string;
  readonly name: string;
  readonly state: "pending" | "running" | "completed";
}

export interface Snapshot {
  readonly nodes: Readonly<Record<string, NodeState>>;
  readonly notes: Readonly<Record<string, Notification>>;
  readonly timeline: readonly TimelineSegment[];
  readonly finalizers: readonly FinalizerCard[];
}

export const IDLE: NodeState = { _tag: "Idle" };
export const RESULT = "result";
const EMPTY: Snapshot = { nodes: {}, notes: {}, timeline: [], finalizers: [] };

export interface RunContext {
  /** Runs `effect` as the node `id`: running, then succeeded, failed or interrupted. */
  readonly step: <A, E, R>(
    id: string,
    effect: Effect.Effect<A, E, R>,
    show?: (value: A) => string,
  ) => Effect.Effect<A, E, R>;
  /** Shows a speech bubble above node `id` for two seconds. */
  readonly notify: (id: string, text: string) => Effect.Effect<void>;
  /**
   * A card in the finalizers panel. `register` adds it as pending (call it where the real
   * code registers the finalizer); `run` wraps the release so the card runs, then completes.
   */
  readonly finalizer: (
    id: string,
    name: string,
  ) => {
    readonly register: Effect.Effect<void>;
    readonly run: <A, E, R>(release: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
  };
}

export interface RunOptions {
  /** Nodes whose running spans are drawn on the schedule timeline. */
  readonly tracked: ReadonlySet<string>;
  readonly describeError: (error: unknown) => string;
}

const describeDefect = (defect: unknown) =>
  defect instanceof Error ? defect.message : String(defect);

/**
 * Runs one example's Effect program at a time and mirrors its nodes into an external store
 * for `useSyncExternalStore`. Each run gets a generation so updates from an interrupted
 * fiber never leak into the next run.
 */
export class VisualRun {
  private snapshot: Snapshot = EMPTY;
  private readonly listeners = new Set<() => void>();
  private fiber: Fiber.Fiber<unknown, unknown> | null = null;
  private generation = 0;
  private noteId = 0;
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly options: RunOptions) {}

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = () => this.snapshot;
  readonly getServerSnapshot = () => EMPTY;

  get running() {
    return this.fiber !== null;
  }

  private emit(next: Snapshot) {
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private setNode(id: string, state: NodeState) {
    const previous = this.snapshot.nodes[id]?._tag ?? "Idle";
    let { timeline } = this.snapshot;
    const now = performance.now();

    // Tracked nodes draw running spans; the gap until the result settles is drawn as waiting.
    if (this.options.tracked.has(id)) {
      const close = (segments: readonly TimelineSegment[]) =>
        segments.map((segment, index) =>
          index === segments.length - 1 && segment.end === null
            ? { ...segment, end: now }
            : segment,
        );

      if (state._tag === "Running") {
        timeline = [...close(timeline), { kind: "running", start: now, end: null }];
      } else if (previous === "Running") {
        const waiting = this.snapshot.nodes[RESULT]?._tag === "Running";
        timeline = [
          ...close(timeline),
          ...(waiting ? [{ kind: "waiting" as const, start: now, end: null }] : []),
        ];
      }
    }

    // The result settling ends the run, so any span still open is closed.
    if (id === RESULT && state._tag !== "Running") {
      timeline = timeline.map((segment) =>
        segment.end === null ? { ...segment, end: now } : segment,
      );
    }

    this.emit({ ...this.snapshot, nodes: { ...this.snapshot.nodes, [id]: state }, timeline });

    if (previous !== state._tag) playFor(state._tag);
  }

  private track<A, E, R>(
    generation: number,
    id: string,
    effect: Effect.Effect<A, E, R>,
    show: (value: A) => string,
  ): Effect.Effect<A, E, R> {
    const live = () => generation === this.generation;
    let startedAt = 0;

    return Effect.suspend(() => {
      startedAt = performance.now();
      if (live()) this.setNode(id, { _tag: "Running", startedAt });

      return effect;
    }).pipe(
      Effect.onExit((exit) =>
        Effect.sync(() => {
          if (!live()) return;

          const endedAt = performance.now();
          if (Exit.isSuccess(exit)) {
            this.setNode(id, { _tag: "Succeeded", value: show(exit.value), startedAt, endedAt });
          } else if (Cause.hasInterruptsOnly(exit.cause)) {
            this.setNode(id, { _tag: "Interrupted", startedAt, endedAt });
          } else if (Cause.hasDies(exit.cause)) {
            this.setNode(id, { _tag: "Died", error: describeDefect(Cause.squash(exit.cause)) });
          } else {
            const error = Option.getOrUndefined(Cause.findErrorOption(exit.cause));
            this.setNode(id, {
              _tag: "Failed",
              error: this.options.describeError(error),
              startedAt,
              endedAt,
            });
          }
        }),
      ),
    );
  }

  /** Interrupts the current run (if any) and starts `build`'s program. */
  start(build: (context: RunContext) => Effect.Effect<string, unknown>) {
    this.clear();

    const generation = this.generation;
    const context: RunContext = {
      step: (id, effect, show = () => "") => this.track(generation, id, effect, show),
      notify: (id, text) =>
        Effect.sync(() => {
          if (generation === this.generation) this.notify(id, text);
        }),
      finalizer: (id, name) => {
        const set = (state: FinalizerCard["state"]) =>
          Effect.sync(() => {
            if (generation === this.generation) this.setFinalizer({ id, name, state });
          });

        return {
          register: set("pending"),
          run: (release) =>
            set("running").pipe(Effect.andThen(release), Effect.ensuring(set("completed"))),
        };
      },
    };

    const program = this.track(
      generation,
      RESULT,
      Effect.suspend(() => build(context)),
      (value) => value,
    );

    const fiber = Effect.runFork(program);
    this.fiber = fiber;

    fiber.addObserver(() => {
      if (this.fiber === fiber) this.fiber = null;
      this.emit({ ...this.snapshot });
    });
  }

  /** Interrupts the running program; its nodes turn orange. */
  stop() {
    const fiber = this.fiber;
    if (fiber) Effect.runFork(Fiber.interrupt(fiber));
  }

  /** Back to idle. `silent` skips the reset cue (used for control changes and scrolling away). */
  reset({ silent = false }: { silent?: boolean } = {}) {
    this.clear();

    if (!silent) void sounds.reset();
  }

  private clear() {
    this.generation++;

    const fiber = this.fiber;
    this.fiber = null;
    // The old generation's exit handlers see a stale generation, so they stay silent.
    if (fiber) Effect.runFork(Fiber.interrupt(fiber));

    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();

    this.emit(EMPTY);
  }

  private setFinalizer(card: FinalizerCard) {
    const { finalizers } = this.snapshot;
    const exists = finalizers.some((entry) => entry.id === card.id);

    this.emit({
      ...this.snapshot,
      finalizers: exists
        ? finalizers.map((entry) => (entry.id === card.id ? card : entry))
        : [...finalizers, card],
    });

    if (card.state === "pending") void sounds.finalizerCreated();
    else if (card.state === "running") void sounds.finalizerRunning();
    else void sounds.finalizerCompleted();
  }

  private notify(id: string, text: string) {
    const note = { id: this.noteId++, text };
    this.emit({ ...this.snapshot, notes: { ...this.snapshot.notes, [id]: note } });
    void sounds.notification();

    const timer = setTimeout(() => {
      this.timers.delete(timer);
      // A newer note on the same node replaced this one; leave it for its own timer.
      if (this.snapshot.notes[id]?.id !== note.id) return;

      const { [id]: _removed, ...notes } = this.snapshot.notes;
      this.emit({ ...this.snapshot, notes });
    }, 2000);

    this.timers.add(timer);
  }

  dispose() {
    this.clear();
    this.listeners.clear();
  }
}

function playFor(tag: NodeTag) {
  switch (tag) {
    case "Running":
      return void sounds.running();
    case "Succeeded":
      return void sounds.success();
    case "Failed":
      return void sounds.failure();
    case "Interrupted":
      return void sounds.interrupted();
    case "Died":
      return void sounds.death();
    case "Idle":
  }
}
