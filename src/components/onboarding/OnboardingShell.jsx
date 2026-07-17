import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Cloud, LoaderCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import VigoLogo from '../brand/VigoLogo.jsx'
import { steps } from './onboardingData.js'

export function OnboardingShell({ currentStep, saved, children, onBack, onNext, nextLabel, nextDisabled, hideBack, hideFooter }) {
  const scrollRef = useRef(null)
  const [scrollState, setScrollState] = useState({ scrollable: false, canGoUp: false, canGoDown: false })
  const progress = Math.min(100, Math.round((currentStep / 4) * 100))
  const remainingMinutes = Math.max(1, Math.ceil((4 - Math.min(currentStep, 4)) * 0.75))

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return undefined

    function updateScrollState() {
      const maxScroll = container.scrollHeight - container.clientHeight
      setScrollState({
        scrollable: maxScroll > 8,
        canGoUp: container.scrollTop > 8,
        canGoDown: container.scrollTop < maxScroll - 8,
      })
    }

    const frameId = window.requestAnimationFrame(() => {
      container.scrollTo({ top: 0, behavior: 'smooth' })
      updateScrollState()
    })
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(container)
    container.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [currentStep])

  function scrollPage(direction) {
    const container = scrollRef.current
    if (!container) return
    container.scrollBy({
      top: direction === 'down' ? Math.max(280, container.clientHeight * 0.72) : -Math.max(280, container.clientHeight * 0.72),
      behavior: 'smooth',
    })
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#F8FAFC] text-slate-950">
      {currentStep !== 0 && <header className="relative z-40 shrink-0 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:h-20 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <VigoLogo size="sm" />
            <div>
              <div className="flex items-baseline gap-1.5"><p className="font-brand text-[20px] font-extrabold leading-none tracking-[-0.06em] text-slate-950">vigo</p><span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">POS</span></div>
              <p className="hidden text-xs text-slate-500 sm:block">Store setup</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-500 sm:text-sm">
            <span className="inline-flex items-center gap-1.5" aria-live="polite">
              {saved ? <><Cloud className="h-4 w-4" /> Saved</> : <><LoaderCircle className="h-4 w-4 animate-spin" /> Saving</>}
            </span>
            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
            <span className="hidden sm:inline">About {remainingMinutes} min left</span>
          </div>
        </div>
      </header>}

      {currentStep > 0 && currentStep < 5 && (
        <div className="shrink-0 border-b border-slate-200/70 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-8 sm:py-5">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Langkah {currentStep} dari 4</span>
                  <span className="text-blue-700">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full bg-blue-600" animate={{ width: `${progress}%` }} transition={{ duration: 0.22 }} />
                </div>
              </div>
              <div className="hidden items-center gap-2 md:flex" aria-label="Progress setup">
                {steps.slice(1, 5).map((step, index) => {
                  const number = index + 1
                  const complete = currentStep > number
                  const active = currentStep === number
                  return <div key={step.id} className={`flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${complete ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                      {complete ? <Check className="h-3 w-3" /> : number}
                    </span>{step.short}
                  </div>
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain scroll-smooth">
        <div className={`mx-auto w-full px-4 sm:px-8 ${currentStep === 0 ? 'max-w-[1560px] py-0' : currentStep === 5 ? 'max-w-6xl py-8 sm:py-12' : 'max-w-5xl py-8 sm:py-12 lg:py-14'} ${hideFooter ? '' : 'pb-8 sm:pb-10'}`}>
          {children}
        </div>
      </main>

      {!hideFooter && (
        <footer className="relative z-50 shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex min-h-[80px] max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
            {!hideBack ? <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" aria-label="Go back to the previous step"><ChevronLeft className="h-4 w-4" /> Back</button> : <span />}
            <button type="button" onClick={() => onNext?.()} disabled={nextDisabled} className="pointer-events-auto relative z-10 inline-flex min-h-12 min-w-[152px] items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)] transition duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:shadow-none">
              {nextLabel}<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </footer>
      )}

      {scrollState.scrollable && (
        <div className={`fixed right-4 z-[45] flex flex-col gap-2 sm:right-6 ${hideFooter ? 'bottom-6' : 'bottom-24'}`} aria-label="Page scroll controls">
          <button type="button" onClick={() => scrollPage('up')} disabled={!scrollState.canGoUp} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:pointer-events-none disabled:opacity-0" aria-label="Scroll up"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" onClick={() => scrollPage('down')} disabled={!scrollState.canGoDown} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur transition hover:border-blue-200 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:pointer-events-none disabled:opacity-0" aria-label="Scroll down"><ArrowDown className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  )
}
