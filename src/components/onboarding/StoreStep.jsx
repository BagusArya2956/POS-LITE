import { Check, ImagePlus, MapPin, Phone, Store } from 'lucide-react'
import { motion } from 'framer-motion'
import { StepHeading } from './StepHeading.jsx'

function Field({ label, htmlFor, error, success, optional, icon: Icon, children }) {
  return <div><div className="mb-2 flex items-center justify-between"><label htmlFor={htmlFor} className="text-sm font-bold text-slate-700">{label}</label>{optional&&<span className="text-xs text-slate-400">Optional</span>}</div><div className="relative">{Icon&&<Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>}{children}{success&&<Check className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600"/>}</div>{error&&<p className="mt-2 text-xs font-medium text-rose-600" role="alert">{error.message}</p>}</div>
}

export function StoreStep({ register, errors, values, onLogoChange }) {
  return <motion.section initial={{opacity:0,x:12}} animate={{opacity:1,x:0}} transition={{duration:.2}}>
    <StepHeading eyebrow="Step 3" title="Tell us about your store" description="This information will appear on receipts and the dashboard." />
    <div className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.05)] sm:p-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Store name" htmlFor="store-name" icon={Store} error={errors.storeName} success={values.storeName?.length>=2}><input id="store-name" {...register('storeName')} autoFocus autoComplete="organization" placeholder="Example: Morning Coffee" className={`min-h-12 w-full rounded-2xl border bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${errors.storeName?'border-rose-400 focus:border-rose-500 focus:ring-rose-100':'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`} /></Field>
        <Field label="WhatsApp" htmlFor="store-whatsapp" icon={Phone} error={errors.whatsapp} success={!errors.whatsapp&&values.whatsapp?.length>=9}><input id="store-whatsapp" {...register('whatsapp')} inputMode="tel" autoComplete="tel" placeholder="08xxxxxxxxxx" className={`min-h-12 w-full rounded-2xl border bg-white py-3 pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${errors.whatsapp?'border-rose-400 focus:border-rose-500 focus:ring-rose-100':'border-slate-200 focus:border-blue-500 focus:ring-blue-100'}`} /></Field>
        <div className="sm:col-span-2"><Field label="Store address" htmlFor="store-address" icon={MapPin} error={errors.address} optional><input id="store-address" {...register('address')} autoComplete="street-address" placeholder="Street, district, city" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></Field></div>
        <div className="sm:col-span-2"><p className="mb-2 text-sm font-bold text-slate-700">Logo <span className="font-normal text-slate-400">(opsional)</span></p><label className="flex min-h-[92px] cursor-pointer items-center gap-4 rounded-[20px] border border-dashed border-slate-300 bg-slate-50/60 p-4 transition hover:border-blue-400 hover:bg-blue-50/50 focus-within:ring-4 focus-within:ring-blue-100"><span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-blue-600">{values.logo?<img src={values.logo} alt="Store logo preview" className="h-full w-full object-cover"/>:<ImagePlus className="h-5 w-5"/>}</span><span><span className="block text-sm font-bold text-slate-700">{values.logo?'Change logo':'Upload store logo'}</span><span className="mt-1 block text-xs text-slate-500">PNG or JPG, max. 2 MB</span></span><input type="file" accept="image/png,image/jpeg" onChange={onLogoChange} className="sr-only" aria-label="Upload store logo" /></label></div>
      </div>
    </div>
  </motion.section>
}
