import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-11 w-full min-w-0 border-2 border-black bg-background px-4 py-3 font-ui text-base text-foreground outline-none transition-colors placeholder:font-ui placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[#757575] disabled:text-[#999999] md:text-[0.95rem]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        className
      )}
      {...props}
    />
  )
}

export { Input }
