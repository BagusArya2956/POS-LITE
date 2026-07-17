import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { salesOptions, stockOptions } from './onboardingData.js'
import { StepHeading } from './StepHeading.jsx'

function SelectCard({ item, selected, onClick, type='radio' }) { const Icon=item.icon; return <button type="button" role={type} aria-checked={selected} onClick={onClick} className={`flex min-h-[92px] items-center gap-4 rounded-[20px] border bg-white p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${selected?'border-blue-600 ring-1 ring-blue-600 shadow-[0_10px_24px_rgba(37,99,235,.1)]':'border-slate-200 hover:border-slate-300'}`}><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${selected?'bg-blue-50 text-blue-700':'bg-slate-50 text-slate-500'}`}><Icon className="h-5 w-5"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span></span><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${selected?'bg-blue-600 text-white':'border border-slate-200 text-transparent'}`}><Check className="h-3.5 w-3.5"/></span></button> }

export function OperationsStep({ salesMode, stockTypes, onSalesChange, onStockChange, error }) {
  return <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.2}}>
    <StepHeading eyebrow="Step 2" title="How do you sell?" description="Choose your main workflow. You can change it later." />
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <fieldset><legend className="mb-3 text-sm font-bold text-slate-800">Sales method</legend><div className="grid gap-3" role="radiogroup">{salesOptions.map(item=><SelectCard key={item.id} item={item} selected={salesMode===item.id} onClick={()=>onSalesChange(item.id)}/>)}</div></fieldset>
      <fieldset><legend className="mb-1 text-sm font-bold text-slate-800">Inventory management</legend><p className="mb-3 text-xs text-slate-500">You can select more than one</p><div className="grid gap-3">{stockOptions.map(item=><SelectCard key={item.id} item={item} type="checkbox" selected={stockTypes.includes(item.id)} onClick={()=>onStockChange(item.id)}/>)}</div></fieldset>
    </div>
    {error && <p className="mt-4 text-sm font-medium text-rose-600" role="alert">{error}</p>}
  </motion.section>
}
