import { ArrowRight, Check, PackageCheck, ScanBarcode, Settings2, Store } from 'lucide-react'
import { getBusinessLabel } from './onboardingData.js'

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-200/80 py-5 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-blue-600 shadow-sm">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export function SuccessStep({ values, onDashboard }) {
  const salesLabel = values.salesMode === 'counter' ? 'Counter POS' : 'Orders'
  const inventoryLabel = `${values.stockTypesManaged.length} ${values.stockTypesManaged.length === 1 ? 'method' : 'methods'}`

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-5xl items-center py-8">
      <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.09)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)]">
            <Check className="h-6 w-6" strokeWidth={2.5} />
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Setup complete
          </p>
          <h1 className="mt-3 max-w-xl text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {values.storeName} is ready.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-500 sm:text-base">
            Your store essentials are configured. Add your catalog or process your first sale from the dashboard.
          </p>

          <button
            type="button"
            onClick={onDashboard}
            autoFocus
            className="group mt-9 inline-flex min-h-14 w-full items-center justify-between rounded-2xl bg-slate-950 px-5 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:max-w-[280px]"
          >
            Open dashboard
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        <aside className="border-t border-slate-200 bg-slate-50/80 px-7 py-9 sm:px-10 lg:border-l lg:border-t-0 lg:px-11 lg:py-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold tracking-[-0.02em] text-slate-900">Setup summary</p>
              <p className="mt-1 text-sm text-slate-500">Your current configuration</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Ready
            </span>
          </div>

          <div className="mt-6">
            <SummaryRow icon={Store} label="Business" value={getBusinessLabel(values)} />
            <SummaryRow icon={ScanBarcode} label="Sales workflow" value={salesLabel} />
            <SummaryRow icon={PackageCheck} label="Inventory" value={inventoryLabel} />
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Settings2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p className="text-sm leading-6 text-slate-500">
              You can update these details anytime from Settings.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
