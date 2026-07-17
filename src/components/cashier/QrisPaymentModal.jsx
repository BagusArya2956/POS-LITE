import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, RefreshCcw, Smartphone } from 'lucide-react'
import { formatDateTime, formatRupiah, humanizePaymentMethod } from '../../lib/format.js'
import { isQrisPaid } from '../../lib/qris.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

function getStatusTone(status) {
  const normalized = String(status || '').toLowerCase()

  if (isQrisPaid(normalized)) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (normalized === 'pending') {
    return 'bg-amber-50 text-amber-700'
  }

  return 'bg-slate-100 text-slate-700'
}

function humanizeGatewayStatus(status) {
  const normalized = String(status || '').toLowerCase()
  const map = {
    pending: 'Waiting for payment',
    settlement: 'Payment successful',
    capture: 'Payment successful',
    expire: 'QR kedaluwarsa',
    cancel: 'Cancelled',
    deny: 'Ditolak',
    failure: 'Failed',
  }

  return map[normalized] || normalized || '-'
}

function QrisPaymentModal({
  open,
  payload,
  checking,
  onClose,
  onRefreshStatus,
  onConfirmPaid,
  error,
}) {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (!open || !payload?.expiresAt) {
      setSecondsLeft(0)
      return
    }

    function updateCountdown() {
      const diff = new Date(payload.expiresAt).getTime() - Date.now()
      setSecondsLeft(Math.max(0, Math.floor(diff / 1000)))
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [open, payload?.expiresAt])

  if (!payload) {
    return null
  }

  const isPaid = isQrisPaid(payload.gatewayStatus)
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = `${secondsLeft % 60}`.padStart(2, '0')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="QRIS Payment"
      className="max-w-4xl"
      contentClassName="p-0"
    >
      <div className="grid lg:grid-cols-[1fr_0.9fr]">
        <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{payload.transactionNumber}</p>
              <p className="mt-2 text-sm text-slate-500">
                Total bayar {formatRupiah(payload.total)} lewat {humanizePaymentMethod('qris')}
              </p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getStatusTone(
                payload.gatewayStatus,
              )}`}
            >
              {humanizeGatewayStatus(payload.gatewayStatus)}
            </span>
          </div>

          <div className="mt-6 flex justify-center rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            {payload.qrUrl ? (
              <img
                src={payload.qrUrl}
                alt="QRIS payment"
                className="h-72 w-72 rounded-3xl bg-white object-contain p-4 shadow-sm"
              />
            ) : (
              <div className="flex h-72 w-72 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
                <Smartphone className="h-10 w-10" />
                <p className="mt-3 font-semibold">QR code unavailable</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Order Midtrans
              </p>
              <p className="mt-2 break-all font-semibold text-slate-900">{payload.orderId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Time limit
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {payload.expiresAt ? formatDateTime(payload.expiresAt) : '-'}
              </p>
              {!isPaid && payload.expiresAt ? (
                <p className="mt-2 text-sm text-slate-500">
                  Time remaining {minutes}:{seconds}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-slate-900">Payment steps</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>1. Ask the customer to scan the QRIS code using an e-wallet or mobile banking app.</li>
              <li>2. Wait for the provider to confirm the payment.</li>
              <li>3. Once confirmed, the transaction will be saved automatically.</li>
            </ol>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              {checking ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-700" />
              ) : isPaid ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <RefreshCcw className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="font-semibold text-slate-900">Status gateway</p>
                <p className="text-sm text-slate-500">{humanizeGatewayStatus(payload.gatewayStatus)}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={onRefreshStatus} disabled={checking}>
                <RefreshCcw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                Check Status
              </Button>
              {isPaid ? (
                <Button onClick={onConfirmPaid}>
                  <CheckCircle2 className="h-4 w-4" />
                  Save Transaction
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default QrisPaymentModal
