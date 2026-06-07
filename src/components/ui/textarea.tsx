import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-zo-border-soft bg-zo-black-2 px-3 py-2 text-base transition-all outline-none placeholder:text-muted-foreground/40 focus-visible:border-zo-purple/40 focus-visible:ring-3 focus-visible:ring-zo-purple/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
