import * as React from "react";
import { cn } from "@/lib/utils";

const variantes = {
  neutre: "bg-muted text-muted-foreground",
  succes: "bg-success/15 text-success",
  alerte: "bg-warning/20 text-[oklch(0.45_0.12_75)]",
  danger: "bg-destructive/10 text-destructive",
  primaire: "bg-accent text-accent-foreground",
} as const;

function Badge({
  className,
  variante = "neutre",
  ...props
}: React.ComponentProps<"span"> & { variante?: keyof typeof variantes }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        variantes[variante],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
