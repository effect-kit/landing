import { useId, useState } from "react";

import { track } from "@/lib/analytics/client";
import { cn } from "@/lib/cn";

const textBody = (name: string) => `Welcome, ${name}

Your account is ready. Sign in to finish setting up your workspace.

Open dashboard: https://example.com/start`;

/** What `EmailReact.render(<Welcome name="Ada" />)` produces: an HTML body and a text body. */
export function TemplatePreview() {
  const [mode, setMode] = useState<"html" | "text">("html");
  const [name, setName] = useState("Ada");
  const inputId = useId();

  const shown = name.trim() || "there";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-(--ek-line) bg-fd-card/40">
      <div className="flex items-center justify-between border-b border-(--ek-line) px-4 py-2.5">
        <div className="font-mono text-[11px] leading-relaxed text-fd-muted-foreground">
          <p>
            <span className="text-fd-muted-foreground/60">from</span> hello@example.com
          </p>
          <p>
            <span className="text-fd-muted-foreground/60">subject</span>{" "}
            <span className="text-fd-foreground">Welcome</span>
          </p>
        </div>
        <label
          htmlFor={inputId}
          className="ms-auto me-3 flex items-center gap-2 font-mono text-[11px] text-fd-muted-foreground"
        >
          name
          <input
            id={inputId}
            value={name}
            maxLength={24}
            spellCheck={false}
            onChange={(event) => setName(event.target.value)}
            className="w-24 rounded border border-(--ek-line-strong) bg-fd-background px-2 py-1 text-fd-foreground outline-none focus:border-fd-ring"
          />
        </label>
        <fieldset aria-label="Body" className="flex rounded-md border border-(--ek-line) p-0.5">
          {(["html", "text"] as const).map((entry) => (
            <button
              key={entry}
              type="button"
              aria-pressed={mode === entry}
              onClick={() => {
                if (entry !== mode) track("template_mode_changed", { mode: entry });

                setMode(entry);
              }}
              className={cn(
                "cursor-pointer rounded px-2 py-1 font-mono text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-fd-ring",
                mode === entry ? "bg-fd-accent text-fd-foreground" : "text-fd-muted-foreground",
              )}
            >
              {entry}
            </button>
          ))}
        </fieldset>
      </div>
      <div className="flex flex-1 items-center justify-center bg-[image:var(--ek-dots)] bg-[length:16px_16px] p-6">
        {mode === "html" ? (
          <div
            key="html"
            className="w-full max-w-sm animate-ek-rise rounded-md bg-white p-7 text-zinc-900 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)]"
          >
            <div className="mb-6 h-1 w-10 rounded-full bg-zinc-900" />
            <p className="text-xl font-semibold tracking-tight">Welcome, {shown}</p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Your account is ready. Sign in to finish setting up your workspace.
            </p>
            <span className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              Open dashboard
            </span>
            <p className="mt-8 border-t border-zinc-200 pt-4 text-[11px] text-zinc-400">
              Sent with @effect-kit/emails
            </p>
          </div>
        ) : (
          <pre
            key="text"
            className="w-full max-w-sm animate-ek-rise rounded-md border border-(--ek-line) bg-fd-background p-6 font-mono text-xs leading-relaxed whitespace-pre-wrap text-fd-foreground"
          >
            {textBody(shown)}
          </pre>
        )}
      </div>
    </div>
  );
}
