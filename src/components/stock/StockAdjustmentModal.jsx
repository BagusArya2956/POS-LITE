import { useEffect, useState } from 'react'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { toNumber } from '../../lib/helpers.js'
import { formatQuantity } from '../../lib/format.js'
import { getQuantityStep } from '../../lib/quantity.js'
import { getUnitName } from '../../lib/selectors.js'

function StockAdjustmentModal({
  open,
  onClose,
  onSubmit,
  products,
  variants,
  units,
  initialSelection,
  mode,
}) {
  const [form, setForm] = useState({
    productId: '',
    variantId: '',
    quantity: 0,
    note: '',
    reason: '',
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      productId: initialSelection?.productId || '',
      variantId: initialSelection?.variantId || '',
      quantity: 0,
      note: '',
      reason: mode === 'out' ? 'Manual adjustment' : 'Manual restock',
    })
  }, [initialSelection, mode, open])

  const selectedProduct = products.find((product) => product.id === form.productId)
  const productVariants = variants.filter((variant) => variant.productId === form.productId)
  const selectedVariant = variants.find((variant) => variant.id === form.variantId)
  const requiresVariantSelection = productVariants.length > 0
  const unitName = selectedProduct ? getUnitName(units, selectedProduct.unitId) : ''
  const step = selectedProduct ? getQuantityStep(selectedProduct.type, unitName) : 1
  const currentStock = requiresVariantSelection
    ? (selectedVariant?.stock ?? null)
    : (selectedProduct?.stock ?? 0)
  const nextStock =
    currentStock === null
      ? null
      : mode === 'in'
        ? currentStock + toNumber(form.quantity)
        : currentStock - toNumber(form.quantity)

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedProduct) {
      window.alert('Select a product first.')
      return
    }

    if (requiresVariantSelection && !form.variantId) {
      window.alert("Select a variant before adjusting this product's stock.")
      return
    }

    onSubmit({
      ...form,
      mode,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'in' ? 'Add Stock' : 'Remove Stock'}
      className="max-w-2xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Select Product</label>
          <select
            className="form-select"
            value={form.productId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                productId: event.target.value,
                variantId: '',
              }))
            }
          >
            <option value="">Search and select a product...</option>
            {products
              .filter((product) => product.trackStock)
              .map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
          </select>
        </div>

        {productVariants.length > 0 ? (
          <div>
            <label className="form-label">Select Variant</label>
            <select
              className="form-select"
              value={form.variantId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  variantId: event.target.value,
                }))
              }
            >
              <option value="">Select a variant</option>
              {productVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              Select a specific variant to keep inventory accurate.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">
              {mode === 'in' ? 'Quantity in' : 'Quantity out'}
            </label>
            <input
              type="number"
              min="0"
              step={step}
              className="form-input"
              value={form.quantity}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  quantity: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="form-label">Reason</label>
            <input
              className="form-input"
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="E.g. stock count, return, supplier"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            value={form.note}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                note: event.target.value,
              }))
            }
            placeholder={
              mode === 'in'
                ? 'Example: goods received from supplier'
                : 'Example: damaged, lost, or stock adjustment'
            }
          />
        </div>

        <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
          <p>
            Current stock:{' '}
            {currentStock === null ? 'Select a variant first' : formatQuantity(currentStock)}
          </p>
          <p
            className={
              nextStock !== null && nextStock < 0
                ? 'mt-1 font-semibold text-rose-600'
                : 'mt-1 font-semibold text-slate-900'
            }
          >
            Stock after adjustment:{' '}
            {nextStock === null ? '-' : formatQuantity(nextStock)}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={mode === 'in' ? 'primary' : 'danger'}>
            {mode === 'in' ? 'Save stock' : 'Save adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default StockAdjustmentModal
