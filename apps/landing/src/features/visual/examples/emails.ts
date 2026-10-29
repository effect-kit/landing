import { Duration, Effect, Result, Schedule } from "effect";

import { getEmailProvider } from "@/content/email-providers";

import { visualSnippets } from "../snippets";
import { always, span, type VisualExampleDefinition } from "./definition";
import {
  EmailError,
  RateLimitedError,
  ROUND_TRIP,
  tagOf,
  TimeoutError,
  TransportError,
  UnsupportedFeatureError,
} from "./simulated";

const MESSAGES = 6;
const RATE_LIMITED = 3;
/** Fixed latencies so runs compare across concurrency settings. */
const latency = (index: number) => 420 + ((index * 5) % 6) * 70;

export const emailsBatch: VisualExampleDefinition = {
  id: "emails-batch",
  category: "emails",
  api: "Email.sendMany",
  description: "One Result per message, so one failure never fails the batch.",
  control: {
    label: "Concurrency",
    options: [
      { value: "1", label: "1" },
      { value: "3", label: "3" },
      { value: "6", label: "6" },
    ],
    initial: "3",
  },
  code: (concurrency) => concurrency,
  nodes: Array.from({ length: MESSAGES }, (_, index) => ({
    id: `m${index}`,
    label: `#${index + 1}`,
    highlight: always("receipt(order)"),
  })),
  result: {
    label: "outcomes",
    highlight: (concurrency) =>
      span(
        visualSnippets["emails-batch"][concurrency === "1" ? "1" : concurrency === "6" ? "6" : "3"],
        "const outcomes",
        "\n)",
      ),
    timer: true,
  },
  simulated: `Simulated provider: message #${RATE_LIMITED + 1} is rate limited.`,
  describeError: (error) => (error instanceof EmailError ? error.reason._tag : tagOf(error)),
  build: ({ step }, concurrency) => {
    const send = (index: number) =>
      step(
        `m${index}`,
        Effect.gen(function* () {
          yield* Effect.sleep(latency(index));

          if (index === RATE_LIMITED) {
            return yield* new EmailError({
              provider: "resend",
              operation: "send",
              acceptance: "rejected",
              reason: new RateLimitedError({ retryAfter: Duration.seconds(1) }),
            });
          }

          return { provider: "resend", status: "accepted" as const };
        }),
        (receipt) => receipt.status,
      );

    // What Email.sendMany does with the service: forEach with bounded concurrency, and
    // every send turned into a Result so one failure never fails the batch.
    return Effect.forEach(
      Array.from({ length: MESSAGES }, (_, index) => index),
      (index) => send(index).pipe(Effect.result),
      { concurrency: Number(concurrency) },
    ).pipe(
      Effect.map((outcomes) => {
        const failed = outcomes.filter(Result.isFailure).length;

        return `${outcomes.length - failed} ok, ${failed} failed`;
      }),
    );
  },
};

export const emailsCapability: VisualExampleDefinition = {
  id: "emails-capability",
  category: "emails",
  api: "email.send",
  qualifier: "capabilities",
  description: "An adapter without attachments fails before it makes a request.",
  control: {
    label: "Provider",
    options: [
      { value: "resend", label: getEmailProvider("resend").name },
      { value: "mailersend", label: getEmailProvider("mailersend").name },
    ],
    initial: "resend",
  },
  condition: {
    label: "Rate limit",
    options: [
      { value: "under", label: "Under limit" },
      { value: "over", label: "Over limit" },
    ],
    initial: "under",
  },
  code: (provider) => provider,
  nodes: [
    { id: "check", label: "capabilities", highlight: always("attachments: [invoice]") },
    {
      id: "request",
      label: "request",
      highlight: (provider) =>
        `${getEmailProvider(provider === "mailersend" ? "mailersend" : "resend").namespace}.layerConfig()`,
    },
  ],
  result: {
    label: "send",
    highlight: always("email.send({ from, to, subject, html, attachments: [invoice] })"),
  },
  simulated: "Simulated provider API. Capabilities are the adapters' own.",
  describeError: (error) =>
    error instanceof EmailError && error.reason instanceof UnsupportedFeatureError
      ? `UnsupportedFeatureError (${error.reason.feature})`
      : error instanceof EmailError
        ? error.reason._tag
        : tagOf(error),
  build: ({ step }, providerId, rateLimit) => {
    const provider = getEmailProvider(providerId === "mailersend" ? "mailersend" : "resend");

    const email = {
      send: (message: { readonly attachments: readonly string[] }) =>
        Effect.gen(function* () {
          yield* step(
            "check",
            Effect.gen(function* () {
              yield* Effect.sleep(260);

              if (message.attachments.length > 0 && !provider.capabilities.attachments) {
                return yield* new EmailError({
                  provider: provider.id,
                  operation: "send",
                  acceptance: "notSubmitted",
                  reason: new UnsupportedFeatureError({ feature: "attachments" }),
                });
              }
            }),
            () => "ok",
          );

          return yield* step(
            "request",
            Effect.gen(function* () {
              yield* Effect.sleep(ROUND_TRIP * 1.5);

              // The provider answered 429: it saw the request and turned it away.
              if (rateLimit === "over") {
                return yield* new EmailError({
                  provider: provider.id,
                  operation: "send",
                  acceptance: "rejected",
                  reason: new RateLimitedError({ retryAfter: Duration.seconds(1) }),
                });
              }

              return { provider: provider.id, status: "accepted" as const };
            }),
            (receipt) => receipt.status,
          );
        }),
    };

    return email
      .send({ attachments: ["invoice.pdf"] })
      .pipe(Effect.map((receipt) => receipt.status));
  },
};

