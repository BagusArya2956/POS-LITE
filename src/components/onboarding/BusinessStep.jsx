import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { businessOptions } from './onboardingData.js'
import { StepHeading } from './StepHeading.jsx'

const tones = { blue:'bg-blue-50 text-blue-700', amber:'bg-amber-50 text-amber-700', orange:'bg-orange-50 text-orange-700', violet:'bg-violet-50 text-violet-700', emerald:'bg-emerald-50 text-emerald-700', slate:'bg-slate-100 text-slate-700' }

export function BusinessStep({ value, variant, onChange, error }) {
  return <motion.section initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{duration:.2}}>
    <StepHeading eyebrow="Step 1" title="What type of business do you run?" description="We?ll tailor the categories and POS workflow." />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Select a business type">
      {businessOptions.map((option) => {
        const selected = value === option.value && (variant || '') === (option.variant || '')
        const Icon = option.icon
        return <button key={`${option.value}-${option.variant||''}`} type="button" role="radio" aria-checked={selected} onClick={() => onChange(option)} className={`group relative min-h-[152px] rounded-[22px] border bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,.03)] transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${selected ? 'border-blue-600 ring-1 ring-blue-600 shadow-[0_12px_30px_rgba(37,99,235,.12)]' : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'}`}>
          <div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[option.color]}`}><Icon className="h-5 w-5" /></span><span className={`flex h-6 w-6 items-center justify-center rounded-full transition ${selected?'bg-blue-600 text-white':'border border-slate-200 text-transparent'}`}><Check className="h-3.5 w-3.5"/></span></div>
          <p className="mt-5 text-base font-bold text-slate-900">{option.label}</p><p className="mt-1 text-sm text-slate-500">{option.description}</p>
        </button>
      })}
    </div>
    {error && <p className="mt-4 text-sm font-medium text-rose-600" role="alert">{error}</p>}
  </motion.section>
}
