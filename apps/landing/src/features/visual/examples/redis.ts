import { Context, Duration, Effect, Layer, Option, Schedule } from "effect";

import { visualSnippets } from "../snippets";
import { always, span, type VisualExampleDefinition, type VisualNode } from "./definition";
import { ConnectionError, ROUND_TRIP, ServerError, tagOf } from "./simulated";

export const redisRetry: VisualExampleDefinition = {
  id: "redis-retry",
  category: "redis",
  api: "Effect.retry",
  qualifier: "unsent",
  description: "Retry only what never reached Redis.",
  control: {
    label: "Drop",
    options: [
      { value: "before", label: "before write" },
      { value: "after", label: "after write" },
    ],
    initial: "before",
  },
  code: () => "before",
  nodes: [{ id: "write", label: "redis.set", highlight: always('redis.set("order:42", "paid")') }],
  result: {
    label: "program",
    highlight: always(span(visualSnippets["redis-retry"].before, "const program", "})")),
    timer: true,
  },
  timeline: ["write"],
  simulated: "Simulated Redis: the connection drops on the first two attempts.",
  describeError: (error) =>
    error instanceof ConnectionError ? `delivery: "${error.delivery}"` : tagOf(error),
  build: ({ step, notify }, drop) => {
    let attempt = 0;

    const redis = {
      set: (_key: string, _value: string) =>
        step(
          "write",
          Effect.gen(function* () {
            attempt++;

            if (drop === "after") {
              // The server applied SET, then the reply was lost.
              yield* Effect.sleep(ROUND_TRIP);
              return yield* new ConnectionError({
                reason: "closed",
                delivery: "possibly-written",
                generation: attempt,
              });
            }

            if (attempt <= 2) {
              yield* Effect.sleep(ROUND_TRIP * 0.6);
              return yield* new ConnectionError({
                reason: "closed",
                delivery: "unsent",
                generation: attempt,
              });
            }

            yield* Effect.sleep(ROUND_TRIP);
          }),
          () => "OK",
        ),
    };

    // The program shown next to the visualization. The tap only drives the bubble.
    const write = redis.set("order:42", "paid");
    const program = Effect.retry(write, {
      schedule: Schedule.exponential("200 millis").pipe(
        Schedule.tap((meta) =>
          meta.input instanceof ConnectionError && meta.input.delivery === "unsent"
            ? notify("result", `retry in ${Duration.toMillis(meta.duration)}ms`)
            : Effect.void,
        ),
      ),
      times: 5,
      while: (e) => e._tag === "ConnectionError" && e.delivery === "unsent",
    });

    return program.pipe(Effect.as("OK"));
  },
};

const commandHighlights = {
  set: {
    sequential: 'redis.set("{user:42}:name", "Ada")',
    pipeline: 'Commands.set("{user:42}:name", "Ada")',
  },
  incr: {
    sequential: 'redis.incr("{user:42}:visits")',
    pipeline: 'Commands.incr("{user:42}:visits")',
  },
  get: { sequential: 'redis.get("{user:42}:plan")', pipeline: 'Commands.get("{user:42}:plan")' },
} as const;

const commandNode = (id: keyof typeof commandHighlights, label: string): VisualNode => ({
  id,
  label,
  highlight: (mode) => commandHighlights[id][mode === "pipeline" ? "pipeline" : "sequential"],
});

