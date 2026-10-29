import { absolute, site } from "@/lib/site";

/**
 * The landing pages as Markdown for agents, served at `/index.md`, `/redis.md` and `/emails.md`
 * and through content negotiation. Keep them in step with the pages themselves.
 */

export type LandingPage = "index" | "redis" | "emails";

const directive = `> For the complete documentation index, see [llms.txt](${absolute("/llms.txt")}).`;

const pages: Record<LandingPage, () => string> = {
  index: () => `# ${site.name}

${directive}

${site.description}

## Packages

- [Redis for Effect](${absolute("/redis")}): a native Redis client with typed commands and scoped connections. Runs on Node.js, Bun and Upstash HTTP. Docs: ${absolute("/docs/redis.md")}
- [Email for Effect](${absolute("/emails")}): one Email service for 16 providers, with capability checks before sending, React templates and batches. Docs: ${absolute("/docs/emails.md")}
- Storage (coming soon): object storage with put, scoped get, head, delete and paginated listing.

## How it fits an Effect app

1. Your program stays an ordinary Effect program.
2. Each package adds a service to context, with typed errors.
3. You provide a Layer for it. The Layer owns clients and connections and closes them with the scope.
4. Swap the runtime, the provider or a test Layer without changing the program.

Source: ${site.github}
`,

  redis: () => `# Redis for Effect

${directive}

\`@effect-kit/redis\` is a native Redis client for Effect with typed commands, scoped connections, pipelines, transactions, Pub/Sub and Streams. It speaks RESP itself; Effect is its only dependency.

## When a connection drops

A \`ConnectionError\` says how far the command got. With \`delivery: "unsent"\` it never reached the server and is safe to retry. With \`delivery: "possibly-written"\` it may have been applied, so the client never sends it twice.

## Runtimes

- Node.js and Bun: native TCP, TLS or Unix sockets (\`RedisNode\`, \`RedisBun\`).
- Deno and Cloudflare Workers: HTTP and SSE through Upstash (\`RedisUpstash\`). WATCH, blocking reads, client tracking and cluster routing need a native socket.

## Cluster

Cluster Layers route each key to its hash slot and follow redirects. Keys that share a \`{hash tag}\` share a slot; a command that needs keys in different slots fails with \`ClusterError\` (\`cross-slot\`) before it is sent.

## Supported servers

Redis, Valkey, Dragonfly, KeyDB, Redict, Garnet, Apache Kvrocks and Upstash. Hosted: Redis Cloud and Aiven Valkey.

- Docs: ${absolute("/docs/redis.md")}
- Source: https://github.com/effect-kit/redis
`,

  emails: () => `# Email for Effect

${directive}

\`@effect-kit/emails\` is one Email service for Effect across 16 providers, including Resend, Amazon SES, Postmark, SendGrid, Mailgun and SMTP through Nodemailer. Install only the SDK you use.

## Checked before it leaves

Each adapter declares what it can carry. A message that needs a feature the provider lacks, such as an attachment through MailerSend, fails with an \`EmailError\` whose reason is \`UnsupportedFeatureError\`, before any request.

## Retries and idempotency

Every \`EmailError\` carries \`acceptance\` (\`notSubmitted\`, \`rejected\` or \`unknown\`), so code knows when sending again is safe. With an idempotency key, Resend replays the first response (keys kept 24 hours), Brevo rejects the duplicate with \`IdempotencyConflictError\` (30 minutes), and providers without idempotency refuse the key before sending.

## Templates and batches

\`EmailReact.render\` turns a React Email component into an HTML body and a plain-text body. \`Email.sendMany\` sends up to 1,000 messages with bounded concurrency and returns one \`Result\` per message, in order.

- Docs: ${absolute("/docs/emails.md")}
- Source: https://github.com/effect-kit/emails
`,
};

export const landingPaths: Record<string, LandingPage> = {
  "/": "index",
  "/redis": "redis",
  "/emails": "emails",
};

export const landingMarkdown = (page: LandingPage) => pages[page]();
