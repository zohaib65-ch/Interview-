import * as React from "react";

import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center rounded-sm border border-zinc-700 px-1.5 font-mono text-[10px] font-medium text-zinc-400 select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
