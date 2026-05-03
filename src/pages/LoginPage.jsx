import { useEffect, useState } from 'react'
import { Delete } from 'lucide-react'
import VigoLogo from '../components/brand/VigoLogo.jsx'
import Button from '../components/ui/Button.jsx'
import { usePos } from '../context/PosContext.jsx'
import { formatClock, formatDate } from '../lib/format.js'

const keypadNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0']

function LoginPage() {
  const { database, session, authenticatePin } = usePos()
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  function appendDigit(digit) {
    if (pinInput.length >= 4) {
      return
    }

    setPinInput((current) => current + digit)
    setError('')
  }

  function handleLogin() {
    if (pinInput.length !== 4) {
      setError('PIN harus terdiri dari 4 digit.')
      return
    }

    if (!authenticatePin(pinInput)) {
      setError('PIN yang Anda masukkan belum sesuai.')
      setPinInput('')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen items-center justify-center px-4 py-8">
      <div className="surface-card w-full max-w-lg overflow-hidden border-white/80 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <VigoLogo size="sm" withBackground={false} frameClassName="rounded-xl bg-blue-50 text-blue-700" />
            <div>
              <p className="font-semibold text-slate-900">
                {database.storeSettings?.storeName || 'VIGO POS'}
              </p>
              <p className="text-sm text-slate-500">{database.storeSettings?.address || '-'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-slate-900">{formatDate(now)}</p>
            <p className="text-sm text-slate-500">{formatClock(now)} WIB</p>
          </div>
        </div>

        <div className="px-6 py-7 text-center">
          <VigoLogo size="lg" className="mx-auto" />
          <p className="mt-4 text-4xl font-extrabold tracking-tight text-blue-700">VIGO POS</p>
          <h1 className="mt-5 text-[2rem] font-bold tracking-tight text-slate-900">Masuk ke VIGO POS</h1>
          <p className="mt-2 text-base text-slate-500">
            Masukkan PIN untuk mulai menggunakan kasir
          </p>

          {session.setupCompletedAt ? (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-blue-800">
                Setup awal {session.setupStoreName ? `"${session.setupStoreName}"` : 'toko'} sudah selesai
              </p>
              <p className="mt-1 text-sm leading-6 text-blue-700/85">
                Login pertama menggunakan PIN default <span className="font-bold">1234</span>.
                Setelah masuk, Anda bisa langsung menggantinya dari halaman Pengaturan.
              </p>
            </div>
          ) : null}

          <div className="mt-7 flex justify-center gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                className={`h-5 w-5 rounded-full border ${
                  index < pinInput.length ? 'border-blue-700 bg-blue-700' : 'border-slate-300 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {error ? <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p> : null}

          <div className="mx-auto mt-7 grid max-w-[19rem] grid-cols-3 gap-3.5">
            {keypadNumbers.map((digit, index) =>
              digit ? (
                <button
                  key={digit}
                  type="button"
                  className="flex h-24 items-center justify-center rounded-full bg-slate-100 text-[2rem] font-semibold text-slate-900 transition hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => appendDigit(digit)}
                >
                  {digit}
                </button>
              ) : index === 9 ? (
                <div key="empty-space" />
              ) : (
                <button
                  key="delete-key"
                  type="button"
                  className="flex h-24 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => setPinInput((current) => current.slice(0, -1))}
                >
                  <Delete className="h-8 w-8" />
                </button>
              ),
            )}
          </div>

          <Button className="mt-7 w-full" size="lg" onClick={handleLogin}>
            Masuk
          </Button>
          <button
            type="button"
            className="mt-5 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            onClick={() =>
              window.alert(
                'PIN tersimpan secara lokal. Gunakan file backup JSON untuk memulihkan data atau ubah PIN dari halaman Pengaturan saat sudah masuk.',
              )
            }
          >
            Lupa PIN?
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
