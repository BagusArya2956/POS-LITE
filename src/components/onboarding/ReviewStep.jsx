import { BriefcaseBusiness, Check, MapPin, PackageCheck, Pencil, Phone, ScanBarcode, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { getBusinessLabel, salesOptions, stockOptions } from './onboardingData.js'
import { StepHeading } from './StepHeading.jsx'

function Row({ icon:Icon, label, children, onEdit }) { return <div className="flex gap-4 border-b border-slate-100 py-5 last:border-0"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Icon className="h-4 w-4"/></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-400">{label}</p><div className="mt-1 text-sm font-semibold text-slate-800">{children}</div></div>{onEdit&&<button type="button" onClick={onEdit} className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" aria-label={`Edit ${label}`}><Pencil className="h-4 w-4"/></button>}</div> }

export function ReviewStep({ values, goToStep }) { const sales=salesOptions.find(x=>x.id===values.salesMode); const stocks=stockOptions.filter(x=>values.stockTypesManaged.includes(x.id)); return <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.2}}>
  <StepHeading eyebrow="Step 4" title="Does everything look right?" description="Review your details before we set up your store." />
  <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 shadow-sm sm:px-7"><Row icon={Store} label="Store name" onEdit={()=>goToStep(3)}>{values.storeName}</Row><Row icon={MapPin} label="Address" onEdit={()=>goToStep(3)}>{values.address||'Not provided'}</Row><Row icon={Phone} label="WhatsApp" onEdit={()=>goToStep(3)}>{values.whatsapp}</Row></div>
    <div className="rounded-[24px] border border-slate-200 bg-white px-5 shadow-sm sm:px-7"><Row icon={BriefcaseBusiness} label="Business type" onEdit={()=>goToStep(1)}>{getBusinessLabel(values)}</Row><Row icon={ScanBarcode} label="Sales method" onEdit={()=>goToStep(2)}>{sales?.title}</Row><Row icon={PackageCheck} label="Inventory" onEdit={()=>goToStep(2)}><span className="flex flex-wrap gap-2">{stocks.map(x=><span key={x.id} className="rounded-lg bg-blue-50 px-2 py-1 text-xs text-blue-700">{x.title}</span>)}</span></Row></div>
  </div>
  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"><Check className="mt-0.5 h-4 w-4 shrink-0"/><p><strong>Ready to use.</strong> Initial categories and POS settings will be created automatically.</p></div>
  </motion.section> }
