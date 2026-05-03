import { cn } from '../../lib/helpers.js'

const variantClasses = {
  primary:
    'bg-blue-700 text-white shadow-[0_10px_24px_rgba(29,78,216,0.24)] hover:bg-blue-800',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:border-blue-200 hover:text-blue-700',
  success:
    'bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)] hover:bg-emerald-700',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-sm',
  lg: 'px-5 py-3.5 text-base',
}

function Button({
  children,
  className,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition focus:outline-none focus:ring-4 focus:ring-blue-100',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
