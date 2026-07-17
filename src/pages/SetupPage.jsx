import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'framer-motion'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { usePos } from '../context/PosContext.jsx'
import { readFileAsDataUrl } from '../lib/helpers.js'
import { BusinessStep } from '../components/onboarding/BusinessStep.jsx'
import { OnboardingShell } from '../components/onboarding/OnboardingShell.jsx'
import { OperationsStep } from '../components/onboarding/OperationsStep.jsx'
import { ReviewStep } from '../components/onboarding/ReviewStep.jsx'
import { StoreStep } from '../components/onboarding/StoreStep.jsx'
import { SuccessStep } from '../components/onboarding/SuccessStep.jsx'
import { WelcomeStep } from '../components/onboarding/WelcomeStep.jsx'
import { defaultValues, ONBOARDING_STORAGE_KEY } from '../components/onboarding/onboardingData.js'

const setupSchema = z.object({
  businessType: z.string().min(1, 'Select a business type to continue.'),
  businessVariant: z.string().optional(),
  salesMode: z.enum(['counter', 'order']),
  stockTypesManaged: z.array(z.string()).min(1, 'Select at least one inventory management method.'),
  storeName: z.string().trim().min(2, 'Store name must contain at least 2 characters.').max(60, 'Maximum 60 characters.'),
  address: z.string().trim().max(160, 'Maximum 160 characters.').optional(),
  whatsapp: z.string().trim().regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, 'Enter a valid Indonesian WhatsApp number.'),
  logo: z.string().optional(),
})

function loadDraft() {
  try {
    const draft = JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) || 'null')
    return draft?.values ? { ...defaultValues, ...draft.values } : defaultValues
  } catch {
    return defaultValues
  }
}

function SetupSkeleton() {
  return <div className="min-h-dvh bg-[#F8FAFC] px-4 py-8" aria-label="Memuat progres setup"><div className="mx-auto max-w-5xl animate-pulse"><div className="h-14 rounded-2xl bg-slate-200/70"/><div className="mt-16 h-8 w-2/5 rounded-lg bg-slate-200/70"/><div className="mt-4 h-4 w-3/5 rounded bg-slate-200/60"/><div className="mt-10 grid gap-4 sm:grid-cols-3">{[1,2,3,4,5,6].map(item=><div key={item} className="h-36 rounded-[22px] bg-white ring-1 ring-slate-200"/>)}</div></div></div>
}

function SetupPage() {
  const { initializeStore } = usePos()
  const [currentStep, setCurrentStep] = useState(() => {
    try { return Math.min(Math.max(Number(JSON.parse(window.localStorage.getItem(ONBOARDING_STORAGE_KEY) || 'null')?.step || 0), 0), 4) } catch { return 0 }
  })
  const [hydrating, setHydrating] = useState(true)
  const [saved, setSaved] = useState(true)
  const [stepError, setStepError] = useState('')

  const form = useForm({ resolver: zodResolver(setupSchema), defaultValues: loadDraft(), mode: 'onChange' })
  const values = useWatch({ control: form.control })
  const draftValuesJson = JSON.stringify(values)

  useEffect(() => { const id = window.setTimeout(() => setHydrating(false), 280); return () => window.clearTimeout(id) }, [])
  useEffect(() => {
    setSaved(false)
    const id = window.setTimeout(() => {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ step: Math.min(currentStep, 4), values: JSON.parse(draftValuesJson), updatedAt: new Date().toISOString() }))
      setSaved(true)
    }, 450)
    return () => window.clearTimeout(id)
  }, [currentStep, draftValuesJson])

  const goBack = useCallback(() => { setStepError(''); setCurrentStep(step => Math.max(0, step - 1)) }, [])
  const goNext = useCallback(async () => {
    setStepError('')
    const latestValues = form.getValues()
    if (currentStep === 0) { setCurrentStep(1); return }
    if (currentStep === 1 && !latestValues.businessType) { setStepError('Select a business type to continue.'); return }
    if (currentStep === 2 && latestValues.stockTypesManaged.length === 0) { setStepError('Select at least one inventory management method.'); return }
    if (currentStep === 3) {
      const valid = await form.trigger(['storeName', 'whatsapp', 'address'], { shouldFocus: true })
      if (!valid) return
    }
    setCurrentStep(step => Math.min(5, step + 1))
  }, [currentStep, form])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && currentStep > 0 && currentStep < 5) { event.preventDefault(); goBack() }
      if (event.key === 'Enter' && currentStep < 5 && event.target?.tagName !== 'TEXTAREA' && event.target?.type !== 'file') { event.preventDefault(); goNext() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentStep, goBack, goNext])

  const toggleStock = useCallback((id) => {
    const current = form.getValues('stockTypesManaged')
    form.setValue('stockTypesManaged', current.includes(id) ? current.filter(item => item !== id) : [...current, id], { shouldValidate: true, shouldDirty: true })
    setStepError('')
  }, [form])

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setStepError('Logo size must not exceed 2 MB.'); return }
    form.setValue('logo', await readFileAsDataUrl(file), { shouldDirty: true })
  }

  function enterDashboard() {
    const payload = form.getValues()
    initializeStore(payload)
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY)
  }

  const nextLabel = useMemo(() => currentStep === 4 ? 'Complete Setup' : 'Continue', [currentStep])
  if (hydrating) return <SetupSkeleton />

  return <OnboardingShell currentStep={currentStep} saved={saved} onBack={goBack} onNext={goNext} nextLabel={nextLabel} nextDisabled={false} hideBack={currentStep===0} hideFooter={currentStep===0||currentStep===5}>
    <AnimatePresence mode="wait">
      <motion.div key={currentStep} exit={{opacity:0,y:-6}} transition={{duration:.15}}>
        {currentStep === 0 && <WelcomeStep onStart={goNext} />}
        {currentStep === 1 && <BusinessStep value={values.businessType} variant={values.businessVariant} onChange={(option) => { form.setValue('businessType', option.value, {shouldValidate:true,shouldDirty:true}); form.setValue('businessVariant', option.variant||'', {shouldDirty:true}); setStepError('') }} error={stepError} />}
        {currentStep === 2 && <OperationsStep salesMode={values.salesMode} stockTypes={values.stockTypesManaged} onSalesChange={(value)=>form.setValue('salesMode',value,{shouldValidate:true,shouldDirty:true})} onStockChange={toggleStock} error={stepError} />}
        {currentStep === 3 && <StoreStep register={form.register} errors={form.formState.errors} values={values} onLogoChange={handleLogoChange} />}
        {currentStep === 4 && <ReviewStep values={values} goToStep={setCurrentStep} />}
        {currentStep === 5 && <SuccessStep values={values} onDashboard={enterDashboard} />}
      </motion.div>
    </AnimatePresence>
    {stepError && currentStep === 3 && <p className="mt-4 text-sm font-medium text-rose-600" role="alert">{stepError}</p>}
  </OnboardingShell>
}

export default SetupPage
