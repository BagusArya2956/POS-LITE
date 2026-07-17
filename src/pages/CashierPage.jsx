import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
} from 'lucide-react'
import QuantityPickerModal from '../components/cashier/QuantityPickerModal.jsx'
import QrisPaymentModal from '../components/cashier/QrisPaymentModal.jsx'
import VariantPickerModal from '../components/cashier/VariantPickerModal.jsx'
import TransactionDetailModal from '../components/transactions/TransactionDetailModal.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { usePos } from '../context/PosContext.jsx'
import {
  formatQuantity,
  formatRupiah,
  humanizePaymentMethod,
  humanizeProductType,
} from '../lib/format.js'
import {
  allowsDecimalQuantity,
  getQuantityStep,
  normalizeQuantity,
} from '../lib/quantity.js'
import {
  createQrisPayment,
  fetchQrisStatus,
  isQrisGatewayEnabled,
  isQrisPaid,
} from '../lib/qris.js'
import {
  getCategoryName,
  getProductCurrentStock,
  getStockStatus,
  getTransactionItems,
  getUnitName,
  getVariantsForProduct,
} from '../lib/selectors.js'
import { generateTransactionNumber } from '../lib/helpers.js'

function createCartKey(productId, variantId) {
  return `${productId}::${variantId || 'base'}`
}

