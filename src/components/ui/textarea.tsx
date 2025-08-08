import * as React from "react"

import { cn } from "@/lib/utils"

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        // base layout
        "block w-full h-full min-h-[240px] resize-none rounded-xl",
        // colors and borders (respect theme)
        "bg-transparent text-inherit placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
        "border border-neutral-200 dark:border-neutral-700",
        // spacing and typography
        "p-4 text-base leading-relaxed",
        // focus and disabled states
        "outline-none focus:ring-2 focus:ring-neutral-500/30 focus:border-neutral-400",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"
