import { createId } from '../lib/helpers.js'

export const BUSINESS_TYPES = [
  'Toko Umum',
  'Food dan Beverages',
  'Pakaian dan Accessories',
  'Groceries',
  'Cosmetics',
  'Stationery',
  'Sparepart',
  'Services',
  'Custom',
]

export const STOCK_TYPE_OPTIONS = [
  {
    id: 'basic',
    label: 'Standard Product',
    description: 'Physical products with unit-based stock.',
  },
  {
    id: 'variant',
    label: 'Product with variants',
    description: 'Products with sizes, colors, flavors, or models.',
  },
  {
    id: 'weighted',
    label: 'Weight or Volume Product',
    description: 'Products sold by gram, kg, liter, or meter.',
  },
  {
    id: 'package',
    label: 'Bundle',
    description: 'Product bundles or value packages.',
  },
  {
    id: 'service',
    label: 'Service without inventory',
    description: 'Services without physical inventory.',
  },
]

export const DEFAULT_UNITS = [
  'pcs',
  'kg',
  'gram',
  'liter',
  'ml',
  'meter',
  'box',
  'dozen',
  'set',
  'bundle',
]

const CATEGORY_TEMPLATES = {
  'Toko Umum': ['Everyday Products', 'Household Essentials', 'Accessories', 'Other'],
  'Food dan Beverages': ['Food', 'Beverages', 'Snack', 'Bundle'],
  'Pakaian dan Accessories': ['T-Shirts', 'Pants', 'Jackets', 'Accessories'],
  Groceries: ['Rice', 'Cooking Oil', 'Sugar', 'Daily Essentials'],
  Cosmetics: ['Skincare', 'Makeup', 'Haircare', 'Accessories'],
  'Stationery': ['Books', 'Stationery', 'Printer', 'Other'],
  Sparepart: ['Engine', 'Electrical', 'Oil', 'Accessories'],
  Jasa: ['Services', 'Bundle', 'Visits', 'Other'],
  Custom: ['General'],
}

export function createCategoryRecords(businessType) {
  const now = new Date().toISOString()
  const names = CATEGORY_TEMPLATES[businessType] ?? ['General']

  return names.map((name) => ({
    id: createId('cat'),
    name,
    createdAt: now,
    updatedAt: now,
  }))
}

export function createUnitRecords() {
  const now = new Date().toISOString()

  return DEFAULT_UNITS.map((name) => ({
    id: createId('unit'),
    name,
    createdAt: now,
    updatedAt: now,
  }))
}

function findCategoryId(categories, preferredNames) {
  const names = Array.isArray(preferredNames) ? preferredNames : [preferredNames]
  const match = categories.find((category) => names.includes(category.name))
  return match?.id ?? categories[0]?.id ?? ''
}

function findUnitId(units, name) {
  return units.find((unit) => unit.name === name)?.id ?? units[0]?.id ?? ''
}

