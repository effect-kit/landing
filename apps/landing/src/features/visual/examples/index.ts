import type { VisualExampleId } from "../snippets";
import type { PlaygroundCategory, VisualExampleDefinition } from "./definition";
import { emailsAcceptance, emailsBatch, emailsCapability, emailsReact } from "./emails";
import { redisPipeline, redisRetry, redisScope, redisWatch } from "./redis";

export type {
  PlaygroundCategory,
  VisualControl,
  VisualExampleDefinition,
  VisualNode,
} from "./definition";
export {
  emailsAcceptance,
  emailsBatch,
  emailsCapability,
  emailsReact,
  redisPipeline,
  redisRetry,
  redisScope,
  redisWatch,
};

export const visualExamples = {
  redisRetry,
  redisPipeline,
  redisWatch,
  redisScope,
  emailsBatch,
  emailsCapability,
  emailsAcceptance,
  emailsReact,
} as const;

/** The examples behind each category tab, in tab order. */
export const playgroundCategories = {
  redis: { label: "Redis", examples: [redisRetry, redisPipeline, redisWatch, redisScope] },
  emails: {
    label: "Emails",
    examples: [emailsBatch, emailsCapability, emailsAcceptance, emailsReact],
  },
} as const satisfies Record<
  PlaygroundCategory,
  { readonly label: string; readonly examples: readonly VisualExampleDefinition[] }
>;

/** Ids to pass to `visualCode` for a playground showing `categories`. */
export function playgroundExampleIds(categories: readonly PlaygroundCategory[]): VisualExampleId[] {
  return categories.flatMap((category) =>
    playgroundCategories[category].examples.map((example) => example.id),
  );
}
