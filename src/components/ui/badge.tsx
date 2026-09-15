import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "pass" | "fail" | "gold" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "pass" && "bg-pass text-pass-fg",
        tone === "fail" && "bg-fail text-fail-fg",
        tone === "gold" && "bg-gold/20 text-gold-fg",
        tone === "primary" && "bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
