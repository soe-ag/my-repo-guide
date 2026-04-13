import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="skeleton" className={cn('animate-pulse bg-[#f3f4f6]', className)} {...props} />
  )
}

export { Skeleton }
