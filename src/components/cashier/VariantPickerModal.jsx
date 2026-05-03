import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { formatQuantity, formatRupiah } from '../../lib/format.js'
import { getStockStatus } from '../../lib/selectors.js'

function VariantPickerModal({ open, onClose, product, variants, onChoose }) {
  if (!product) {
    return null
  }

  return (
    <Modal open={open} onClose={onClose} title={`Pilih Varian ${product.name}`} className="max-w-2xl">
      <div className="space-y-4">
        {variants.map((variant) => {
          const status = getStockStatus(variant.stock, variant.minimumStock, true)
          const isUnavailable = variant.stock <= 0 && product.trackStock
          return (
            <div
              key={variant.id}
              className="rounded-3xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-slate-50"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">{variant.name}</p>
                  <p className="text-sm text-slate-500">{variant.attributes || 'Varian produk'}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Badge tone="blue">Stok {formatQuantity(variant.stock)}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-blue-700">
                    {formatRupiah(variant.sellPrice || product.sellPrice)}
                  </p>
                  <Button
                    className="mt-3"
                    onClick={() => onChoose(variant)}
                    disabled={isUnavailable}
                  >
                    {isUnavailable ? 'Stok habis' : 'Pilih varian'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default VariantPickerModal
