import type { Effect } from "effect";

import type { RunContext } from "../runtime";
import type { VisualExampleId } from "../snippets";

export type PlaygroundCategory = "redis" | "emails";

export interface VisualNode {
  readonly id: string;
  readonly label: string;
  /** Code to highlight while this node runs or is hovered, per control value. */
  readonly highlight: (value: string) => string | null;
}

export interface VisualControl {
  /** Short name, shown in uppercase mono next to the segmented control. */
  readonly label: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly initial: string;
}

export interface VisualExampleDefinition {
  readonly id: VisualExampleId;
  readonly category: PlaygroundCategory;
  /** The API the example is about, in code: the tab and the card title. */
  readonly api: string;
  /** Muted words after the API that tell two tabs on the same API apart. */
  readonly qualifier?: string;
  /** One short plain line under the title. */
  readonly description: string;
  readonly control?: VisualControl;
  /** Snippet variant (a key of `visualSnippets[id]`) for a control value. */
  readonly code: (value: string) => string;
  readonly nodes: readonly VisualNode[];
  readonly result: Omit<VisualNode, "id"> & { readonly timer?: boolean };
  /** Nodes drawn on the schedule timeline; no timeline when empty. */
  readonly timeline?: readonly string[];
  /** Show the finalizers panel (scope examples). */
  readonly finalizers?: boolean;
  /** One line about what is simulated, shown under the nodes. */
  readonly simulated: string;
  readonly describeError: (error: unknown) => string;
  readonly build: (context: RunContext, value: string) => Effect.Effect<string, unknown>;
}

export const always =
  <T>(value: T) =>
  () =>
    value;

/** The text of `code` from `start` up to and including `end`, so a highlight can span lines. */
export function span(code: string, start: string, end: string) {
  const from = code.indexOf(start);
  const to = code.indexOf(end, from);

  if (from === -1 || to === -1) throw new Error(`Highlight not found: ${start}`);

  return code.slice(from, to + end.length);
}
