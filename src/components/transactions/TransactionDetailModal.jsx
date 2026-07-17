import { Share2, Printer } from 'lucide-react'
import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
  humanizePaymentMethod,
} from '../../lib/format.js'
import { buildReceiptText, printReceipt } from '../../lib/helpers.js'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import ReceiptPreview from '../shared/ReceiptPreview.jsx'

async function shareReceipt(payload) {
  const receiptText = buildReceiptText(payload)

  if (navigator.share) {
    await navigator.share({
      title: payload.transaction.transactionNumber,
      text: receiptText,
    })
    return
  }

  await navigator.clipboard.writeText(receiptText)
  window.alert('Receipt text copied to the clipboard.')
}

function TransactionDetailModal({ open, onClose, transaction, items, storeSettings }) {
  if (!transaction) {
    return null
  }

  const payload = {
    transaction,
    items,
    storeSettings,
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transaction Details"
      className="max-w-6xl"
      contentClassName="p-0"
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-3xl font-extrabold text-slate-900">{transaction.transactionNumber}</p>
              <p className="mt-2 text-sm text-slate-500">{formatDateTime(transaction.createdAt)}</p>
            </div>
            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                ['Successful', 'Berhasil'].includes(transaction.status)
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {['Successful', 'Berhasil'].includes(transaction.status) ? 'Successful' : 'Cancelled'}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 p-5">
            <h3 className="text-lg font-bold text-slate-900">Payment Information</h3>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <div>
                <p className="text-slate-400">Payment Method</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {humanizePaymentMethod(transaction.paymentMethod)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">POS</p>
                <p className="mt-1 font-semibold text-slate-900">{transaction.cashierName}</p>
              </div>
              {transaction.paymentReference ? (
                <div className="md:col-span-2">
                  <p className="text-slate-400">Payment Reference</p>
                  <p className="mt-1 break-all font-semibold text-slate-900">
                    {transaction.paymentReference}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Products</th>
                  <th className="px-5 py-3 font-semibold">Qty</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{item.productName}</p>
                      {item.variantName ? (
                        <p className="text-xs text-slate-500">{item.variantName}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatQuantity(item.qty)} {item.unitName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatRupiah(item.sellPrice)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span>{formatRupiah(transaction.discount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-blue-700">
                <span>Total Akhir</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 p-6">
          <h3 className="text-2xl font-bold text-slate-900">Receipt Preview</h3>
          <div className="mt-5">
            <ReceiptPreview transaction={transaction} items={items} storeSettings={storeSettings} />
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => shareReceipt(payload)}>
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
            <Button onClick={() => printReceipt(payload)}>
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TransactionDetailModal