export const redisPipeline: VisualExampleDefinition = {
  id: "redis-pipeline",
  category: "redis",
  api: "redis.pipeline",
  description: "Three commands in one round trip, each with its own Result.",
  control: {
    label: "Send",
    options: [
      { value: "sequential", label: "one by one" },
      { value: "pipeline", label: "pipeline" },
    ],
    initial: "sequential",
  },
  code: (mode) => mode,
  nodes: [commandNode("set", "SET"), commandNode("incr", "INCR"), commandNode("get", "GET")],
  result: {
    label: "replies",
    highlight: (mode) =>
      mode === "pipeline"
        ? span(visualSnippets["redis-pipeline"].pipeline, "const [name", "])")
        : visualSnippets["redis-pipeline"].sequential,
    timer: true,
  },
  simulated: `Simulated Redis: every round trip takes ${ROUND_TRIP}ms.`,
  describeError: tagOf,
  build: ({ step }, mode) => {
    // Each reply arrives after one round trip; pipelined replies trail by a few ms.
    const reply = <A>(
      id: keyof typeof commandHighlights,
      value: A,
      show: (a: A) => string,
      lag = 0,
    ) => step(id, Effect.sleep(ROUND_TRIP + lag).pipe(Effect.as(value)), show);

    const commands = (lag: number) =>
      [
        reply("set", undefined, always("OK")),
        reply("incr", 8n, (n) => String(n), lag),
        reply("get", Option.some("pro"), (plan) => Option.getOrElse(plan, () => "nil"), lag * 2),
      ] as const;

    if (mode === "pipeline") {
      return Effect.all(commands(12), { concurrency: "unbounded" }).pipe(Effect.as("3 replies"));
    }

    return Effect.gen(function* () {
      const [set, incr, get] = commands(0);
      yield* set;
      yield* incr;
      yield* get;
      return "3 replies";
    });
  },
};

type Outcome = { readonly _tag: "Committed" } | { readonly _tag: "Conflict" };

const watchCode = visualSnippets["redis-watch"].watch;

export const redisWatch: VisualExampleDefinition = {
  id: "redis-watch",
  category: "redis",
  api: "sessions.watch",
  description: "A WATCH conflict comes back as a value, so the program runs it again.",
  control: {
    label: "Other client",
    options: [
      { value: "writes", label: "writes stock:42" },
      { value: "idle", label: "stays idle" },
    ],
    initial: "writes",
  },
  code: always("watch"),
  nodes: [
    { id: "watch", label: "WATCH", highlight: always('sessions.watch(["stock:42"]') },
    { id: "get", label: "GET", highlight: always('session.get("stock:42")') },
    { id: "writer", label: "other client", highlight: always(null) },
    {
      id: "exec",
      label: "EXEC",
      highlight: always('session.transaction([Commands.set("stock:42", String(left))])'),
    },
  ],
  result: {
    label: "outcome",
    highlight: always(span(watchCode, "const outcome", "});")),
    timer: true,
  },
  simulated: "Simulated Redis: the other client writes between GET and EXEC once.",
  describeError: tagOf,
  build: ({ step, notify }, other) => {
    // WATCH remembers the key's version; EXEC aborts with a null reply if it moved.
    let stored = 3;
    let version = 0;
    let writes = other === "writes" ? 1 : 0;

    const Commands = { set: (key: string, value: string) => ({ key, value }) };

    const client = {
      watched: 0,
      get: (_key: string) =>
        step(
          "get",
          Effect.sleep(ROUND_TRIP * 0.6).pipe(Effect.as(Option.some(String(stored)))),
          (value) => Option.getOrElse(value, () => "nil"),
        ),
      transaction: (commands: readonly { readonly key: string; readonly value: string }[]) =>
        Effect.gen(function* () {
          if (writes > 0) {
            writes--;
            yield* step(
              "writer",
              Effect.sleep(ROUND_TRIP * 0.8).pipe(
                Effect.tap(() =>
                  Effect.sync(() => {
                    stored--;
                    version++;
                  }),
                ),
                Effect.map(() => String(stored)),
              ),
              (value) => `SET ${value}`,
            );
          }

          return yield* step(
            "exec",
            Effect.sleep(ROUND_TRIP * 0.6).pipe(
              Effect.map((): Outcome => {
                if (version !== client.watched) return { _tag: "Conflict" };

                for (const command of commands) stored = Number(command.value);
                return { _tag: "Committed" };
              }),
            ),
            (outcome) => outcome._tag,
          );
        }),
    };

    const sessions = {
      watch: <A, E>(_keys: readonly [string], use: (s: typeof client) => Effect.Effect<A, E>) =>
        step(
          "watch",
          Effect.sleep(ROUND_TRIP * 0.5).pipe(
            Effect.tap(() =>
              Effect.sync(() => {
                client.watched = version;
              }),
            ),
          ),
          always("OK"),
        ).pipe(Effect.andThen(Effect.suspend(() => use(client)))),
    };

    // The program shown next to the visualization. The tap only drives the bubble.
    const reserve = sessions
      .watch(["stock:42"], (session) =>
        Effect.gen(function* () {
          const stock = yield* session.get("stock:42");
          const left = Number(Option.getOrElse(stock, () => "0")) - 1;
          return yield* session.transaction([Commands.set("stock:42", String(left))]);
        }),
      )
      .pipe(
        Effect.tap((outcome) =>
          outcome._tag === "Conflict" ? notify("result", "Conflict: run again") : Effect.void,
        ),
      );

    return Effect.repeat(reserve, {
      until: (outcome) => outcome._tag === "Committed",
    }).pipe(Effect.map((outcome) => outcome._tag));
  },
};

