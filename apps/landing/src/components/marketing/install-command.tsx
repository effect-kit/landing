import { useState, useSyncExternalStore } from "react";

import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "@/lib/cn";

const managers = {
  pnpm: "pnpm add",
  npm: "npm install",
  bun: "bun add",
  yarn: "yarn add",
} as const;

type Manager = keyof typeof managers;

const STORAGE_KEY = "effect-kit:package-manager";
const CHANGE_EVENT = "effect-kit:package-manager";

/** The preferred package manager, shared by every install command and remembered. */
const managerStore = {
  subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGE_EVENT, onChange);

    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  },
  get(): Manager {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved && saved in managers ? (saved as Manager) : "pnpm";
  },
  set(manager: Manager) {
    window.localStorage.setItem(STORAGE_KEY, manager);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  },
};

export interface InstallOption {
  readonly id: string;
  readonly label: string;
  /** Packages after the add command, e.g. `@effect-kit/redis effect`. */
  readonly packages: string;
}

/** Install command with package manager tabs (remembered) and an optional package picker. */
export function InstallCommand({
  options,
  className,
}: {
  readonly options: readonly InstallOption[];
  readonly className?: string;
}) {
  const manager = useSyncExternalStore(
    managerStore.subscribe,
    managerStore.get,
    // The server can't read localStorage, so it renders the default manager.
    () => "pnpm" as const,
  );
  const [optionId, setOptionId] = useState(options[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const option = options.find((entry) => entry.id === optionId) ?? options[0];
  const command = `${managers[manager]} ${option?.packages ?? ""}`;

  const copy = async () => {
    await navigator.clipboard.writeText(command);

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      className={cn(
        "w-full max-w-xl overflow-hidden rounded-lg border border-(--ek-line-strong) bg-fd-card/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-(--ek-line) px-1.5">
        <div role="tablist" aria-label="Package manager" className="flex">
          {(Object.keys(managers) as Manager[]).map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={entry === manager}
              onClick={() => managerStore.set(entry)}
              className={cn(
                "relative px-2.5 py-2 font-mono text-[11px] transition-colors",
                entry === manager
                  ? "text-fd-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-px after:bg-ek-accent"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              {entry}
            </button>
          ))}
        </div>
        {options.length > 1 ? (
          <div role="tablist" aria-label="Package" className="flex gap-1 pe-1">
            {options.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={entry.id === option?.id}
                onClick={() => setOptionId(entry.id)}
                className={cn(
                  "rounded px-2 py-1 font-mono text-[11px] transition-colors",
                  entry.id === option?.id
                    ? "bg-fd-accent text-fd-foreground"
                    : "text-fd-muted-foreground hover:text-fd-foreground",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 py-3 ps-4 pe-2">
        <span aria-hidden="true" className="font-mono text-[13px] text-ek-accent">
          $
        </span>
        <code className="min-w-0 flex-1 truncate font-mono text-[13px] text-fd-foreground">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy install command"}
          className="grid size-8 place-items-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
        >
          {copied ? (
            <CheckIcon className="size-4 animate-ek-pop text-ek-accent" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
