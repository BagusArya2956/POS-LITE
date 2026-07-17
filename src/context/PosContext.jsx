import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  createCategoryRecords,
  createUnitRecords,
} from '../data/templates.js'
import { loadCloudDatabase, saveCloudDatabase } from '../lib/cloudPersistence.js'
import { getPersistenceMeta, isSupabaseProviderEnabled } from '../lib/dataProvider.js'
import { getDateKey } from '../lib/format.js'
import {
  createId,
  downloadFile,
  exportRowsToCsv,
  generateTransactionNumber,
  toNumber,
} from '../lib/helpers.js'
import { normalizeQuantity, roundQuantity } from '../lib/quantity.js'
import {
  clearDatabase,
  CURRENT_DB_VERSION,
  clearSession,
  emptyDatabase,
  loadDatabase,
  loadSession,
  normalizeDatabase,
  saveDatabase,
  saveSession,
} from '../lib/storage.js'

const PosContext = createContext(null)

function createNotification(title, description, tone = 'success') {
  return {
    id: createId('toast'),
    title,
    description,
    tone,
  }
}

function generateProductSku(products) {
  let sequence = products.length + 1
  let candidate = `VGO-${String(sequence).padStart(5, '0')}`

  while (products.some((product) => product.sku === candidate)) {
    sequence += 1
    candidate = `VGO-${String(sequence).padStart(5, '0')}`
  }

  return candidate
}

