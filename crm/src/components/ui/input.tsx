import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-crm-ink/15 bg-white px-3 text-sm text-crm-ink shadow-sm placeholder:text-crm-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crm-accent',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