export function buildDummyCatalog({ categories, units, stockTypesManaged }) {
  const now = new Date().toISOString()
  const enabledTypes = new Set(
    stockTypesManaged && stockTypesManaged.length > 0 ? stockTypesManaged : ['basic'],
  )

  const products = []
  const variants = []
  const stockMovements = []

  function createMovement({
    productId,
    productName,
    unitName,
    quantity,
    afterStock,
    variantId = '',
    variantName = '',
  }) {
    stockMovements.push({
      id: createId('stm'),
      productId,
      variantId,
      productName,
      variantName,
      unitName,
      type: 'initial',
      quantity,
      beforeStock: 0,
      afterStock,
      note: 'Initial stock from store setup.',
      reason: 'Initial setup',
      transactionId: '',
      createdAt: now,
    })
  }

  function pushBasicProduct({
    name,
    categoryNames,
    type,
    unitName,
    sellPrice,
    costPrice,
    stock,
    minimumStock,
    trackStock = true,
    status = 'Aktif',
    isFavorite = false,
    sku = '',
    barcode = '',
  }) {
    const productId = createId('prd')
    const unitId = findUnitId(units, unitName)
    const categoryId = findCategoryId(categories, categoryNames)

    products.push({
      id: productId,
      name,
      categoryId,
      type,
      unitId,
      basePrice: costPrice,
      sellPrice,
      costPrice,
      trackStock,
      stock,
      minimumStock,
      image: '',
      status,
      isFavorite,
      sku,
      barcode,
      createdAt: now,
      updatedAt: now,
    })

    if (trackStock && stock > 0) {
      createMovement({
        productId,
        productName: name,
        unitName,
        quantity: stock,
        afterStock: stock,
      })
    }
  }

  if (enabledTypes.has('basic')) {
    pushBasicProduct({
      name: 'Air Mineral',
      categoryNames: ['Everyday Products', 'Beverages', 'General'],
      type: 'basic',
      unitName: 'pcs',
      sellPrice: 6000,
      costPrice: 3000,
      stock: 80,
      minimumStock: 10,
      isFavorite: true,
      sku: 'AIR-6000',
    })

    pushBasicProduct({
      name: 'Sabun Cuci',
      categoryNames: ['Household Essentials', 'Everyday Products', 'General'],
      type: 'basic',
      unitName: 'pcs',
      sellPrice: 15000,
      costPrice: 10000,
      stock: 30,
      minimumStock: 5,
      sku: 'SBN-15000',
    })
  }

  if (enabledTypes.has('weighted')) {
    pushBasicProduct({
      name: 'Rice Premium',
      categoryNames: ['Rice', 'Everyday Products', 'Daily Essentials', 'General'],
      type: 'weighted',
      unitName: 'kg',
      sellPrice: 15000,
      costPrice: 12000,
      stock: 100,
      minimumStock: 20,
      sku: 'BRS-15K',
    })
  }

  if (enabledTypes.has('package')) {
    pushBasicProduct({
      name: 'Bundle Hemat',
      categoryNames: ['Bundle', 'Everyday Products', 'General'],
      type: 'package',
      unitName: 'bundle',
      sellPrice: 35000,
      costPrice: 25000,
      stock: 18,
      minimumStock: 4,
      isFavorite: true,
      sku: 'PKT-35K',
    })
  }

  if (enabledTypes.has('variant')) {
    const productId = createId('prd')
    const categoryId = findCategoryId(categories, ['Accessories', 'T-Shirts', 'General'])
    const unitId = findUnitId(units, 'pcs')

    products.push({
      id: productId,
      name: 'T-Shirts Basic',
      categoryId,
      type: 'variant',
      unitId,
      basePrice: 45000,
      sellPrice: 75000,
      costPrice: 45000,
      trackStock: true,
      stock: 0,
      minimumStock: 0,
      image: '',
      status: 'Aktif',
      isFavorite: true,
      sku: 'KAOS-BASIC',
      barcode: '',
      createdAt: now,
      updatedAt: now,
    })

    const variantSeeds = [
      {
        name: 'Hitam M',
        attributes: 'Black, Size M',
        stock: 8,
      },
      {
        name: 'Hitam L',
        attributes: 'Black, Size L',
        stock: 6,
      },
      {
        name: 'Putih M',
        attributes: 'White, Size M',
        stock: 5,
      },
    ]

    variantSeeds.forEach((variantSeed, index) => {
      const variantId = createId('var')
      variants.push({
        id: variantId,
        productId,
        name: variantSeed.name,
        attributes: variantSeed.attributes,
        sku: `KAOS-BSC-${index + 1}`,
        sellPrice: 75000,
        costPrice: 45000,
        stock: variantSeed.stock,
        minimumStock: 3,
        createdAt: now,
        updatedAt: now,
      })

      createMovement({
        productId,
        productName: 'T-Shirts Basic',
        unitName: 'pcs',
        quantity: variantSeed.stock,
        afterStock: variantSeed.stock,
        variantId,
        variantName: variantSeed.name,
      })
    })
  }

  if (enabledTypes.has('service')) {
    pushBasicProduct({
      name: 'Laundry 1 Kg',
      categoryNames: ['Services', 'General', 'Bundle'],
      type: 'service',
      unitName: 'kg',
      sellPrice: 8000,
      costPrice: 0,
      stock: 0,
      minimumStock: 0,
      trackStock: false,
      sku: 'SRV-LAUNDRY',
    })
  }

  return {
    products,
    variants,
    stockMovements,
  }
}
