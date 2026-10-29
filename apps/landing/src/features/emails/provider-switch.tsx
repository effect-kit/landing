import { useState } from "react";

import { CheckIcon, MinusIcon } from "lucide-react";

import { BrandIcon } from "@/components/brands/brand-icon";
import { CodeWindow } from "@/components/marketing/code";
import { MagicCode } from "@/components/marketing/magic-code";
import {
  capabilityColumns,
  type EmailCapabilities,
  type EmailProviderId,
  emailProviders,
  getEmailProvider,
} from "@/content/email-providers";
import type { SnippetId } from "@/content/snippets";
import { cn } from "@/lib/cn";
import type { KeyedSnippets } from "@/lib/magic";

type Value = EmailCapabilities[keyof EmailCapabilities];
type Level = "full" | "partial" | "none";

function levelOf(value: Value): { level: Level; note?: string } {
  if (value === true || value === "multiple") return { level: "full" };
  if (value === "single") return { level: "partial", note: "one address" };
  if (value === "replay") return { level: "full", note: "replays" };
  if (value === "reject") return { level: "full", note: "rejects duplicates" };
  return { level: "none" };
}

export function ProviderMark({ id, className }: { id: EmailProviderId; className?: string }) {
  const provider = getEmailProvider(id);

  return provider.brand ? (
    <BrandIcon brand={provider.brand} label="" className={cn("size-4", className)} />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-4 place-items-center rounded-[3px] border border-current font-mono text-[8px] leading-none",
        className,
      )}
    >
      {provider.name.charAt(0)}
    </span>
  );
}

export const swapSnippetIds: readonly SnippetId[] = emailProviders.map(
  (entry) => `emails.swap.${entry.id}` as const,
);

function Cell({ value, lit }: { value: Value; lit: boolean }) {
  const { level, note } = levelOf(value);
  const tone = lit ? "text-ek-accent" : "text-fd-foreground/60";

  return (
    <span title={note} className="mx-auto grid size-5 place-items-center">
      {level === "full" ? (
        <CheckIcon
          aria-hidden="true"
          strokeWidth={2.5}
          className={cn("size-4 transition-colors", tone)}
        />
      ) : level === "partial" ? (
        <span aria-hidden="true" className={cn("font-mono text-[11px] transition-colors", tone)}>
          1
        </span>
      ) : (
        <MinusIcon aria-hidden="true" className="size-3.5 text-fd-muted-foreground/40" />
      )}
      <span className="sr-only">
        {level === "full" ? "yes" : level === "partial" ? `partly, ${note}` : "no"}
        {level === "full" && note ? `, ${note}` : ""}
      </span>
    </span>
  );
}

/**
 * Every adapter against every feature it can carry. Picking a row swaps the import and Layer in
 * the code; the rest of the program stays put.
 */
export function ProviderSwitch({ tokens }: { readonly tokens: KeyedSnippets }) {
  const [providerId, setProviderId] = useState<EmailProviderId>("resend");
  const provider = getEmailProvider(providerId);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
      <div className="flex min-w-0 flex-col gap-4 self-start">
        <CodeWindow title="send-welcome.ts">
          <MagicCode tokens={tokens} ids={swapSnippetIds} current={`emails.swap.${provider.id}`} />
        </CodeWindow>
        <p className="font-mono text-xs text-fd-muted-foreground">
          <span className="text-ek-accent">$</span> add @effect-kit/emails effect {provider.sdk}
        </p>
      </div>

      <div className="relative min-w-0 overflow-x-auto rounded-xl border border-(--ek-line)">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">
            What each provider adapter can carry. Select a provider to see its Layer.
          </caption>
          <thead>
            <tr className="border-b border-(--ek-line)">
              <th
                scope="col"
                className="w-44 px-4 py-3 text-start font-mono text-[11px] font-normal text-fd-muted-foreground"
              >
                Provider
              </th>
              {capabilityColumns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="h-28 w-10 px-0 align-bottom font-mono text-[11px] font-normal text-fd-muted-foreground"
                >
                  <span className="mx-auto mb-2 block w-4 origin-bottom-left translate-x-2 -rotate-[55deg] whitespace-nowrap">
                    {column.label}
                  </span>
                </th>
              ))}
              <th aria-hidden="true" className="w-12" />
            </tr>
          </thead>
          <tbody>
            {emailProviders.map((entry) => {
              const selected = entry.id === providerId;

              return (
                <tr
                  key={entry.id}
                  className={cn(
                    "border-b border-(--ek-line) transition-colors last:border-b-0",
                    selected ? "bg-ek-accent/8" : "hover:bg-fd-card/60",
                  )}
                >
                  <th scope="row" className="p-0 text-start font-normal">
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setProviderId(entry.id)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-start transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fd-ring",
                        selected
                          ? "text-fd-foreground"
                          : "text-fd-muted-foreground hover:text-fd-foreground",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-4 w-0.5 rounded-full",
                          selected ? "bg-ek-accent" : "bg-transparent",
                        )}
                      />
                      <ProviderMark id={entry.id} />
                      <span className="truncate">{entry.name}</span>
                    </button>
                  </th>
                  {capabilityColumns.map((column) => (
                    <td key={column.key} className="px-0 py-2 text-center">
                      <Cell value={entry.capabilities[column.key]} lit={selected} />
                    </td>
                  ))}
                  <td aria-hidden="true" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
