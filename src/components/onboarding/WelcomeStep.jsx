import { ArrowUpRight, Clock3 } from 'lucide-react'
import AnimatedWordmark from './AnimatedWordmark.jsx'

export function WelcomeStep({ onStart }) {
  return (
    <section className="mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col bg-white px-5 py-5 text-slate-950 sm:px-8 sm:py-7 lg:px-12 lg:py-9">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-brand text-[22px] font-extrabold leading-none tracking-[-0.065em]">vigo</span>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">POS</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 sm:text-sm">
          <Clock3 className="h-4 w-4" />
          About 3 minutes
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-hidden py-14 sm:py-20">
        <AnimatedWordmark />
      </div>

      <div className="grid gap-7 border-t border-slate-200 pb-2 pt-7 md:grid-cols-[1fr_auto] md:items-end lg:pt-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Store setup</p>
          <h2 className="font-brand mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 sm:text-3xl" style={{ fontVariationSettings: "'wdth' 104, 'wght' 760" }}>
            Your point of sale, ready in minutes.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-[15px]">
            Tell us how your business works. We’ll prepare products, inventory, checkout, and reporting around your store.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          autoFocus
          className="group inline-flex min-h-14 w-full items-center justify-between gap-8 rounded-full bg-black py-1.5 pl-6 pr-1.5 text-sm font-semibold text-white transition duration-200 hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:w-auto sm:min-w-[250px]"
        >
          Start setup
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
            <ArrowUpRight className="h-5 w-5 transition-transform duration-200 group-hover:rotate-45" />
          </span>
        </button>
      </div>
    </section>
  )
}
