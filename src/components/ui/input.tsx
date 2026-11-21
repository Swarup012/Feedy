import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base layout & typography
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors",
          // File input reset
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Placeholder
          "placeholder:text-muted-foreground",
          // Focus — standard ring
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          // Error state — applied via aria-invalid="true" (compatible with react-hook-form)
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20 aria-[invalid=true]:focus-visible:ring-destructive",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Responsive text size
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