export const emailsAcceptance: VisualExampleDefinition = {
  id: "emails-acceptance",
  category: "emails",
  api: "Effect.retry",
  qualifier: "acceptance",
  description: "Retry a send only when the provider never got it.",
  control: {
    label: "Failure",
    options: [
      { value: "refused", label: "conn refused" },
      { value: "timeout", label: "no reply" },
    ],
    initial: "refused",
  },
  code: always("retry"),
  nodes: [
    {
      id: "send",
      label: "email.send",
      highlight: always("email.send({ from, to, subject, text })"),
    },
  ],
  result: {
    label: "program",
    highlight: always(span(visualSnippets["emails-acceptance"].retry, "const program", "});")),
    timer: true,
  },
  timeline: ["send"],
  simulated: "Simulated SMTP server: it refuses the first two connections, or never replies.",
  describeError: (error) =>
    error instanceof EmailError ? `acceptance: "${error.acceptance}"` : tagOf(error),
  build: ({ step, notify }, failure) => {
    let attempt = 0;

    const email = {
      send: (_message: { readonly subject: string }) =>
        step(
          "send",
          Effect.gen(function* () {
            attempt++;

            if (failure === "timeout") {
              // The message went out; the reply never came back.
              yield* Effect.sleep(ROUND_TRIP * 3);
              return yield* new EmailError({
                provider: "nodemailer",
                operation: "send",
                acceptance: "unknown",
                reason: new TimeoutError(),
              });
            }

            if (attempt <= 2) {
              yield* Effect.sleep(ROUND_TRIP * 0.4);
              return yield* new EmailError({
                provider: "nodemailer",
                operation: "send",
                acceptance: "notSubmitted",
                reason: new TransportError(),
              });
            }

            yield* Effect.sleep(ROUND_TRIP);
            return { provider: "nodemailer", status: "accepted" as const };
          }),
          (receipt) => receipt.status,
        ),
    };

    // The program shown next to the visualization. The tap only drives the bubble.
    const send = email.send({ subject: "Your receipt" });
    const program = Effect.retry(send, {
      schedule: Schedule.exponential("250 millis").pipe(
        Schedule.tap((meta) =>
          meta.input instanceof EmailError && meta.input.acceptance === "notSubmitted"
            ? notify("result", `retry in ${Duration.toMillis(meta.duration)}ms`)
            : Effect.void,
        ),
      ),
      times: 3,
      while: (error) => error.acceptance === "notSubmitted",
    });

    return program.pipe(Effect.map((receipt) => receipt.status));
  },
};

const reactCode = visualSnippets["emails-react"];

export const emailsReact: VisualExampleDefinition = {
  id: "emails-react",
  category: "emails",
  api: "EmailReact.render",
  description: "Render a React component to html and text, then send it.",
  control: {
    label: "Mode",
    options: [
      { value: "htmlAndText", label: "html + text" },
      { value: "text", label: "text" },
    ],
    initial: "htmlAndText",
  },
  code: (mode) => (mode === "text" ? "text" : "htmlAndText"),
  nodes: [
    {
      id: "render",
      label: "render",
      highlight: (mode) =>
        mode === "text"
          ? 'EmailReact.render(<Receipt id="42" />, { mode: "text" })'
          : 'EmailReact.render(<Receipt id="42" />)',
    },
    {
      id: "send",
      label: "email.send",
      highlight: always("email.send({ from, to, subject, ...content })"),
    },
  ],
  result: {
    label: "receipt",
    highlight: (mode) =>
      span(reactCode[mode === "text" ? "text" : "htmlAndText"], "const content", "content });"),
    timer: true,
  },
  simulated: "Simulated renderer and provider.",
  describeError: tagOf,
  build: ({ step }, mode) => {
    const EmailReact = {
      render: (_element: string, options?: { readonly mode: "text" }) =>
        step(
          "render",
          Effect.sleep(ROUND_TRIP * 0.7).pipe(
            Effect.as(
              options?.mode === "text"
                ? { text: "Order 42 is paid." }
                : { html: "<p>Order 42 is paid.</p>", text: "Order 42 is paid." },
            ),
          ),
          (content) => Object.keys(content).join(" + "),
        ),
    };

    const email = {
      send: (_message: {
        readonly subject: string;
        readonly html?: string;
        readonly text: string;
      }) =>
        step(
          "send",
          Effect.sleep(ROUND_TRIP * 1.2).pipe(
            Effect.as({ provider: "resend", status: "accepted" as const }),
          ),
          (receipt) => receipt.status,
        ),
    };

    return Effect.gen(function* () {
      const element = '<Receipt id="42" />';
      const content = yield* mode === "text"
        ? EmailReact.render(element, { mode: "text" })
        : EmailReact.render(element);
      const receipt = yield* email.send({ subject: "Your receipt", ...content });

      return receipt.status;
    });
  },
};
