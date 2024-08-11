import { useRouteContext } from '@/hooks/route'
import React from 'react'

interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> {
  to: string
  end?: boolean
  className?: string | ((isActive: boolean) => string)
  children?: React.ReactNode
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, end, className, children, ...otherProps }, ref) => {
    const {
      url: { pathname },
    } = useRouteContext()
    const isActive = end ? to === pathname : pathname.startsWith(to)

    return (
      <a
        ref={ref}
        href={to}
        className={
          className
            ? typeof className === 'string'
              ? className
              : className(isActive)
            : undefined
        }
        {...otherProps}
      >
        {children}
      </a>
    )
  }
)

Link.displayName = 'Link'

export default Link
