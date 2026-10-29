import { type EmailProviderId, emailProviders, getEmailProvider } from "./email-providers";

/**
 * Every code sample on the marketing pages. They use the packages' real APIs (taken from the
 * READMEs and tests) and are highlighted on the server by `highlightSnippets`.
 */
interface Snippet {
  readonly lang: "ts" | "tsx" | "bash";
  readonly code: string;
}

const ts = (code: string): Snippet => ({ lang: "ts", code: code.trim() });
const tsx = (code: string): Snippet => ({ lang: "tsx", code: code.trim() });

// ---------------------------------------------------------------------------
// Redis
// ---------------------------------------------------------------------------

const redisSnippets = {
  "redis.quickstart": ts(`
import { Effect, Option } from "effect";
import { Redis } from "@effect-kit/redis";
import { RedisNode } from "@effect-kit/redis/node";

const RedisLive = RedisNode.layer({ url: "redis://localhost:6379" });

const program = Effect.gen(function* () {
  const redis = yield* Redis;

  yield* redis.set("greeting", "Hello from Effect", {
    expiry: { type: "EX", value: 60 },
  });

  const greeting = yield* redis.get("greeting"); // Option<string>
  const visits = yield* redis.incr("visits"); // bigint

  return { greeting: Option.getOrElse(greeting, () => "Not found"), visits };
});

await Effect.runPromise(program.pipe(Effect.provide(RedisLive)));
`),
  "redis.uncertain": ts(`
const markPaid = redis.set("order:42", "paid");

const program = markPaid.pipe(
  Effect.catchTag("ConnectionError", (error) =>
    error.delivery === "unsent"
      ? markPaid // never reached the server: safe to send again
      : redis.get("order:42"), // may have been applied: read it first
  ),
);
`),
  "redis.keys": ts(`
const User = Schema.Struct({ name: Schema.String, active: Schema.Boolean });
const userKey = RedisKey.json("user:42", User);

const saveUser = Effect.gen(function* () {
  const redis = yield* Redis;
  yield* redis.setKey(userKey, { name: "Ada", active: true });
  return yield* redis.getKey(userKey);
  //           ^? Option<{ name: string; active: boolean }>
});
`),
  "redis.pipeline": ts(`
const [saved, visits] = yield* redis.pipeline([
  Commands.set("{account:42}:name", "Ada"),
  Commands.incr("{account:42}:visits"),
]);

// Each command reports on its own; one failure doesn't hide the others.
if (Result.isFailure(visits)) return yield* visits.failure;
`),
  "redis.transaction": ts(`
const sessions = yield* RedisSessions;

const outcome = yield* sessions.watch(["balance"], (session) =>
  session.transaction([Commands.set("balance", "100")]),
);

// outcome: { _tag: "Committed", results } | { _tag: "Conflict" }
`),
  "redis.pubsub": ts(`
const program = Effect.gen(function* () {
  const redis = yield* Redis;
  const pubsub = yield* RedisPubSub;
  const subscription = yield* pubsub.subscribe(["events"]);

  yield* redis.publish("events", "hello");

  return yield* subscription.messages.pipe(Stream.take(1), Stream.runCollect);
});

program.pipe(Effect.scoped, Effect.provide(RedisLive));
`),
  "redis.streams": ts(`
const streams = yield* RedisStreams;

yield* streams
  .consume("billing", "worker-1", ["orders"], (message) => handleOrder(message.entry))
  .pipe(Stream.runDrain);

// A failed handler leaves the entry pending.
// The next consume drains pending history first, then acknowledges.
`),
  "redis.runtime.node": ts(`
import { Config, Effect } from "effect";
import { Redis } from "@effect-kit/redis";
import { RedisNode } from "@effect-kit/redis/node";

const program = Effect.gen(function* () {
  const redis = yield* Redis;
  return yield* redis.incr("visits");
});

const RedisLive = RedisNode.layerConfig(
  Config.all({ url: Config.String("REDIS_URL") }),
);

program.pipe(Effect.provide(RedisLive));
`),
  "redis.runtime.bun": ts(`
import { Config, Effect } from "effect";
import { Redis } from "@effect-kit/redis";
import { RedisBun } from "@effect-kit/redis/bun";

const program = Effect.gen(function* () {
  const redis = yield* Redis;
  return yield* redis.incr("visits");
});

const RedisLive = RedisBun.layerConfig(
  Config.all({ url: Config.String("REDIS_URL") }),
);

program.pipe(Effect.provide(RedisLive));
`),
  "redis.runtime.upstash": ts(`
import { Config, Effect } from "effect";
import { Redis } from "@effect-kit/redis";
import { RedisUpstash } from "@effect-kit/redis/upstash";

const program = Effect.gen(function* () {
  const redis = yield* Redis;
  return yield* redis.incr("visits");
});

const RedisLive = RedisUpstash.layerConfig(
  Config.all({
    url: Config.String("UPSTASH_REDIS_REST_URL"),
    token: Config.Redacted("UPSTASH_REDIS_REST_TOKEN"),
  }),
);

program.pipe(Effect.provide(RedisLive));
`),
} satisfies Record<string, Snippet>;

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

