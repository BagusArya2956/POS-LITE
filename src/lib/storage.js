const DB_KEY = 'poslite::db'
const SESSION_KEY = 'poslite::session'
export const CURRENT_DB_VERSION = 3
const defaultStoreSettings = {
  storeName: '',
  address: '',
  whatsapp: '',
  logo: '',
  businessType: 'Toko Umum',
  stockTypesManaged: ['basic'],
  receiptName: '',
  receiptAddress: '',
  receiptWhatsApp: '',
  receiptFooter:
    'Terima kasih atas kunjungan Anda.\nBarang yang sudah dibeli tidak dapat ditukar atau dikembalikan.',
  paymentMethods: {
    cash: true,
    qris: true,
    transfer: false,
  },
  cashierName: 'Admin',
  createdAt: '',
  updatedAt: '',
}
const LEGACY_DEMO_PRODUCT_SIGNATURES = new Set([
  'Air Mineral::AIR-6000::basic',
  'Sabun Cuci::SBN-15000::basic',
  'Beras Premium::BRS-15K::weighted',
  'Paket Hemat::PKT-35K::package',
  'Kaos Basic::KAOS-BASIC::variant',
  'Laundry 1 Kg::SRV-LAUNDRY::service',
])
const LEGACY_DEMO_VARIANT_SIGNATURES = new Set([
  'Kaos Basic::Hitam M::KAOS-BSC-1',
  'Kaos Basic::Hitam L::KAOS-BSC-2',
  'Kaos Basic::Putih M::KAOS-BSC-3',
])

export const emptyDatabase = {
  version: CURRENT_DB_VERSION,
  storeSettings: null,
  pin: '1234',
  categories: [],
  units: [],
  products: [],
  variants: [],
  stockMovements: [],
  transactions: [],
  transactionItems: [],
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : []
}

function getProductSignature(product) {
  return `${product?.name || ''}::${product?.sku || ''}::${product?.type || ''}`
}

function getVariantSignature(variant, productName) {
  return `${productName || ''}::${variant?.name || ''}::${variant?.sku || ''}`
}

function shouldClearLegacySeedDemo(parsed, normalizedProducts, normalizedVariants) {
  const hasTransactions =
    normalizeArray(parsed.transactions).length > 0 ||
    normalizeArray(parsed.transactionItems).length > 0

  if (hasTransactions || normalizedProducts.length === 0) {
    return false
  }

  const allProductsAreLegacyDemo = normalizedProducts.every((product) =>
    LEGACY_DEMO_PRODUCT_SIGNATURES.has(getProductSignature(product)),
  )

  if (!allProductsAreLegacyDemo) {
    return false
  }

  const productNameById = new Map(normalizedProducts.map((product) => [product.id, product.name]))
  const allVariantsAreLegacyDemo = normalizedVariants.every((variant) =>
    LEGACY_DEMO_VARIANT_SIGNATURES.has(
      getVariantSignature(variant, productNameById.get(variant.productId)),
    ),
  )

  return allVariantsAreLegacyDemo
}

export function normalizeDatabase(value) {
  const parsed = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  const parsedVersion = Number(parsed.version || 1)

  if (parsedVersion < CURRENT_DB_VERSION) {
    return {
      ...emptyDatabase,
      version: CURRENT_DB_VERSION,
    }
  }

  const rawStoreSettings =
    parsed.storeSettings &&
    typeof parsed.storeSettings === 'object' &&
    !Array.isArray(parsed.storeSettings)
      ? parsed.storeSettings
      : null

  const normalizedProducts = normalizeArray(parsed.products).map((product) => ({
    ...product,
    trackStock:
      product?.type === 'service'
        ? false
        : product?.type === 'variant'
          ? true
          : Boolean(product?.trackStock),
  }))
  const normalizedVariants = normalizeArray(parsed.variants)
  const shouldClearLegacyDemo = shouldClearLegacySeedDemo(
    parsed,
    normalizedProducts,
    normalizedVariants,
  )

  return {
    ...emptyDatabase,
    ...parsed,
    version: CURRENT_DB_VERSION,
    storeSettings: rawStoreSettings
      ? {
          ...defaultStoreSettings,
          ...rawStoreSettings,
          stockTypesManaged:
            Array.isArray(rawStoreSettings.stockTypesManaged) &&
            rawStoreSettings.stockTypesManaged.length > 0
              ? rawStoreSettings.stockTypesManaged
              : defaultStoreSettings.stockTypesManaged,
          paymentMethods: {
            ...defaultStoreSettings.paymentMethods,
            ...(rawStoreSettings.paymentMethods || {}),
          },
        }
      : null,
    pin: /^\d{4}$/.test(String(parsed.pin ?? '')) ? String(parsed.pin) : emptyDatabase.pin,
    categories: normalizeArray(parsed.categories),
    units: normalizeArray(parsed.units),
    products: shouldClearLegacyDemo ? [] : normalizedProducts,
    variants: shouldClearLegacyDemo ? [] : normalizedVariants,
    stockMovements: shouldClearLegacyDemo ? [] : normalizeArray(parsed.stockMovements),
    transactions: normalizeArray(parsed.transactions),
    transactionItems: normalizeArray(parsed.transactionItems),
  }
}

export function loadDatabase() {
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (!raw) {
      return emptyDatabase
    }

    return normalizeDatabase(JSON.parse(raw))
  } catch (error) {
    console.error('Gagal memuat database POSLite', error)
    return emptyDatabase
  }
}

export function saveDatabase(database) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(database))
}

export function clearDatabase() {
  window.localStorage.removeItem(DB_KEY)
}

export function loadSession() {
  const defaultSession = {
    isAuthenticated: false,
    authenticatedAt: '',
    setupCompletedAt: '',
    setupStoreName: '',
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (!raw) {
      return defaultSession
    }

    const parsed = JSON.parse(raw)
    return {
      ...defaultSession,
      ...(parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}),
    }
  } catch (error) {
    console.error('Gagal memuat sesi POSLite', error)
    return defaultSession
  }
}

export function saveSession(session) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY)
}
