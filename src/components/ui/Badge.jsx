import { cn } from '../../lib/helpers.js'

const toneClasses = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  blue: 'bg-blue-50 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
}

function Badge({ children, tone = 'slate', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export default Badge
