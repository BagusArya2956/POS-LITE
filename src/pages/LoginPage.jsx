import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Delete, Keyboard, ShieldCheck } from 'lucide-react'
import VigoLogo from '../components/brand/VigoLogo.jsx'
import { usePos } from '../context/PosContext.jsx'
import { formatClock, formatDate } from '../lib/format.js'

const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0']

function LoginPage() {
  const { database, session, authenticatePin } = usePos()
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())
  const pinInputRef = useRef(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const appendDigit = useCallback((digit) => {
    setPinInput((current) => (current.length < 4 ? current + digit : current))
    setError('')
    pinInputRef.current?.focus()
  }, [])

  const deleteDigit = useCallback(() => {
    setPinInput((current) => current.slice(0, -1))
    setError('')
    pinInputRef.current?.focus()
  }, [])

  const handleLogin = useCallback(() => {
    if (pinInput.length !== 4) {
      setError('Enter your 4-digit PIN to continue.')
      pinInputRef.current?.focus()
      return
    }

    if (!authenticatePin(pinInput)) {
      setError('The PIN you entered is incorrect. Please try again.')
      setPinInput('')
      pinInputRef.current?.focus()
    }
  }, [authenticatePin, pinInput])

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.target === pinInputRef.current) return

      if (/^\d$/.test(event.key)) {
        event.preventDefault()
        appendDigit(event.key)
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        deleteDigit()
      } else if (event.key === 'Enter') {
        event.preventDefault()
        handleLogin()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [appendDigit, deleteDigit, handleLogin])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 sm:px-6">
      <section className="grid w-full max-w-[960px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-11 text-white lg:flex lg:flex-col">
          <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border border-white/[0.06]" />
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/[0.08]" />

          <div className="relative flex items-center gap-3">
            <VigoLogo size="md" frameClassName="ring-1 ring-white/15" />
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-brand text-2xl font-extrabold leading-none tracking-[-0.065em]">vigo</p>
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">POS</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Secure register access</p>
            </div>
          </div>

          <div className="relative my-auto py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-400">Ready for business</p>
            <h1 className="mt-4 text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em]">
              Start selling with confidence.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">
              Sign in to manage checkout, inventory, transactions, and daily reports from one workspace.
            </p>
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/10 pt-6">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium">Local PIN protection</p>
              <p className="mt-0.5 text-xs text-slate-500">Your register stays protected between sessions.</p>
            </div>
          </div>
        </aside>

        <div className="px-6 py-7 sm:px-10 sm:py-9 lg:px-12">
          <header className="flex items-start justify-between gap-5 border-b border-slate-100 pb-6">
            <div className="flex min-w-0 items-center gap-3 lg:hidden">
              <VigoLogo size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{database.storeSettings?.storeName || 'VIGO POS'}</p>
                <p className="mt-0.5 text-xs text-slate-400">Secure register access</p>
              </div>
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-semibold text-slate-900">{database.storeSettings?.storeName || 'Your Store'}</p>
              <p className="mt-0.5 truncate text-xs text-slate-400">{database.storeSettings?.address || 'Point of Sale'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-slate-700">{formatClock(now)}</p>
              <p className="mt-0.5 text-xs text-slate-400">{formatDate(now)}</p>
            </div>
          </header>

          <div className="mx-auto max-w-[370px] pt-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Staff sign in</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">Enter your PIN</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use the keypad below or type four numbers on your keyboard.</p>
            </div>

            {session.setupCompletedAt && database.pin === '1234' ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-5 text-amber-800">
                  First sign-in? Use the default PIN <strong>1234</strong>, then change it in Settings.
                </p>
              </div>
            ) : null}

            <label className="relative mt-6 block cursor-text" onClick={() => pinInputRef.current?.focus()}>
              <span className="sr-only">Four-digit PIN</span>
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="4"
                autoFocus
                autoComplete="current-password"
                value={pinInput}
                onChange={(event) => {
                  setPinInput(event.target.value.replace(/\D/g, '').slice(0, 4))
                  setError('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleLogin()
                  }
                }}
                className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                aria-describedby={error ? 'pin-error' : 'pin-hint'}
              />
              <div className="grid grid-cols-4 gap-3" aria-hidden="true">
                {Array.from({ length: 4 }).map((_, index) => (
                  <span key={index} className={`flex h-14 items-center justify-center rounded-xl border transition ${index < pinInput.length ? 'border-slate-950 bg-slate-950' : 'border-slate-200 bg-slate-50'} ${index === pinInput.length ? 'ring-4 ring-blue-100' : ''}`}>
                    {index < pinInput.length ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                  </span>
                ))}
              </div>
            </label>

            <div className="mt-3 min-h-6">
              {error ? (
                <p id="pin-error" className="text-sm font-medium text-rose-600" role="alert">{error}</p>
              ) : (
                <p id="pin-hint" className="flex items-center gap-2 text-xs text-slate-400"><Keyboard className="h-3.5 w-3.5" /> Numbers to enter · Backspace to delete · Enter to sign in</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {keypadNumbers.map((digit, index) =>
                digit ? (
                  <button key={digit} type="button" className="flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100" onClick={() => appendDigit(digit)} aria-label={`Enter ${digit}`}>
                    {digit}
                  </button>
                ) : index === 9 ? (
                  <button key="forgot-pin" type="button" className="rounded-xl text-xs font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-700" onClick={() => window.alert('Your PIN is stored locally. Restore a JSON backup or change the PIN from Settings after signing in.')}>
                    Forgot PIN?
                  </button>
                ) : (
                  <button key="delete-key" type="button" className="flex h-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-100" onClick={deleteDigit} aria-label="Delete the last digit">
                    <Delete className="h-5 w-5" />
                  </button>
                ),
              )}
            </div>

            <button type="button" onClick={handleLogin} className="group mt-5 inline-flex min-h-13 w-full items-center justify-between rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LoginPage