function CashierPage() {
  const { database, createTransaction, notify } = usePos()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cartItems, setCartItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantityModal, setQuantityModal] = useState({
    productId: '',
    variantId: '',
    cartKey: '',
    initialQuantity: 0,
  })
  const [receiptTransactionId, setReceiptTransactionId] = useState('')
  const [qrisModalOpen, setQrisModalOpen] = useState(false)
  const [qrisPayload, setQrisPayload] = useState(null)
  const [qrisChecking, setQrisChecking] = useState(false)
  const [qrisError, setQrisError] = useState('')

  const activePayments = Object.entries(database.storeSettings?.paymentMethods || {})
    .filter(([, enabled]) => enabled)
    .map(([method]) => method)
  const qrisGatewayEnabled = isQrisGatewayEnabled()

  const displayedProducts = useMemo(() => {
    return database.products.filter((product) => {
      const categoryName = getCategoryName(database.categories, product.categoryId)
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        categoryName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'favorites'
            ? product.isFavorite
            : product.categoryId === selectedCategory

      return product.status !== 'Nonaktif' && matchesSearch && matchesCategory
    })
  }, [database.categories, database.products, search, selectedCategory])

  const selectedTransaction = database.transactions.find(
    (transaction) => transaction.id === receiptTransactionId,
  )
  const receiptItems = selectedTransaction
    ? getTransactionItems(database, selectedTransaction.id)
    : []
  const activeQuantityProduct = database.products.find(
    (product) => product.id === quantityModal.productId,
  )
  const activeQuantityVariant = quantityModal.variantId
    ? database.variants.find((variant) => variant.id === quantityModal.variantId)
    : null

  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.sellPrice * item.qty, 0)
  const cartTotal = Math.max(0, cartSubtotal - Number(discount || 0))

  useEffect(() => {
    if (!qrisModalOpen || !qrisPayload?.orderId || isQrisPaid(qrisPayload.gatewayStatus)) {
      return
    }

    let isCancelled = false

    async function pollQrisStatus() {
      try {
        const statusResult = await fetchQrisStatus(qrisPayload.orderId)
        if (isCancelled) {
          return
        }

        setQrisPayload((current) =>
          current
            ? {
                ...current,
                gatewayStatus: statusResult.gatewayStatus,
                rawStatus: statusResult,
              }
            : current,
        )
      } catch {
        // Silent during polling; manual check still surfaces explicit errors.
      }
    }

    const intervalId = window.setInterval(() => {
      void pollQrisStatus()
    }, 7000)

    return () => {
      isCancelled = true
      window.clearInterval(intervalId)
    }
  }, [qrisModalOpen, qrisPayload?.gatewayStatus, qrisPayload?.orderId])

  function addToCart(product, variant = null, quantityInput = 1) {
    const cartKey = createCartKey(product.id, variant?.id)
    const existingCartItem = cartItems.find((item) => item.cartKey === cartKey)
    const productVariants = getVariantsForProduct(database.variants, product.id)
    const availableStock = variant
      ? Number(variant.stock || 0)
      : Number(getProductCurrentStock(product, productVariants) || 0)
    const unitName = getUnitName(database.units, product.unitId)
    const quantity = normalizeQuantity(quantityInput, product.type, unitName)

    if (quantity <= 0) {
      return
    }

    const allowOverselling = Boolean(
      database.storeSettings?.inventoryPreferences?.allowOverselling,
    )

    if (product.trackStock && availableStock <= 0 && !allowOverselling) {
      window.alert('This product is out of stock and cannot be added to the cart.')
      return
    }

    if (
      product.trackStock &&
      !allowOverselling &&
      existingCartItem &&
      existingCartItem.qty + quantity > availableStock
    ) {
      window.alert('Cart quantity exceeds available stock.')
      return
    }

    const itemPayload = {
      cartKey,
      productId: product.id,
      variantId: variant?.id || '',
      productName: product.name,
      variantName: variant?.name || '',
      productType: product.type,
      qty: quantity,
      unitName,
      sellPrice: Number(variant?.sellPrice || product.sellPrice),
      costPrice: Number(variant?.costPrice || product.costPrice),
      step: getQuantityStep(product.type, unitName),
      allowDecimal: allowsDecimalQuantity(product.type, unitName),
    }

    setCartItems((current) => {
      if (existingCartItem) {
        return current.map((item) =>
          item.cartKey === cartKey
            ? {
                ...item,
                qty: normalizeQuantity(item.qty + quantity, item.productType, item.unitName),
              }
            : item,
        )
      }

      return [...current, itemPayload]
    })
  }

  function openQuantityModal(product, variant = null, initialQuantity) {
    setQuantityModal({
      productId: product.id,
      variantId: variant?.id || '',
      cartKey: '',
      initialQuantity:
        initialQuantity ||
        getQuantityStep(product.type, getUnitName(database.units, product.unitId)),
    })
  }

  function handleProductClick(product) {
    if (product.type === 'variant') {
      setSelectedProduct(product)
      return
    }

    if (product.type === 'weighted' || product.type === 'service') {
      openQuantityModal(product)
      return
    }

    addToCart(product)
  }

  function changeCartQuantity(cartKey, nextQuantity) {
    setCartItems((current) => {
      const target = current.find((item) => item.cartKey === cartKey)
      if (!target) {
        return current
      }

      const product = database.products.find((item) => item.id === target.productId)
      const variant = target.variantId
        ? database.variants.find((item) => item.id === target.variantId)
        : null
      const productVariants = getVariantsForProduct(database.variants, target.productId)
      const availableStock = variant
        ? Number(variant.stock || 0)
        : Number(getProductCurrentStock(product, productVariants) || 0)
      const normalizedQuantity = normalizeQuantity(
        nextQuantity,
        target.productType,
        target.unitName,
      )

      if (normalizedQuantity <= 0) {
        return current.filter((item) => item.cartKey !== cartKey)
      }

      if (
        product?.trackStock &&
        normalizedQuantity > availableStock &&
        !database.storeSettings?.inventoryPreferences?.allowOverselling
      ) {
        window.alert('Quantity exceeds available stock.')
        return current
      }

      return current.map((item) =>
        item.cartKey === cartKey
          ? {
              ...item,
              qty: normalizedQuantity,
            }
          : item,
      )
    })
  }

  async function handleCheckout() {
    if (activePayments.length === 0) {
      window.alert('Enable at least one payment method in Settings.')
      return
    }

    if (cartItems.length === 0) {
      window.alert('The cart is empty. Add a product first.')
      return
    }

    const finalPaymentMethod = activePayments.includes(paymentMethod)
      ? paymentMethod
      : activePayments[0]

    if (finalPaymentMethod === 'qris' && qrisGatewayEnabled) {
      try {
        setQrisError('')
        const transactionNumber = generateTransactionNumber(database.transactions)
        const payload = await createQrisPayment({
          cartItems,
          discount,
          total: cartTotal,
          storeSettings: database.storeSettings,
          transactionNumber,
        })

        setQrisPayload({
          ...payload,
          cartItems,
          discount,
          total: cartTotal,
          gatewayStatus: payload.gatewayStatus || 'pending',
        })
        setQrisModalOpen(true)
        notify(
          'QRIS created',
          'Show the QR code to the customer and wait for payment confirmation.',
        )
      } catch (error) {
        window.alert(error.message || 'Failed to create a Midtrans QRIS payment.')
      }
      return
    }

    const result = createTransaction({
      cartItems,
      paymentMethod: finalPaymentMethod,
      discount,
    })

    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setReceiptTransactionId(result.transactionId)
    setCartItems([])
    setDiscount(0)
  }

  async function handleRefreshQrisStatus() {
    if (!qrisPayload?.orderId) {
      return
    }

    setQrisChecking(true)
    setQrisError('')

    try {
      const statusResult = await fetchQrisStatus(qrisPayload.orderId)
      setQrisPayload((current) =>
        current
          ? {
              ...current,
              gatewayStatus: statusResult.gatewayStatus,
              rawStatus: statusResult,
            }
          : current,
      )
    } catch (error) {
      setQrisError(error.message || 'Failed to check QRIS status.')
    } finally {
      setQrisChecking(false)
    }
  }

  function handleConfirmQrisPaid() {
    if (!qrisPayload || !isQrisPaid(qrisPayload.gatewayStatus)) {
      return
    }

    const result = createTransaction({
      cartItems: qrisPayload.cartItems,
      paymentMethod: 'qris',
      discount: qrisPayload.discount,
      transactionNumber: qrisPayload.transactionNumber,
      paymentReference: qrisPayload.orderId,
      paymentProvider: 'midtrans',
      paymentGatewayStatus: qrisPayload.gatewayStatus,
    })

    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setReceiptTransactionId(result.transactionId)
    setCartItems([])
    setDiscount(0)
    setQrisModalOpen(false)
    setQrisPayload(null)
    setQrisError('')
  }

  const categoryTabs = [
    { id: 'all', label: 'All' },
    { id: 'favorites', label: 'Favorites' },
    ...database.categories.map((category) => ({
      id: category.id,
      label: category.name,
    })),
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="form-input pl-12"
                placeholder="Search products..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              <Store className="h-4 w-4" />
              Store active and ready for transactions
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`pill-button ${
                  selectedCategory === tab.id ? 'pill-button-active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {displayedProducts.length === 0 ? (
            <div className="md:col-span-2 2xl:col-span-3">
              <EmptyState
                title="No products found"
                description="Try changing the search, category, or add a new product."
              />
            </div>
          ) : (
            displayedProducts.map((product) => {
              const variants = getVariantsForProduct(database.variants, product.id)
              const currentStock = getProductCurrentStock(product, variants)
              const status = getStockStatus(
                currentStock || 0,
                product.minimumStock,
                product.trackStock,
              )
              const unitName = getUnitName(database.units, product.unitId)
              const needsQuantityPrompt =
                product.type === 'weighted' || product.type === 'service'
              const isUnavailable =
                product.trackStock &&
                (currentStock || 0) <= 0 &&
                !database.storeSettings?.inventoryPreferences?.allowOverselling

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex h-44 items-center justify-center bg-[linear-gradient(135deg,#eff6ff,#f8fafc)]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-4xl font-extrabold text-blue-700 shadow-sm">
                        {product.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="blue">
                        {getCategoryName(database.categories, product.categoryId)}
                      </Badge>
                      {product.type === 'variant' ? <Badge tone="slate">Variant</Badge> : null}
                      {!product.trackStock ? <Badge tone="green">No inventory</Badge> : null}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {humanizeProductType(product.type)} - {unitName}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-extrabold text-blue-700">
                        {formatRupiah(product.sellPrice)}
                      </p>
                      <Badge tone={status.tone}>
                        {product.trackStock ? `Stock ${formatQuantity(currentStock)}` : status.label}
                      </Badge>
                    </div>
                    {needsQuantityPrompt ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <ClipboardList className="h-4 w-4" />
                        Set the quantity before adding to the cart
                      </div>
                    ) : null}
                    {isUnavailable ? (
                      <p className="text-sm font-semibold text-rose-600">
                        Out-of-stock products cannot be sold.
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      <Card className="sticky top-28 flex h-fit flex-col p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-blue-700" />
            <div>
              <p className="text-2xl font-bold text-slate-900">Cart</p>
              <p className="text-sm text-slate-500">{cartItems.length} active items</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {cartItems.length === 0 ? (
            <EmptyState
              title="Your cart is empty"
              description="Select a product from the catalog to start a transaction."
            />
          ) : (
            cartItems.map((item) => (
              <div key={item.cartKey} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-slate-900">{item.productName}</p>
                    {item.variantName ? (
                      <p className="mt-1 text-sm text-slate-500">{item.variantName}</p>
                    ) : null}
                    <p className="mt-1 text-sm text-slate-500">
                      {formatQuantity(item.qty)} {item.unitName} x {formatRupiah(item.sellPrice)}
                    </p>
                    <p className="mt-4 text-2xl font-extrabold text-blue-700">
                      {formatRupiah(item.sellPrice * item.qty)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCartItems((current) =>
                        current.filter((cartItem) => cartItem.cartKey !== item.cartKey),
                      )
                    }
                    className="rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white p-3 text-slate-700"
                    onClick={() => changeCartQuantity(item.cartKey, item.qty - item.step)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-12 text-center text-lg font-bold text-slate-900">
                    {formatQuantity(item.qty)}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 bg-white p-3 text-slate-700"
                    onClick={() => changeCartQuantity(item.cartKey, item.qty + item.step)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {(item.allowDecimal || item.variantName) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setQuantityModal({
                          productId: item.productId,
                          variantId: item.variantId,
                          cartKey: item.cartKey,
                          initialQuantity: item.qty,
                        })
                      }
                    >
                      Edit qty
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-5 border-t border-slate-200 px-5 py-5">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatRupiah(cartSubtotal)}</span>
            </div>
            <div className="grid gap-3">
              <label className="form-label mb-0">Discount</label>
              <input
                type="number"
                className="form-input"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-base font-semibold text-slate-700">Total Due</span>
              <span className="text-3xl font-extrabold text-blue-700">
                {formatRupiah(cartTotal)}
              </span>
            </div>
          </div>

          <div>
            <p className="form-label">Payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {activePayments.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    paymentMethod === method
                      ? method === 'cash'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
                  }`}
                >
                  {humanizePaymentMethod(method)}
                </button>
              ))}
            </div>
            {activePayments.length === 0 ? (
              <p className="mt-3 text-sm font-semibold text-rose-600">
                No payment methods are enabled. Configure them in Settings.
              </p>
            ) : null}
          </div>

          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={activePayments.length === 0}
          >
            Complete Payment
          </Button>
          <p className="text-xs text-slate-500">
            {paymentMethod === 'qris' && qrisGatewayEnabled
              ? 'QRIS transactions are saved after the payment gateway confirms payment.'
              : 'Inventory is reduced automatically after the transaction is saved.'}
          </p>
          {paymentMethod === 'qris' && !qrisGatewayEnabled ? (
            <p className="text-xs font-semibold text-amber-600">
              The QRIS gateway is not active. QRIS is currently treated as a manual payment method.
            </p>
          ) : null}
        </div>
      </Card>

      <VariantPickerModal
        open={Boolean(selectedProduct)}
        product={selectedProduct}
        variants={
          selectedProduct ? getVariantsForProduct(database.variants, selectedProduct.id) : []
        }
        allowOverselling={Boolean(
          database.storeSettings?.inventoryPreferences?.allowOverselling,
        )}
        onClose={() => setSelectedProduct(null)}
        onChoose={(variant) => {
          addToCart(selectedProduct, variant)
          setSelectedProduct(null)
        }}
      />

      <QuantityPickerModal
        open={Boolean(activeQuantityProduct)}
        product={activeQuantityProduct}
        variant={activeQuantityVariant}
        unitName={
          activeQuantityProduct
            ? getUnitName(database.units, activeQuantityProduct.unitId)
            : ''
        }
        initialQuantity={quantityModal.initialQuantity}
        availableStock={
          activeQuantityProduct?.trackStock
            ? activeQuantityVariant
              ? activeQuantityVariant.stock
              : getProductCurrentStock(
                  activeQuantityProduct,
                  getVariantsForProduct(database.variants, activeQuantityProduct.id),
                )
            : null
        }
        allowOverselling={Boolean(
          database.storeSettings?.inventoryPreferences?.allowOverselling,
        )}
        onClose={() =>
          setQuantityModal({
            productId: '',
            variantId: '',
            cartKey: '',
            initialQuantity: 0,
          })
        }
        onConfirm={(quantity) => {
          if (quantityModal.cartKey) {
            changeCartQuantity(quantityModal.cartKey, quantity)
          } else {
            addToCart(activeQuantityProduct, activeQuantityVariant, quantity)
          }

          setQuantityModal({
            productId: '',
            variantId: '',
            cartKey: '',
            initialQuantity: 0,
          })
        }}
      />

      <TransactionDetailModal
        open={Boolean(selectedTransaction)}
        onClose={() => setReceiptTransactionId('')}
        transaction={selectedTransaction}
        items={receiptItems}
        storeSettings={database.storeSettings}
      />

      <QrisPaymentModal
        open={qrisModalOpen}
        payload={qrisPayload}
        checking={qrisChecking}
        error={qrisError}
        onClose={() => {
          setQrisModalOpen(false)
          setQrisPayload(null)
          setQrisError('')
        }}
        onRefreshStatus={handleRefreshQrisStatus}
        onConfirmPaid={handleConfirmQrisPaid}
      />
    </div>
  )
}

export default CashierPage
