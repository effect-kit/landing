import { Data, type Duration } from "effect";

// ---------------------------------------------------------------------------
// Simulated backends. The error classes mirror the real ones field for field:
// @effect-kit/redis `ConnectionError`, @effect-kit/emails `EmailError` and its reasons.
// ---------------------------------------------------------------------------

export class ConnectionError extends Data.TaggedError("ConnectionError")<{
  readonly reason: "closed";
  readonly delivery: "unsent" | "possibly-written";
  readonly generation: number;
}> {}

export class RateLimitedError extends Data.TaggedError("RateLimitedError")<{
  readonly retryAfter?: Duration.Duration;
}> {}

export class UnsupportedFeatureError extends Data.TaggedError("UnsupportedFeatureError")<{
  readonly feature: "attachments";
}> {}

export class TransportError extends Data.TaggedError("TransportError")<{}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{}> {}

export class EmailError extends Data.TaggedError("EmailError")<{
  readonly provider: string;
  readonly operation: "send";
  readonly acceptance: "notSubmitted" | "rejected" | "unknown";
  readonly reason: RateLimitedError | UnsupportedFeatureError | TransportError | TimeoutError;
}> {}

export class ServerError extends Data.TaggedError("ServerError")<{
  readonly delivery: "replied";
  readonly code: string;
}> {}

export const tagOf = (error: unknown) =>
  typeof error === "object" && error !== null && "_tag" in error ? String(error._tag) : "Error";

/** Simulated network round trip. */
export const ROUND_TRIP = 400;
