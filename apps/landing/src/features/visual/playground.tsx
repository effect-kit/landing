import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";

import { SoundToggle, VisualCredit } from "./chrome";
import type { VisualCode } from "./code";
import {
  type PlaygroundCategory,
  playgroundCategories,
  type VisualExampleDefinition,
} from "./examples";
import { VisualExample } from "./visual-example";

const tabFocus =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ek-accent";

/**
 * A row of tabs with roving focus: arrow keys, Home and End move and select. Each tab
 * controls `panelId`.
 */
function TabRow<T>({
  items,
  active,
  onSelect,
  label,
  idOf,
  panelId,
  className,
  tabClassName,
  children,
}: {
  readonly items: readonly T[];
  readonly active: number;
  readonly onSelect: (index: number) => void;
  readonly label: string;
  readonly idOf: (index: number) => string;
  readonly panelId: string;
  readonly className?: string;
  readonly tabClassName: (selected: boolean) => string;
  readonly children: (item: T) => ReactNode;
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: items.length - 1,
    };
    const move = moves[event.key];
    if (move === undefined) return;

    event.preventDefault();

    // Wrap around at both ends.
    const next = (move + items.length) % items.length;
    onSelect(next);
    tabs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={className}>
      {items.map((item, index) => {
        const selected = index === active;

        return (
          <button
            key={idOf(index)}
            ref={(element) => {
              tabs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={idOf(index)}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(index)}
            onKeyDown={onKeyDown}
            className={cn(tabFocus, tabClassName(selected))}
          >
            {children(item)}
          </button>
        );
      })}
    </div>
  );
}

function ExampleTabName({ example }: { readonly example: VisualExampleDefinition }) {
  return (
    <>
      {example.api}
      {example.qualifier ? (
        <span className="text-fd-muted-foreground"> ({example.qualifier})</span>
      ) : null}
    </>
  );
}

export interface PlaygroundProps {
  /** Category tabs, in order. With one category the category row is left out. */
  readonly categories: readonly PlaygroundCategory[];
  /** Tokens from `visualCode({ data: playgroundExampleIds(categories) })`. */
  readonly code: VisualCode;
  /** Accessible name of the playground. */
  readonly label?: string;
  readonly className?: string;
}

/**
 * The Visual Effect playground: category tabs (REDIS, EMAILS), example tabs named after the
 * API, and one playable example at a time. Only the selected example is mounted, so switching
 * tabs stops whatever was running. Renders idle on the server.
 */
export function Playground({ categories, code, label = "Playground", className }: PlaygroundProps) {
  const base = useId();
  const [category, setCategory] = useState(0);
  const [selected, setSelected] = useState<Partial<Record<PlaygroundCategory, number>>>({});

  const categoryId = categories[category] ?? categories[0];
  if (!categoryId) return null;

  const { examples } = playgroundCategories[categoryId];
  const exampleIndex = selected[categoryId] ?? 0;
  const example = examples[exampleIndex] ?? examples[0];
  const showCategories = categories.length > 1;

  const categoryTab = (index: number) => `${base}-category-${index}`;
  const exampleTab = (index: number) => `${base}-${categoryId}-${index}`;
  const categoryPanel = `${base}-category-panel`;
  const examplePanel = `${base}-example-panel`;

  const exampleTabs = (
    <TabRow
      items={examples}
      active={exampleIndex}
      onSelect={(index) => setSelected((current) => ({ ...current, [categoryId]: index }))}
      label={`${playgroundCategories[categoryId].label} examples`}
      idOf={exampleTab}
      panelId={examplePanel}
      className="grid min-w-0 flex-1 grid-cols-2 md:grid-cols-4"
      tabClassName={(isSelected) =>
        cn(
          "min-h-12 px-3 py-2.5 text-center font-mono text-[13px] leading-snug break-words transition-colors",
          isSelected
            ? "bg-zinc-100 text-fd-foreground dark:bg-zinc-900"
            : "text-fd-foreground/75 hover:bg-zinc-100/60 hover:text-fd-foreground dark:hover:bg-zinc-900/50",
        )
      }
    >
      {(item) => <ExampleTabName example={item} />}
    </TabRow>
  );

  return (
    <section aria-label={label} className={cn("relative", className)}>
      <div className="relative border border-(--ek-line-strong) bg-fd-background">
        <div className="flex items-stretch">
          {showCategories ? (
            <TabRow
              items={categories}
              active={category}
              onSelect={setCategory}
              label="Packages"
              idOf={categoryTab}
              panelId={categoryPanel}
              className="grid min-w-0 flex-1 auto-cols-fr grid-flow-col"
              tabClassName={(isSelected) =>
                cn(
                  "min-h-14 px-3 font-mono text-sm tracking-[0.12em] uppercase transition-colors",
                  isSelected
                    ? "bg-zinc-100 text-fd-foreground dark:bg-zinc-900"
                    : "text-fd-muted-foreground hover:bg-zinc-100/60 hover:text-fd-foreground dark:hover:bg-zinc-900/50",
                )
              }
            >
              {(item) => playgroundCategories[item].label}
            </TabRow>
          ) : (
            exampleTabs
          )}
          <SoundToggle className="h-auto min-h-12 w-12 border-l border-(--ek-line)" />
        </div>

        <div
          {...(showCategories
            ? { role: "tabpanel", id: categoryPanel, "aria-labelledby": categoryTab(category) }
            : {})}
        >
          {showCategories ? <div className="border-t border-(--ek-line)">{exampleTabs}</div> : null}
          <div
            role="tabpanel"
            id={examplePanel}
            aria-labelledby={exampleTab(exampleIndex)}
            className="border-t border-(--ek-line) p-3 sm:p-6"
          >
            {example ? (
              <VisualExample
                key={`${categoryId}:${example.id}`}
                example={example}
                code={code}
                credit={false}
              />
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid min-h-16 place-items-center px-4 pt-6">
        <VisualCredit />
      </div>
    </section>
  );
}
