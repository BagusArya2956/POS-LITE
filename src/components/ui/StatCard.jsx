import { cn } from '../../lib/helpers.js'

function StatCard({ title, value, subtitle, icon: Icon, accent = 'blue', className }) {
  const accentClasses = {
    blue: 'from-blue-50 to-blue-100 text-blue-700',
    green: 'from-emerald-50 to-emerald-100 text-emerald-700',
    red: 'from-rose-50 to-rose-100 text-rose-700',
    amber: 'from-amber-50 to-amber-100 text-amber-700',
  }

  return (
    <div className={cn('panel-card relative overflow-hidden p-5 lg:p-6', className)}>
      {Icon ? (
        <div
          className={cn(
            'absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br opacity-95',
            accentClasses[accent],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">{value}</h3>
      {subtitle ? <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p> : null}
    </div>
  )
}

export default StatCard
