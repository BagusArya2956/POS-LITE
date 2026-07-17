import { useEffect, useMemo, useState } from 'react'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { formatQuantity, formatRupiah } from '../../lib/format.js'
import {
  allowsDecimalQuantity,
  getQuantityStep,
  normalizeQuantity,
} from '../../lib/quantity.js'

function QuantityPickerModal({
  open,
  onClose,
  onConfirm,
  product,
  variant = null,
  unitName = '',
  initialQuantity = 0,
  availableStock = null,
  allowOverselling = false,
}) {
  const [quantity, setQuantity] = useState(0)
  const productType = product?.type || 'basic'
  const step = getQuantityStep(productType, unitName)
  const allowDecimal = allowsDecimalQuantity(productType, unitName)

  useEffect(() => {
    if (!open) {
      return
    }

    setQuantity(initialQuantity || step)
  }, [initialQuantity, open, step])

  const quickQuantities = useMemo(() => {
    if (allowDecimal) {
      return [step, step * 5, 1, 2]
    }

    return [1, 2, 5, 10]
  }, [allowDecimal, step])

  if (!product) {
    return null
  }

  function submit() {
    const normalizedQuantity = normalizeQuantity(quantity, productType, unitName)
    if (normalizedQuantity <= 0) {
      window.alert('Quantity must be greater than 0.')
      return
    }

    if (
      product.trackStock &&
      availableStock !== null &&
      normalizedQuantity > availableStock &&
      !allowOverselling
    ) {
      window.alert('Quantity exceeds available stock.')
      return
    }

    onConfirm(normalizedQuantity)
  }

  return (
    <Modal open={open} onClose={onClose} title="Set Quantity" className="max-w-xl">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-slate-900">{product.name}</p>
              {variant ? <p className="mt-1 text-sm text-slate-500">{variant.name}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="blue">{unitName}</Badge>
                {product.trackStock ? (
                  <Badge tone="green">Available stock: {formatQuantity(availableStock)}</Badge>
                ) : (
                  <Badge tone="green">No inventory</Badge>
                )}
              </div>
            </div>
            <p className="text-xl font-extrabold text-blue-700">
              {formatRupiah(Number(variant?.sellPrice || product.sellPrice))}
            </p>
          </div>
        </div>

        <div>
          <label className="form-label">Quantity ({unitName})</label>
          <input
            type="number"
            min={step}
            step={step}
            className="form-input text-lg font-semibold"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          <p className="mt-2 text-sm text-slate-500">
            {allowDecimal
              ? `This product supports fractional quantities in increments of ${formatQuantity(step)} ${unitName}.`
              : 'This product uses whole-unit quantities.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {quickQuantities.map((value) => (
            <button
              key={value}
              type="button"
              className="pill-button"
              onClick={() => setQuantity(value)}
            >
              {formatQuantity(value)} {unitName}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-blue-50 p-4 text-sm text-blue-700">
          Estimated subtotal: {formatRupiah(Number(variant?.sellPrice || product.sellPrice) * Number(quantity || 0))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>Save Quantity</Button>
        </div>
      </div>
    </Modal>
  )
}

export default QuantityPickerModal