class SimRedis extends Context.Service<
  SimRedis,
  {
    readonly set: (key: string, value: string) => Effect.Effect<void>;
    readonly incr: (key: string) => Effect.Effect<bigint, ServerError>;
  }
>()("visual-effect/SimRedis") {}

const scopeLayer = 'RedisNode.layer({ url: "redis://localhost:6379" })';

export const redisScope: VisualExampleDefinition = {
  id: "redis-scope",
  category: "redis",
  api: "RedisNode.layer",
  qualifier: "scope",
  description: "The Layer closes its connection however the program ends.",
  control: {
    label: "Outcome",
    options: [
      { value: "succeed", label: "succeed" },
      { value: "fail", label: "fail" },
      { value: "interrupt", label: "interrupt" },
    ],
    initial: "succeed",
  },
  code: (outcome) => (outcome === "fail" || outcome === "interrupt" ? outcome : "succeed"),
  nodes: [
    { id: "connect", label: "connect", highlight: always(scopeLayer) },
    { id: "set", label: "SET", highlight: always('redis.set("job:7", "running")') },
    {
      id: "incr",
      label: "INCR",
      highlight: (outcome) =>
        outcome === "fail"
          ? 'redis.incr("job:7")'
          : outcome === "interrupt"
            ? "Effect.interrupt"
            : 'redis.incr("jobs:done")',
    },
  ],
  result: {
    label: "result",
    highlight: always(`program.pipe(Effect.provide(${scopeLayer}))`),
    timer: true,
  },
  finalizers: true,
  simulated: "Simulated Redis. The finalizer is the client's own connection close.",
  describeError: (error) =>
    error instanceof ServerError ? `ServerError (${error.code})` : tagOf(error),
  build: ({ step, finalizer }, outcome) => {
    const close = finalizer("close", "close connection");
    let done = 7n;

    const client = SimRedis.of({
      set: (_key, _value) => step("set", Effect.sleep(ROUND_TRIP * 0.6), always("OK")),
      incr: (key) =>
        step(
          "incr",
          Effect.gen(function* () {
            yield* Effect.sleep(ROUND_TRIP * 0.6);
            // job:7 holds "running", so INCR replies with an error.
            if (key === "job:7")
              return yield* new ServerError({ delivery: "replied", code: "ERR" });

            return ++done;
          }),
          (n) => String(n),
        ),
    });

    // Building the Layer opens the connection and registers its close in the Layer's scope.
    const layer = Layer.effect(
      SimRedis,
      Effect.acquireRelease(
        step("connect", Effect.sleep(ROUND_TRIP), always("ready")).pipe(
          Effect.tap(() => close.register),
        ),
        () => close.run(Effect.sleep(ROUND_TRIP * 0.8)),
      ).pipe(Effect.as(client)),
    );

    const program = Effect.gen(function* () {
      const redis = yield* SimRedis;
      yield* redis.set("job:7", "running");
      if (outcome === "interrupt") return yield* Effect.interrupt;

      return yield* redis.incr(outcome === "fail" ? "job:7" : "jobs:done");
    });

    return program.pipe(Effect.provide(layer), Effect.map(String));
  },
};
