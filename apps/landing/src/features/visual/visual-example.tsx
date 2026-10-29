import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ArrowRightIcon } from "lucide-react";
import { MotionConfig } from "motion/react";

import { useReducedMotion } from "@/components/marketing/hooks";
import { cn } from "@/lib/cn";

import { Segmented, VisualCredit } from "./chrome";
import type { VisualCode } from "./code";
import { CodePanel } from "./code-panel";
import { EffectNode } from "./effect-node";
import type { VisualExampleDefinition } from "./examples";
import { RunHeader } from "./header";
import { IDLE, RESULT, type NodeState, VisualRun } from "./runtime";
import { ScopeStack } from "./scope-stack";
import { visualSnippets } from "./snippets";
import { sounds } from "./sounds";
import { ScheduleTimeline } from "./timeline";

const HOVER_HOLD_MS = 500;

function announce(example: VisualExampleDefinition, state: NodeState) {
  if (state._tag === "Running") return `${example.api} running`;

  switch (state._tag) {
    case "Succeeded":
      return `${example.api} succeeded: ${state.value}`;
    case "Failed":
      return `${example.api} failed: ${state.error}`;
    case "Interrupted":
      return `${example.api} stopped`;
    case "Died":
      return `${example.api} died: ${state.error}`;
    default:
      return "";
  }
}

export interface VisualExampleProps {
  readonly example: VisualExampleDefinition;
  /** Tokens from `visualCode`; without them the code renders as plain text. */
  readonly code: VisualCode;
  /** Render the Visual Effect credit under the card (the playground renders one for all). */
  readonly credit?: boolean;
  readonly className?: string;
}

/**
 * One playable example: a real Effect program running in the browser against a simulated
 * backend, with Visual Effect's nodes, sounds and a code panel that follows the running step.
 * Renders the idle state on the server; Effect only runs after a click.
 */
