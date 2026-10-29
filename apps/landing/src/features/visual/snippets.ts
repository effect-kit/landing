/**
 * Code shown next to each visualization, one entry per control value. Written against the
 * real APIs: `Redis#set` / `Redis#pipeline` / `Commands` / `RedisSessions#watch` /
 * `RedisNode.layer` from @effect-kit/redis, `Email#send` / `Email.sendMany` /
 * `EmailReact.render` from @effect-kit/emails, `Effect.retry` / `Effect.repeat` options from
 * effect 4. Plain data so the server fn that tokenizes them stays small.
 */
export const visualSnippets = {
  "redis-retry": {
    before: `const write = redis.set("order:42", "paid");
const program = Effect.retry(write, {
  schedule: Schedule.exponential("200 millis"),
  times: 5,
  while: (e) => e._tag === "ConnectionError" && e.delivery === "unsent",
});`,
  },
  "redis-pipeline": {
    sequential: `const name = yield* redis.set("{user:42}:name", "Ada");
const visits = yield* redis.incr("{user:42}:visits");
const plan = yield* redis.get("{user:42}:plan");`,
    pipeline: `const [name, visits, plan] = yield* redis.pipeline([
  Commands.set("{user:42}:name", "Ada"),
  Commands.incr("{user:42}:visits"),
  Commands.get("{user:42}:plan"),
]);`,
  },
  "redis-watch": {
    watch: `const reserve = sessions.watch(["stock:42"], (session) =>
  Effect.gen(function* () {
    const stock = yield* session.get("stock:42");
    const left = Number(Option.getOrElse(stock, () => "0")) - 1;
    return yield* session.transaction([Commands.set("stock:42", String(left))]);
  }),
);

const outcome = yield* Effect.repeat(reserve, {
  until: (outcome) => outcome._tag === "Committed",
});`,
  },
  "redis-scope": {
    succeed: `const program = Effect.gen(function* () {
  const redis = yield* Redis;
  yield* redis.set("job:7", "running");
  return yield* redis.incr("jobs:done");
});

program.pipe(Effect.provide(RedisNode.layer({ url: "redis://localhost:6379" })));`,
    fail: `const program = Effect.gen(function* () {
  const redis = yield* Redis;
  yield* redis.set("job:7", "running");
  return yield* redis.incr("job:7");
});

program.pipe(Effect.provide(RedisNode.layer({ url: "redis://localhost:6379" })));`,
    interrupt: `const program = Effect.gen(function* () {
  const redis = yield* Redis;
  yield* redis.set("job:7", "running");
  return yield* Effect.interrupt;
});

program.pipe(Effect.provide(RedisNode.layer({ url: "redis://localhost:6379" })));`,
  },
  "emails-batch": {
    "1": `const outcomes = yield* Email.sendMany(
  orders.map((order) => ({ message: receipt(order) })),
  { concurrency: 1 },
);
// ReadonlyArray<Result<SendReceipt, EmailError>>, in input order`,
    "3": `const outcomes = yield* Email.sendMany(
  orders.map((order) => ({ message: receipt(order) })),
  { concurrency: 3 },
);
// ReadonlyArray<Result<SendReceipt, EmailError>>, in input order`,
    "6": `const outcomes = yield* Email.sendMany(
  orders.map((order) => ({ message: receipt(order) })),
  { concurrency: 6 },
);
// ReadonlyArray<Result<SendReceipt, EmailError>>, in input order`,
  },
  "emails-capability": {
    resend: `const program = Effect.gen(function* () {
  const email = yield* Email;
  return yield* email.send({ from, to, subject, html, attachments: [invoice] });
});
program.pipe(Effect.provide(Resend.layerConfig()));`,
    mailersend: `const program = Effect.gen(function* () {
  const email = yield* Email;
  return yield* email.send({ from, to, subject, html, attachments: [invoice] });
});
program.pipe(Effect.provide(MailerSend.layerConfig()));`,
  },
  "emails-acceptance": {
    retry: `const send = email.send({ from, to, subject, text });
const program = Effect.retry(send, {
  schedule: Schedule.exponential("250 millis"),
  times: 3,
  while: (error) => error.acceptance === "notSubmitted",
});`,
  },
  "emails-react": {
    htmlAndText: `const Receipt = ({ id }: { id: string }) => <p>Order {id} is paid.</p>;

const content = yield* EmailReact.render(<Receipt id="42" />);
const receipt = yield* email.send({ from, to, subject, ...content });`,
    text: `const Receipt = ({ id }: { id: string }) => <p>Order {id} is paid.</p>;

const content = yield* EmailReact.render(<Receipt id="42" />, { mode: "text" });
const receipt = yield* email.send({ from, to, subject, ...content });`,
  },
} as const satisfies Record<string, Record<string, string>>;

export type VisualExampleId = keyof typeof visualSnippets;
export type VisualVariant<Id extends VisualExampleId> = keyof (typeof visualSnippets)[Id] & string;
export type VisualCodeKey = `${VisualExampleId}:${string}`;

/** Snippets that contain JSX. Everything else is plain TypeScript. */
export const visualSnippetLang = (id: VisualExampleId): "ts" | "tsx" =>
  id === "emails-react" ? "tsx" : "ts";

export const visualExampleIds = Object.keys(visualSnippets) as VisualExampleId[];
