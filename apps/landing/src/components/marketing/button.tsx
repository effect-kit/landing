import type { ComponentProps, ReactNode } from "react";

import { Link, type LinkProps } from "@tanstack/react-router";

import { cn } from "@/lib/cn";

const variants = {
  primary:
    "bg-fd-primary text-fd-primary-foreground hover:bg-fd-primary/90 shadow-[0_0_0_1px_var(--ek-line-strong)]",
  ghost:
    "text-fd-foreground border border-(--ek-line-strong) hover:bg-fd-accent hover:border-fd-foreground/25",
} as const;

const base =
  "inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring";

interface ButtonContentProps {
  readonly label: string;
  readonly icon?: ReactNode;
}

function Content({ label, icon }: ButtonContentProps) {
  return (
    <>
      {label}
      {icon}
    </>
  );
}

export function ButtonLink({
  variant = "primary",
  label,
  icon,
  className,
  ...props
}: LinkProps &
  ButtonContentProps & { readonly variant?: keyof typeof variants; readonly className?: string }) {
  return (
    <Link className={cn(base, variants[variant], className)} title={label} {...props}>
      <Content label={label} {...(icon ? { icon } : {})} />
    </Link>
  );
}

export function ExternalButton({
  variant = "ghost",
  label,
  icon,
  className,
  ...props
}: ComponentProps<"a"> & ButtonContentProps & { readonly variant?: keyof typeof variants }) {
  return (
    <a
      title={label}
      className={cn(base, variants[variant], className)}
      target="_blank"
      rel="noreferrer"
      {...props}
    >
      <Content label={label} {...(icon ? { icon } : {})} />
    </a>
  );
}