export function VisualExample({ example, code, credit = true, className }: VisualExampleProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [value, setValue] = useState(example.control?.initial ?? "");
  const [condition, setCondition] = useState(example.condition?.initial ?? "");

  const [run] = useState(
    () =>
      new VisualRun({
        tracked: new Set(example.timeline ?? []),
        describeError: example.describeError,
      }),
  );

  const snapshot = useSyncExternalStore(run.subscribe, run.getSnapshot, run.getServerSnapshot);
  const result = snapshot.nodes[RESULT] ?? IDLE;

  useEffect(() => () => run.dispose(), [run]);

  // Leaving the viewport stops the program and clears it, without a sound.
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting && run.running) run.reset({ silent: true });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [run]);

  const onAction = () => {
    sounds.unlock();

    if (result._tag === "Idle") run.start((context) => example.build(context, value, condition));
    else if (result._tag === "Running") run.stop();
    else run.reset();
  };

  const onControl = (set: (next: string) => void) => (next: string) => {
    sounds.unlock();
    run.reset({ silent: true });
    set(next);
    void sounds.configChange();
  };

  // Hovering a node highlights its code; leaving holds it briefly so the pointer can travel.
  const [hovered, setHovered] = useState<string | null>(null);
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHover = useCallback((id: string, hovering: boolean) => {
    if (holdRef.current) clearTimeout(holdRef.current);
    if (hovering) setHovered(id);
    else holdRef.current = setTimeout(() => setHovered(null), HOVER_HOLD_MS);
  }, []);

  useEffect(
    () => () => {
      if (holdRef.current) clearTimeout(holdRef.current);
    },
    [],
  );

  const hoverHandlers = useMemo(
    () =>
      Object.fromEntries(
        [...example.nodes.map((node) => node.id), RESULT].map((id) => [
          id,
          (hovering: boolean) => onHover(id, hovering),
        ]),
      ) as Record<string, (hovering: boolean) => void>,
    [example.nodes, onHover],
  );

  const highlightOf = (id: string) =>
    id === RESULT
      ? example.result.highlight(value)
      : example.nodes.find((node) => node.id === id)?.highlight(value);

  // Without a hover, follow execution: the step that started last, or the program while it waits.
  const runningStep = example.nodes
    .map((node) => ({ node, state: snapshot.nodes[node.id] }))
    .filter((entry) => entry.state?._tag === "Running")
    .toSorted((a, b) =>
      a.state?._tag === "Running" && b.state?._tag === "Running"
        ? b.state.startedAt - a.state.startedAt
        : 0,
    )[0];

  const target =
    (hovered ? highlightOf(hovered) : undefined) ??
    runningStep?.node.highlight(value) ??
    (result._tag === "Running" ? example.result.highlight(value) : null);

  const variants = useMemo(
    () => [
      ...new Set(
        (example.control?.options ?? [{ value: "" }]).map((option) => example.code(option.value)),
      ),
    ],
    [example],
  );

  // Without tokens for every variant, fall back to the plain-text snippets.
  const steps = useMemo(() => {
    const tokens = variants.map((variant) => code[`${example.id}:${variant}`]);

    return tokens.every((token) => token !== undefined) ? tokens : [];
  }, [code, example.id, variants]);

  const variant = example.code(value);
  const snippets: Readonly<Record<string, string>> = visualSnippets[example.id];

  const label = example.qualifier ? `${example.api} (${example.qualifier})` : example.api;

  return (
    <MotionConfig reducedMotion="user">
      <article
        ref={rootRef}
        aria-label={label}
        className={cn(
          "overflow-hidden rounded-sm border border-(--ek-line-strong) bg-fd-background",
          className,
        )}
      >
        <RunHeader
          tag={result._tag}
          api={example.api}
          qualifier={example.qualifier}
          description={example.description}
          reduced={reduced}
          onAction={onAction}
        />

        {example.control || example.condition ? (
          <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-(--ek-line) bg-zinc-50 px-4 py-4 sm:px-6 dark:bg-zinc-900/50">
            {example.control ? (
              <Segmented
                label={example.control.label}
                value={value}
                options={example.control.options}
                onChange={onControl(setValue)}
              />
            ) : null}
            {example.condition ? (
              <Segmented
                label={example.condition.label}
                value={condition}
                options={example.condition.options}
                onChange={onControl(setCondition)}
              />
            ) : null}
          </div>
        ) : null}

        <div className="border-t border-(--ek-line) px-4 pt-12 pb-5 sm:px-6">
          <div className="flex flex-wrap items-start gap-x-5 gap-y-10">
            {example.nodes.map((node) => (
              <EffectNode
                key={node.id}
                state={snapshot.nodes[node.id] ?? IDLE}
                label={node.label}
                note={snapshot.notes[node.id]}
                quiet={result._tag === "Failed" || result._tag === "Died"}
                reduced={reduced}
                onHover={hoverHandlers[node.id] ?? noop}
              />
            ))}
            <div className="flex items-start gap-x-5">
              <ArrowRightIcon
                aria-hidden="true"
                className="mt-[18px] size-5 shrink-0 text-fd-muted-foreground"
              />
              <EffectNode
                state={result}
                label={example.result.label}
                note={snapshot.notes[RESULT]}
                timer={example.result.timer ?? false}
                reduced={reduced}
                onHover={hoverHandlers[RESULT] ?? noop}
              />
            </div>
          </div>
          <p className="mt-6 font-mono text-[11px] text-fd-muted-foreground">{example.simulated}</p>
          <p aria-live="polite" className="sr-only">
            {announce(example, result)}
          </p>
        </div>

        {example.timeline ? (
          <div className="border-t border-(--ek-line)">
            <ScheduleTimeline segments={snapshot.timeline} active={result._tag === "Running"} />
          </div>
        ) : null}

        {example.finalizers ? (
          <div className="border-t border-(--ek-line) p-4 sm:p-6">
            <ScopeStack
              finalizers={snapshot.finalizers}
              live={result._tag === "Running"}
              reduced={reduced}
            />
          </div>
        ) : null}

        <div className="border-t border-(--ek-line)">
          <CodePanel
            steps={steps}
            step={Math.max(0, variants.indexOf(variant))}
            fallback={snippets[variant] ?? ""}
            target={target ?? null}
            reduced={reduced}
          />
        </div>
      </article>
      {credit ? <VisualCredit className="mt-6" /> : null}
    </MotionConfig>
  );
}

const noop = () => {};
