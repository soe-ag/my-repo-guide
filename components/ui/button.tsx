import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border-2 border-transparent font-ui text-[0.95rem] font-bold uppercase tracking-[0.14em] transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
  {
    variants: {
      variant: {
        default: 'border-black bg-background text-black hover:bg-black hover:text-white',
        destructive: 'border-black bg-black text-white hover:bg-background hover:text-black',
        outline: 'border-black bg-background text-black hover:bg-black hover:text-white',
        secondary: 'border-border bg-muted text-foreground hover:border-black hover:bg-background',
        ghost:
          'border-transparent bg-transparent px-0 py-0 text-black underline decoration-black underline-offset-4 hover:text-[#057dbc]',
        link: 'border-transparent bg-transparent px-0 py-0 text-black underline decoration-black underline-offset-4 hover:text-[#057dbc]',
      },
      size: {
        default: 'min-h-11 px-6 py-3 has-[>svg]:px-5',
        xs: 'min-h-8 px-3 py-1.5 text-[0.72rem] has-[>svg]:px-2.5 [&_svg:not([class*=size-])]:size-3',
        sm: 'min-h-10 px-4 py-2 text-[0.78rem] has-[>svg]:px-3.5',
        lg: 'min-h-12 px-7 py-3.5 has-[>svg]:px-6',
        icon: 'size-10 rounded-full border text-black',
        'icon-xs': 'size-7 rounded-full border text-black [&_svg:not([class*=size-])]:size-3',
        'icon-sm': 'size-9 rounded-full border text-black',
        'icon-lg': 'size-12 rounded-full border text-black',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
