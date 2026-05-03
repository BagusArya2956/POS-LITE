import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
  humanizePaymentMethod,
} from '../../lib/format.js'

function ReceiptPreview({ transaction, items, storeSettings }) {
  if (!transaction) {
    return null
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 font-mono text-sm leading-7 text-slate-800">
      <div className="text-center">
        <p className="text-xl font-bold uppercase tracking-[0.35em]">
          {storeSettings?.receiptName || storeSettings?.storeName || 'VIGO POS'}
        </p>
        <p className="mt-2 text-xs">{storeSettings?.receiptAddress || storeSettings?.address || '-'}</p>
        <p className="text-xs">{storeSettings?.receiptWhatsApp || storeSettings?.whatsapp || '-'}</p>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span>No:</span>
          <span>{transaction.transactionNumber}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Tanggal:</span>
          <span>{formatDateTime(transaction.createdAt)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Kasir:</span>
          <span>{transaction.cashierName}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Metode:</span>
          <span>{humanizePaymentMethod(transaction.paymentMethod)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-3 text-xs">
        {items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between gap-4">
              <span>
                {item.productName}
                {item.variantName ? ` (${item.variantName})` : ''}
              </span>
              <span>{formatRupiah(item.subtotal)}</span>
            </div>
            <p className="text-slate-500">
              {formatQuantity(item.qty)} x {formatRupiah(item.sellPrice)} / {item.unitName}
            </p>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span>Subtotal</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Diskon</span>
          <span>{formatRupiah(transaction.discount)}</span>
        </div>
        <div className="flex justify-between gap-4 font-bold text-slate-900">
          <span>Total</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>
      </div>

      <div className="my-4 border-t border-dashed border-slate-300" />

      <p className="whitespace-pre-line text-center text-xs text-slate-500">
        {storeSettings?.receiptFooter ||
          'Terima kasih atas kunjungan Anda.\nBarang yang sudah dibeli tidak dapat ditukar atau dikembalikan.'}
      </p>
    </div>
  )
}

export default ReceiptPreview
