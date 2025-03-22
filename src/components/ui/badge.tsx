import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-amber-800 text-amber-50 hover:bg-amber-800/80",
    secondary: "bg-stone-100 text-stone-900 hover:bg-stone-100/80",
    destructive: "bg-red-500 text-red-50 hover:bg-red-500/80",
    outline: "text-amber-800 border border-amber-800/20"
  }

  return (
    <div
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-950 focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}

export { Badge } 