export function PosProvider({ children }) {
  const [database, setDatabase] = useState(() => loadDatabase())
  const [session, setSession] = useState(() => loadSession())
  const [notifications, setNotifications] = useState([])
  const [syncStatus, setSyncStatus] = useState(() => ({
    ...getPersistenceMeta(),
    status: isSupabaseProviderEnabled() ? 'idle' : 'local-only',
    lastSyncedAt: '',
    error: '',
  }))
  const cloudHydrationStartedRef = useRef(false)
  const cloudReadyRef = useRef(false)
  const skipNextCloudSaveRef = useRef(false)

  useEffect(() => {
    saveDatabase(database)
  }, [database])

  useEffect(() => {
    const normalized = normalizeDatabase(database)
    const needsNormalization =
      normalized.version !== database.version ||
      normalized.products.length !== database.products.length ||
      normalized.variants.length !== database.variants.length ||
      normalized.stockMovements.length !== database.stockMovements.length

    if (needsNormalization) {
      setDatabase(normalized)
    }
  }, [
    database,
    database.products.length,
    database.stockMovements.length,
    database.variants.length,
    database.version,
  ])

  useEffect(() => {
    saveSession(session)
  }, [session])

  useEffect(() => {
    if (!isSupabaseProviderEnabled() || cloudHydrationStartedRef.current) {
      return
    }

    let isMounted = true
    cloudHydrationStartedRef.current = true
    setSyncStatus((current) => ({
      ...current,
      ...getPersistenceMeta(),
      status: 'connecting',
      error: '',
    }))

    async function hydrateCloudState() {
      try {
        const result = await loadCloudDatabase(database)
        if (!isMounted) {
          return
        }

        cloudReadyRef.current = true
        skipNextCloudSaveRef.current = true
        setDatabase(result.database)
        setSyncStatus((current) => ({
          ...current,
          ...getPersistenceMeta(),
          status: 'connected',
          lastSyncedAt: result.syncedAt || current.lastSyncedAt,
          error: '',
        }))
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSyncStatus((current) => ({
          ...current,
          ...getPersistenceMeta(),
          status: 'error',
          error: error.message || 'Failed to connect to Supabase staging.',
        }))
      }
    }

    hydrateCloudState()

    return () => {
      isMounted = false
    }
  }, [database])

  useEffect(() => {
    if (!isSupabaseProviderEnabled() || !cloudReadyRef.current) {
      return
    }

    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false
      return
    }

    let isCancelled = false
    const timeoutId = window.setTimeout(async () => {
      setSyncStatus((current) => ({
        ...current,
        ...getPersistenceMeta(),
        status: 'syncing',
        error: '',
      }))

      try {
        const result = await saveCloudDatabase(database)
        if (isCancelled || result.skipped) {
          return
        }

        setSyncStatus((current) => ({
          ...current,
          ...getPersistenceMeta(),
          status: 'connected',
          lastSyncedAt: result.syncedAt || current.lastSyncedAt,
          error: '',
        }))
      } catch (error) {
        if (isCancelled) {
          return
        }

        setSyncStatus((current) => ({
          ...current,
          ...getPersistenceMeta(),
          status: 'error',
          error: error.message || 'Supabase synchronization failed.',
        }))
      }
    }, 500)

    return () => {
      isCancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [database])

  function notify(title, description, tone = 'success') {
    const notification = createNotification(title, description, tone)
    setNotifications((current) => [...current, notification])

    window.setTimeout(() => {
      setNotifications((current) =>
        current.filter((item) => item.id !== notification.id),
      )
    }, 3500)
  }

  function removeNotification(notificationId) {
    setNotifications((current) => current.filter((item) => item.id !== notificationId))
  }

  function initializeStore(payload) {
    const now = new Date().toISOString()
    const categories = createCategoryRecords(payload.businessType)
    const units = createUnitRecords()

    const storeSettings = {
      storeName: payload.storeName,
      address: payload.address,
      whatsapp: payload.whatsapp,
      logo: payload.logo || '',
      businessType: payload.businessType,
      businessVariant: payload.businessVariant || '',
      salesMode: payload.salesMode || 'counter',
      stockTypesManaged: payload.stockTypesManaged,
      receiptName: payload.storeName,
      receiptAddress: payload.address,
      receiptWhatsApp: payload.whatsapp,
      receiptFooter:
        'Thank you for shopping with us.\nPurchased items cannot be exchanged or returned.',
      paymentMethods: {
        cash: true,
        qris: true,
        transfer: false,
      },
      inventoryPreferences: {
        defaultUnitId: units[0]?.id || '',
        defaultMinimumStock: 5,
        autoGenerateSku: true,
        allowOverselling: false,
      },
      cashierName: 'Admin',
      createdAt: now,
      updatedAt: now,
    }

    setDatabase({
      ...emptyDatabase,
      version: CURRENT_DB_VERSION,
      storeSettings,
      pin: '1234',
      categories,
      units,
      products: [],
      variants: [],
      stockMovements: [],
      transactions: [],
      transactionItems: [],
    })

    setSession({
      isAuthenticated: true,
      authenticatedAt: now,
      setupCompletedAt: now,
      setupStoreName: payload.storeName,
    })

    notify('Setup complete', 'Initial settings saved. Use PIN 1234 for your first login.')
  }

  function authenticatePin(candidatePin) {
    if (candidatePin === database.pin) {
      setSession({
        isAuthenticated: true,
        authenticatedAt: new Date().toISOString(),
        setupCompletedAt: '',
        setupStoreName: '',
      })
      notify('Access granted', 'Welcome back to VIGO POS.')
      return true
    }

    return false
  }

  function logout() {
    clearSession()
    setSession({
      isAuthenticated: false,
      authenticatedAt: '',
      setupCompletedAt: '',
      setupStoreName: '',
    })
  }

  function updateStoreSettings(patch) {
    setDatabase((current) => ({
      ...current,
      storeSettings: {
        ...current.storeSettings,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    }))

    notify('Store settings saved', 'Store profile and receipt settings updated.')
  }

  function updatePaymentMethods(patch) {
    const nextPaymentMethods = {
      ...database.storeSettings.paymentMethods,
      ...patch,
    }

    if (!Object.values(nextPaymentMethods).some(Boolean)) {
      notify(
        'At least one method is required',
        'Keep at least one payment method enabled for the POS.',
        'warning',
      )
      return { ok: false }
    }

    setDatabase((current) => ({
      ...current,
      storeSettings: {
        ...current.storeSettings,
        paymentMethods: nextPaymentMethods,
        updatedAt: new Date().toISOString(),
      },
    }))
    notify('Payment methods updated', 'Payment method changes are now active.')
    return { ok: true }
  }

  function updateInventoryPreferences(patch) {
    const currentPreferences = database.storeSettings?.inventoryPreferences || {}
    const nextPreferences = {
      defaultUnitId: '',
      defaultMinimumStock: 5,
      autoGenerateSku: true,
      allowOverselling: false,
      ...currentPreferences,
      ...patch,
    }

    nextPreferences.defaultMinimumStock = Math.max(
      0,
      toNumber(nextPreferences.defaultMinimumStock),
    )

    if (
      nextPreferences.defaultUnitId &&
      !database.units.some((unit) => unit.id === nextPreferences.defaultUnitId)
    ) {
      nextPreferences.defaultUnitId = ''
    }

    setDatabase((current) => ({
      ...current,
      storeSettings: {
        ...current.storeSettings,
        inventoryPreferences: nextPreferences,
        updatedAt: new Date().toISOString(),
      },
    }))

    notify('Inventory preferences saved', 'New products will use these defaults.')
    return { ok: true }
  }

  function addCategory(name) {
    const normalizedName = name.trim()
    if (!normalizedName) {
      return {
        ok: false,
        message: 'Category name cannot be empty.',
      }
    }

    if (
      database.categories.some(
        (category) => category.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return {
        ok: false,
        message: 'A category with this name already exists.',
      }
    }

    const now = new Date().toISOString()
    setDatabase((current) => ({
      ...current,
      categories: [
        ...current.categories,
        {
          id: createId('cat'),
          name: normalizedName,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }))

    notify('Category added', `Category ${normalizedName} is ready to use.`)
    return { ok: true }
  }

  function updateCategory(categoryId, name) {
    const normalizedName = name.trim()
    if (!normalizedName) {
      return {
        ok: false,
        message: 'Category name cannot be empty.',
      }
    }

    if (
      database.categories.some(
        (category) =>
          category.id !== categoryId &&
          category.name.toLowerCase() === normalizedName.toLowerCase(),
      )
    ) {
      return {
        ok: false,
        message: 'A category with this name already exists.',
      }
    }

    setDatabase((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              name: normalizedName,
              updatedAt: new Date().toISOString(),
            }
          : category,
      ),
    }))

    notify('Category updated', `Category is now named ${normalizedName}.`)
    return { ok: true }
  }

  function deleteCategory(categoryId) {
    if (database.products.some((product) => product.categoryId === categoryId)) {
      return {
        ok: false,
        message: 'This category is still used by products. Move them before deleting it.',
      }
    }

    setDatabase((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
    }))

    notify('Category deleted', 'Category list updated.')
    return { ok: true }
  }

  function addUnit(name) {
    const normalizedName = name.trim()
    if (!normalizedName) {
      return {
        ok: false,
        message: 'Unit name cannot be empty.',
      }
    }

    if (
      database.units.some((unit) => unit.name.toLowerCase() === normalizedName.toLowerCase())
    ) {
      return {
        ok: false,
        message: 'This unit already exists.',
      }
    }

    const now = new Date().toISOString()
    setDatabase((current) => ({
      ...current,
      units: [
        ...current.units,
        {
          id: createId('unit'),
          name: normalizedName,
          createdAt: now,
          updatedAt: now,
        },
      ],
    }))

    notify('Unit added', `Unit ${normalizedName} created successfully.`)
    return { ok: true }
  }

  function deleteUnit(unitId) {
    if (database.products.some((product) => product.unitId === unitId)) {
      return {
        ok: false,
        message: 'This unit is still used by products. Edit them before deleting it.',
      }
    }

    setDatabase((current) => ({
      ...current,
      units: current.units.filter((unit) => unit.id !== unitId),
      storeSettings: {
        ...current.storeSettings,
        inventoryPreferences: {
          ...current.storeSettings?.inventoryPreferences,
          defaultUnitId:
            current.storeSettings?.inventoryPreferences?.defaultUnitId === unitId
              ? ''
              : current.storeSettings?.inventoryPreferences?.defaultUnitId || '',
        },
      },
    }))

    notify('Unit deleted', 'Unit list updated.')
    return { ok: true }
  }

  function updatePin(newPin) {
    setDatabase((current) => ({
      ...current,
      pin: newPin,
    }))

    notify('PIN changed', 'Your new PIN will be used at the next sign-in.')
  }

  function upsertProduct(productInput) {
    const now = new Date().toISOString()

    if (productInput.mode === 'create') {
      const productId = createId('prd')
      const trackStock =
        productInput.type === 'service'
          ? false
          : productInput.type === 'variant'
            ? true
            : productInput.trackStock
      const unitName =
        database.units.find((unit) => unit.id === productInput.unitId)?.name || '-'
      const baseProduct = {
        id: productId,
        name: productInput.name.trim(),
        categoryId: productInput.categoryId,
        type: productInput.type,
        unitId: productInput.unitId,
        basePrice: toNumber(productInput.costPrice),
        sellPrice: toNumber(productInput.sellPrice),
        costPrice: toNumber(productInput.costPrice),
        trackStock,
        stock:
          productInput.type === 'variant' || !trackStock
            ? 0
            : normalizeQuantity(productInput.stock, productInput.type, unitName),
        minimumStock:
          productInput.type === 'variant' || !trackStock
            ? 0
            : normalizeQuantity(productInput.minimumStock, productInput.type, unitName),
        image: productInput.image || '',
        status: productInput.status || 'Aktif',
        isFavorite: Boolean(productInput.isFavorite),
        sku:
          productInput.sku?.trim() ||
          (database.storeSettings?.inventoryPreferences?.autoGenerateSku
            ? generateProductSku(database.products)
            : ''),
        barcode: productInput.barcode?.trim() || '',
        createdAt: now,
        updatedAt: now,
      }

      const nextProducts = [...database.products, baseProduct]
      const nextVariants = [...database.variants]
      const nextStockMovements = [...database.stockMovements]

      if (productInput.type === 'variant') {
        productInput.variants.forEach((variantInput) => {
          const variantId = createId('var')
          const stock = normalizeQuantity(variantInput.stock, productInput.type, unitName)
          const minimumStock = normalizeQuantity(
            variantInput.minimumStock,
            productInput.type,
            unitName,
          )
          nextVariants.push({
            id: variantId,
            productId,
            name: variantInput.name.trim(),
            attributes: variantInput.attributes.trim(),
            sku: variantInput.sku.trim(),
            sellPrice: toNumber(variantInput.sellPrice),
            costPrice: toNumber(variantInput.costPrice),
            stock,
            minimumStock,
            createdAt: now,
            updatedAt: now,
          })

          if (stock > 0) {
            nextStockMovements.push({
              id: createId('stm'),
              productId,
              variantId,
              productName: productInput.name.trim(),
              variantName: variantInput.name.trim(),
              unitName,
              type: 'initial',
              quantity: stock,
              beforeStock: 0,
              afterStock: stock,
              note: 'Initial stock from a new product.',
              reason: 'Add product',
              transactionId: '',
              createdAt: now,
            })
          }
        })
      } else if (
        trackStock &&
        normalizeQuantity(productInput.stock, productInput.type, unitName) > 0
      ) {
        const stock = normalizeQuantity(productInput.stock, productInput.type, unitName)
        nextStockMovements.push({
          id: createId('stm'),
          productId,
          variantId: '',
          productName: productInput.name.trim(),
          variantName: '',
          unitName,
          type: 'initial',
          quantity: stock,
          beforeStock: 0,
          afterStock: stock,
          note: 'Initial stock from a new product.',
          reason: 'Add product',
          transactionId: '',
          createdAt: now,
        })
      }

      setDatabase((current) => ({
        ...current,
        products: nextProducts,
        variants: nextVariants,
        stockMovements: nextStockMovements,
      }))

      notify('Product saved', `${productInput.name} was added successfully.`)
      return { ok: true }
    }

    const currentProduct = database.products.find((product) => product.id === productInput.id)
    if (!currentProduct) {
      return {
        ok: false,
        message: 'Product not found.',
      }
    }

    const unitName =
      database.units.find((unit) => unit.id === productInput.unitId)?.name || '-'

    const updatedProducts = database.products.map((product) =>
      product.id === productInput.id
        ? {
            ...product,
            name: productInput.name.trim(),
            categoryId: productInput.categoryId,
            unitId: productInput.unitId,
            sellPrice: toNumber(productInput.sellPrice),
            costPrice: toNumber(productInput.costPrice),
            basePrice: toNumber(productInput.costPrice),
            trackStock:
              product.type === 'service'
                ? false
                : product.type === 'variant'
                  ? true
                  : productInput.trackStock,
            minimumStock:
              product.type === 'variant' || product.type === 'service'
                ? product.minimumStock
                : normalizeQuantity(productInput.minimumStock, product.type, unitName),
            image: productInput.image || '',
            status: productInput.status || 'Aktif',
            isFavorite: Boolean(productInput.isFavorite),
            sku: productInput.sku?.trim() || '',
            barcode: productInput.barcode?.trim() || '',
            updatedAt: now,
          }
        : product,
    )

    let updatedVariants = [...database.variants]
    const newMovements = []

    if (currentProduct.type === 'variant') {
      const existingVariants = database.variants.filter(
        (variant) => variant.productId === currentProduct.id,
      )
      const incomingIds = new Set(productInput.variants.map((variant) => variant.id).filter(Boolean))
      const removedVariants = existingVariants.filter((variant) => !incomingIds.has(variant.id))
      const lockedVariant = removedVariants.find((variant) =>
        database.transactionItems.some((item) => item.variantId === variant.id),
      )

      if (lockedVariant) {
        return {
          ok: false,
          message: `Variant ${lockedVariant.name} has transaction history and cannot be deleted.`,
        }
      }

      updatedVariants = updatedVariants.filter(
        (variant) =>
          variant.productId !== currentProduct.id || incomingIds.has(variant.id),
      )

      productInput.variants.forEach((variantInput) => {
        if (variantInput.id) {
          updatedVariants = updatedVariants.map((variant) =>
            variant.id === variantInput.id
              ? {
                  ...variant,
                  name: variantInput.name.trim(),
                  attributes: variantInput.attributes.trim(),
                  sku: variantInput.sku.trim(),
                  sellPrice: toNumber(variantInput.sellPrice),
                  costPrice: toNumber(variantInput.costPrice),
                  minimumStock: normalizeQuantity(
                    variantInput.minimumStock,
                    currentProduct.type,
                    unitName,
                  ),
                  updatedAt: now,
                }
              : variant,
          )
          return
        }

        const createdVariantId = createId('var')
        const stock = normalizeQuantity(variantInput.stock, currentProduct.type, unitName)

        updatedVariants.push({
          id: createdVariantId,
          productId: currentProduct.id,
          name: variantInput.name.trim(),
          attributes: variantInput.attributes.trim(),
          sku: variantInput.sku.trim(),
          sellPrice: toNumber(variantInput.sellPrice),
          costPrice: toNumber(variantInput.costPrice),
          stock,
          minimumStock: normalizeQuantity(
            variantInput.minimumStock,
            currentProduct.type,
            unitName,
          ),
          createdAt: now,
          updatedAt: now,
        })

        if (stock > 0) {
          newMovements.push({
            id: createId('stm'),
            productId: currentProduct.id,
            variantId: createdVariantId,
            productName: productInput.name.trim(),
            variantName: variantInput.name.trim(),
            unitName,
            type: 'adjustment_in',
            quantity: stock,
            beforeStock: 0,
            afterStock: stock,
            note: 'New variant added from the Products page.',
            reason: 'New variant',
            transactionId: '',
            createdAt: now,
          })
        }
      })

      removedVariants.forEach((variant) => {
          newMovements.push({
            id: createId('stm'),
            productId: currentProduct.id,
            variantId: variant.id,
            productName: currentProduct.name,
            variantName: variant.name,
            unitName,
            type: 'adjustment_out',
            quantity: variant.stock,
            beforeStock: variant.stock,
            afterStock: 0,
            note: 'Variant removed from the Products page.',
            reason: 'Delete variant',
            transactionId: '',
            createdAt: now,
          })
        })
    }

    setDatabase((current) => ({
      ...current,
      products: updatedProducts,
      variants: updatedVariants,
      stockMovements: [...current.stockMovements, ...newMovements],
    }))

    notify('Product updated', `${productInput.name} was saved successfully.`)
    return { ok: true }
  }

  function deleteProduct(productId) {
    const product = database.products.find((item) => item.id === productId)
    if (!product) {
      return {
        ok: false,
        message: 'Product not found.',
      }
    }

    if (database.transactionItems.some((item) => item.productId === productId)) {
      return {
        ok: false,
        message:
          'This product has transaction history. Deactivate it to preserve historical data.',
      }
    }

    setDatabase((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== productId),
      variants: current.variants.filter((variant) => variant.productId !== productId),
    }))

    notify('Product deleted', `${product.name} was removed from the catalog.`)
    return { ok: true }
  }

  function adjustStock({ productId, variantId, quantity, mode, note, reason }) {
    const now = new Date().toISOString()
    const product = database.products.find((item) => item.id === productId)
    if (!product || !product.trackStock) {
      return {
        ok: false,
        message: 'This product does not track inventory.',
      }
    }

    const productVariants = database.variants.filter((item) => item.productId === productId)
    if (productVariants.length > 0 && !variantId) {
      return {
        ok: false,
        message: 'Select a variant before adjusting inventory.',
      }
    }

    const variant = variantId
      ? database.variants.find(
          (item) => item.id === variantId && item.productId === productId,
        )
      : null

    if (variantId && !variant) {
      return {
        ok: false,
        message: 'Product variant not found.',
      }
    }

    const unitName = database.units.find((unit) => unit.id === product.unitId)?.name || '-'
    const amount = normalizeQuantity(quantity, product.type, unitName)

    if (amount <= 0) {
      return {
        ok: false,
        message: 'Stock quantity must be greater than 0.',
      }
    }

    const isVariantMode = Boolean(variantId)
    const currentStock = isVariantMode ? toNumber(variant?.stock) : toNumber(product.stock)
    const nextStock =
      mode === 'in'
        ? roundQuantity(currentStock + amount)
        : roundQuantity(currentStock - amount)

    if (nextStock < 0) {
      return {
        ok: false,
        message: 'There is not enough stock for this adjustment.',
      }
    }

    setDatabase((current) => ({
      ...current,
      products: current.products.map((item) =>
        !isVariantMode && item.id === productId
          ? {
              ...item,
              stock: nextStock,
              updatedAt: now,
            }
          : item,
      ),
      variants: current.variants.map((item) =>
        isVariantMode && item.id === variantId
          ? {
              ...item,
              stock: nextStock,
              updatedAt: now,
            }
          : item,
      ),
      stockMovements: [
        ...current.stockMovements,
        {
          id: createId('stm'),
          productId,
          variantId: variantId || '',
          productName: product.name,
          variantName: variant?.name || '',
          unitName,
          type: mode === 'in' ? 'adjustment_in' : 'adjustment_out',
          quantity: amount,
          beforeStock: currentStock,
          afterStock: nextStock,
          note,
          reason,
          transactionId: '',
          createdAt: now,
        },
      ],
    }))

    notify(
      mode === 'in' ? 'Stock added' : 'Stock reduced',
      `${product.name} now has stock of ${nextStock}.`,
    )
    return { ok: true }
  }

  function createTransaction({
    cartItems,
    paymentMethod,
    discount,
    transactionNumber: preferredTransactionNumber,
    paymentReference = '',
    paymentProvider = '',
    paymentGatewayStatus = '',
  }) {
    if (!cartItems.length) {
      return {
        ok: false,
        message: 'The cart is empty.',
      }
    }

    if (!database.storeSettings?.paymentMethods?.[paymentMethod]) {
      return {
        ok: false,
        message: 'This payment method is disabled.',
      }
    }

    const now = new Date().toISOString()
    const validatedDiscount = Math.max(0, toNumber(discount))
    const subtotal = roundQuantity(
      cartItems.reduce((sum, item) => sum + item.sellPrice * item.qty, 0),
      2,
    )
    const total = roundQuantity(Math.max(0, subtotal - validatedDiscount), 2)
    const transactionId = createId('trx')
    const transactionNumber =
      preferredTransactionNumber || generateTransactionNumber(database.transactions)

    const productUpdates = new Map()
    const variantUpdates = new Map()
    const stockMovements = []
    const items = []

    for (const cartItem of cartItems) {
      const product = database.products.find((item) => item.id === cartItem.productId)
      const variant = cartItem.variantId
        ? database.variants.find((item) => item.id === cartItem.variantId)
        : null

      if (!product) {
        return {
          ok: false,
          message: `Product ${cartItem.productName} not found.`,
        }
      }

      if (product.type === 'variant' && !cartItem.variantId) {
        return {
          ok: false,
          message: `Variant for ${cartItem.productName} must be selected first.`,
        }
      }

      if (cartItem.variantId && !variant) {
        return {
          ok: false,
          message: `Variant for ${cartItem.productName} not found.`,
        }
      }

      const quantity = normalizeQuantity(
        cartItem.qty,
        cartItem.productType || product.type,
        cartItem.unitName,
      )

      if (product.trackStock) {
        const currentStock = cartItem.variantId
          ? toNumber(variantUpdates.get(cartItem.variantId) ?? variant?.stock)
          : toNumber(productUpdates.get(cartItem.productId) ?? product.stock)

        if (
          currentStock < quantity &&
          !database.storeSettings?.inventoryPreferences?.allowOverselling
        ) {
          return {
            ok: false,
            message: `Stock ${cartItem.productName} has insufficient stock.`,
          }
        }

        const nextStock = roundQuantity(currentStock - quantity)

        if (cartItem.variantId) {
          variantUpdates.set(cartItem.variantId, nextStock)
        } else {
          productUpdates.set(cartItem.productId, nextStock)
        }

        stockMovements.push({
          id: createId('stm'),
          productId: product.id,
          variantId: cartItem.variantId || '',
          productName: product.name,
          variantName: cartItem.variantName || '',
          unitName: cartItem.unitName,
          type: 'sale',
          quantity,
          beforeStock: currentStock,
          afterStock: nextStock,
          note: `Transaction ${transactionNumber}`,
          reason: 'Sales',
          transactionId,
          createdAt: now,
        })
      }

      items.push({
        id: createId('tix'),
        transactionId,
        productId: product.id,
        variantId: cartItem.variantId || '',
        productName: cartItem.productName,
        variantName: cartItem.variantName || '',
        unitName: cartItem.unitName,
        productType: cartItem.productType || product.type,
        qty: quantity,
        sellPrice: cartItem.sellPrice,
        costPrice: cartItem.costPrice,
        subtotal: roundQuantity(cartItem.sellPrice * quantity, 2),
        trackStock: product.trackStock,
      })
    }

    const nextTransactions = [
      ...database.transactions,
      {
        id: transactionId,
        transactionNumber,
        createdAt: now,
        paymentMethod,
        paymentReference,
        paymentProvider,
        paymentGatewayStatus,
        subtotal,
        discount: validatedDiscount,
        total,
        status: 'Successful',
        cashierName: database.storeSettings?.cashierName || 'Admin',
      },
    ]

    setDatabase((current) => ({
      ...current,
      products: current.products.map((product) =>
        productUpdates.has(product.id)
          ? {
              ...product,
              stock: productUpdates.get(product.id),
              updatedAt: now,
            }
          : product,
      ),
      variants: current.variants.map((variant) =>
        variantUpdates.has(variant.id)
          ? {
              ...variant,
              stock: variantUpdates.get(variant.id),
              updatedAt: now,
            }
          : variant,
      ),
      transactions: nextTransactions,
      transactionItems: [...current.transactionItems, ...items],
      stockMovements: [...current.stockMovements, ...stockMovements],
    }))

    notify('Payment successful', `Transaction ${transactionNumber} saved successfully.`)
    return {
      ok: true,
      transactionId,
    }
  }

  function cancelTransaction(transactionId) {
    const transaction = database.transactions.find((item) => item.id === transactionId)
    if (!transaction) {
      return {
        ok: false,
        message: 'Transaction not found.',
      }
    }

    if (['Cancelled', 'Dibatalkan'].includes(transaction.status)) {
      return {
        ok: false,
        message: 'This transaction has already been cancelled.',
      }
    }

    const now = new Date().toISOString()
    const items = database.transactionItems.filter((item) => item.transactionId === transactionId)
    const productUpdates = new Map()
    const variantUpdates = new Map()
    const stockMovements = []

    items.forEach((item) => {
      if (!item.trackStock) {
        return
      }

      const product = database.products.find((entry) => entry.id === item.productId)
      const variant = item.variantId
        ? database.variants.find((entry) => entry.id === item.variantId)
        : null

      if (!product) {
        return
      }

      const currentStock = item.variantId
        ? toNumber(variantUpdates.get(item.variantId) ?? variant?.stock)
        : toNumber(productUpdates.get(item.productId) ?? product.stock)
      const nextStock = roundQuantity(currentStock + item.qty)

      if (item.variantId) {
        variantUpdates.set(item.variantId, nextStock)
      } else {
        productUpdates.set(item.productId, nextStock)
      }

      stockMovements.push({
        id: createId('stm'),
        productId: item.productId,
        variantId: item.variantId || '',
        productName: item.productName,
        variantName: item.variantName || '',
        unitName: item.unitName,
        type: 'cancel_sale',
        quantity: item.qty,
        beforeStock: currentStock,
        afterStock: nextStock,
        note: `Cancellation ${transaction.transactionNumber}`,
        reason: 'Transaction cancellation',
        transactionId,
        createdAt: now,
      })
    })

    setDatabase((current) => ({
      ...current,
      products: current.products.map((product) =>
        productUpdates.has(product.id)
          ? {
              ...product,
              stock: productUpdates.get(product.id),
              updatedAt: now,
            }
          : product,
      ),
      variants: current.variants.map((variant) =>
        variantUpdates.has(variant.id)
          ? {
              ...variant,
              stock: variantUpdates.get(variant.id),
              updatedAt: now,
            }
          : variant,
      ),
      transactions: current.transactions.map((item) =>
        item.id === transactionId
          ? {
              ...item,
              status: 'Cancelled',
              cancelledAt: now,
            }
          : item,
      ),
      stockMovements: [...current.stockMovements, ...stockMovements],
    }))

    notify('Transaction cancelled', `Stock dari ${transaction.transactionNumber} has been restored.`)
    return { ok: true }
  }

  function downloadBackup() {
    downloadFile(
      `vigo-pos-backup-${getDateKey(new Date())}.json`,
      JSON.stringify(database, null, 2),
    )
    notify('Backup complete', 'The JSON backup file was downloaded.')
  }

  function exportAllData() {
    const rows = database.transactions.map((transaction) => ({
      no_transaksi: transaction.transactionNumber,
      tanggal: transaction.createdAt,
      metode: transaction.paymentMethod,
      status: transaction.status,
      subtotal: transaction.subtotal,
      diskon: transaction.discount,
      total: transaction.total,
    }))

    exportRowsToCsv(`vigo-pos-export-${getDateKey(new Date())}.csv`, rows)
    notify('Export complete', 'Transaction data exported to CSV.')
  }

  function restoreBackup(parsedDatabase) {
    if (!parsedDatabase || typeof parsedDatabase !== 'object' || Array.isArray(parsedDatabase)) {
      notify('Backup restore failed', 'Invalid JSON file format.', 'warning')
      return { ok: false }
    }

    const nextDatabase = normalizeDatabase(parsedDatabase)

    setDatabase(nextDatabase)
    setSession({
      isAuthenticated: true,
      authenticatedAt: new Date().toISOString(),
      setupCompletedAt: '',
      setupStoreName: '',
    })
    notify('Backup restored', 'VIGO POS data loaded from the file.')
    return { ok: true }
  }

  function resetLocalSetup() {
    const persistenceMeta = getPersistenceMeta()

    if (persistenceMeta.remoteEnabled) {
      notify(
        'Local reset unavailable',
        'Cloud mode is active. Disable staging synchronization before resetting local setup.',
        'warning',
      )
      return { ok: false, message: 'Cloud mode is active.' }
    }

    clearDatabase()
    clearSession()
    setDatabase({
      ...emptyDatabase,
      version: CURRENT_DB_VERSION,
    })
    setSession({
      isAuthenticated: false,
      authenticatedAt: '',
      setupCompletedAt: '',
      setupStoreName: '',
    })

    return { ok: true }
  }

  const value = {
    database,
    notifications,
    syncStatus,
    session,
    removeNotification,
    notify,
    hasStore: Boolean(database.storeSettings?.storeName),
    isAuthenticated: Boolean(session.isAuthenticated),
    initializeStore,
    authenticatePin,
    logout,
    updateStoreSettings,
    updatePaymentMethods,
    updateInventoryPreferences,
    addCategory,
    updateCategory,
    deleteCategory,
    addUnit,
    deleteUnit,
    updatePin,
    upsertProduct,
    deleteProduct,
    adjustStock,
    createTransaction,
    cancelTransaction,
    downloadBackup,
    exportAllData,
    restoreBackup,
    resetLocalSetup,
  }

  return <PosContext.Provider value={value}>{children}</PosContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePos() {
  const context = useContext(PosContext)

  if (!context) {
    throw new Error('usePos must be used inside PosProvider')
  }

  return context
}