const emailSwapSnippets = Object.fromEntries(
  emailProviders.map((provider) => [
    `emails.swap.${provider.id}`,
    ts(`
import { Effect } from "effect";
import { Email } from "@effect-kit/emails";
import * as ${provider.namespace} from "@effect-kit/emails/${provider.id}";

const program = Effect.gen(function* () {
  const email = yield* Email;
  return yield* email.send(welcome);
});

program.pipe(Effect.provide(${provider.layer}));
`),
  ]),
) as Record<`emails.swap.${EmailProviderId}`, Snippet>;

const guardProviders = ["resend", "postmark", "mailersend", "brevo", "plunk"] as const;
export type GuardProviderId = (typeof guardProviders)[number];
export { guardProviders };

const emailGuardSnippets = Object.fromEntries(
  guardProviders.map((id) => {
    const provider = getEmailProvider(id);
    return [
      `emails.guard.${id}`,
      ts(`
const invoice = {
  from: "billing@example.com",
  to: "ada@example.com",
  subject: "Your invoice",
  html: "<p>Your invoice is attached.</p>",
  attachments: [{ filename: "invoice.pdf", content: pdf, contentType: "application/pdf" }],
};

const program = Effect.gen(function* () {
  const email = yield* Email;
  return yield* email.send(invoice);
});

program.pipe(Effect.provide(${provider.layer}));
`),
    ];
  }),
) as Record<`emails.guard.${GuardProviderId}`, Snippet>;

const emailSnippets = {
  "emails.quickstart": ts(`
import { Effect } from "effect";
import { Email } from "@effect-kit/emails";
import * as Resend from "@effect-kit/emails/resend";

const program = Effect.gen(function* () {
  const email = yield* Email;

  return yield* email.send({
    from: "hello@example.com",
    to: "ada@example.com",
    subject: "Welcome",
    text: "Your account is ready.",
    html: "<p>Your account is ready.</p>",
  });
});

const receipt = await Effect.runPromise(
  program.pipe(Effect.provide(Resend.layerConfig())),
);
`),
  "emails.batch": ts(`
const outcomes = yield* Email.sendMany(
  customers.map((customer) => ({
    message: { from, to: customer.email, subject: "Your receipt", html: receipt(customer) },
    options: { idempotencyKey: \`receipt/\${customer.id}\` },
  })),
  { concurrency },
);
// ReadonlyArray<Result<SendReceipt, EmailError>>, in input order
`),
  "emails.react": tsx(`
import * as EmailReact from "@effect-kit/emails/react";

const Welcome = ({ name }: { name: string }) => (
  <Html>
    <Heading>Welcome, {name}</Heading>
    <Text>Your account is ready. Sign in to finish setting up your workspace.</Text>
    <Button href="https://example.com/start">Open dashboard</Button>
  </Html>
);

const content = yield* EmailReact.render(<Welcome name="Ada" />); // { html, text }
yield* email.send({ from, to, subject: "Welcome", ...content });
`),
  "emails.errors": ts(`
email.send(message).pipe(
  Effect.catchReason("EmailError", "RateLimitedError", (reason) =>
    Effect.succeed(reason.retryAfter), // Duration | undefined
  ),
);
`),
  "emails.testing": ts(`
import { EmailTest } from "@effect-kit/emails/testing";

it.effect("sends a welcome email", () =>
  Effect.gen(function* () {
    const email = yield* Email;
    const recorder = yield* EmailTest;

    yield* signUp({ email: "ada@example.com" });

    const [sent] = yield* recorder.messages;
    expect(sent.subject).toBe("Welcome");
  }).pipe(Effect.provide(EmailTest.layer())),
);
`),
} satisfies Record<string, Snippet>;

export const snippets = {
  ...redisSnippets,
  ...emailSnippets,
  ...emailSwapSnippets,
  ...emailGuardSnippets,
};

export type SnippetId = keyof typeof snippets;

export function isSnippetId(id: string): id is SnippetId {
  return id in snippets;
}
