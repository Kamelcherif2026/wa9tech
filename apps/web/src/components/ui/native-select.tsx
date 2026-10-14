import * as React from "react";
import { cn } from "@/lib/utils";

/** Liste déroulante native : accessible, légère, sans dépendance. */
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };
