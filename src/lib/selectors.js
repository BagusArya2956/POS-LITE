import {
  formatRupiah,
  getDateKey,
  getTodayDateKey,
  humanizePaymentMethod,
} from './format.js'

export function getCategoryName(categories, categoryId) {
  return categories.find((category) => category.id === categoryId)?.name ?? '-'
}

export function getUnitName(units, unitId) {
  return units.find((unit) => unit.id === unitId)?.name ?? '-'
}

export function getVariantsForProduct(variants, productId) {
  return variants.filter((variant) => variant.productId === productId)
}

export function getStockStatus(stock, minimumStock, trackStock) {
  if (!trackStock) {
    return {
      label: 'No inventory',
      tone: 'slate',
    }
  }

  if (stock <= 0) {
    return {
      label: 'Out of stock',
      tone: 'red',
    }
  }

  if (stock <= minimumStock) {
    return {
      label: 'Low stock',
      tone: 'amber',
    }
  }

  return {
    label: 'Healthy',
    tone: 'green',
  }
}

export function getProductCurrentStock(product, variants) {
  if (!product.trackStock) {
    return null
  }

  if (product.type === 'variant') {
    return variants.reduce((total, variant) => total + Number(variant.stock || 0), 0)
  }

  return Number(product.stock || 0)
}

export function flattenStockRows(database) {
  const rows = []

  database.products.forEach((product) => {
    const unitName = getUnitName(database.units, product.unitId)
    const categoryName = getCategoryName(database.categories, product.categoryId)

    if (product.type === 'variant') {
      const productVariants = getVariantsForProduct(database.variants, product.id)

      if (productVariants.length === 0) {
        rows.push({
          id: `${product.id}-base`,
          productId: product.id,
          variantId: '',
          productName: product.name,
          variantName: '-',
          categoryName,
          unitName,
          sku: product.sku || '-',
          stock: 0,
          minimumStock: 0,
          costPrice: product.costPrice,
          trackStock: true,
          status: getStockStatus(0, 0, true),
          type: product.type,
        })
      }

      productVariants.forEach((variant) => {
        rows.push({
          id: variant.id,
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          categoryName,
          unitName,
          sku: variant.sku || '-',
          stock: Number(variant.stock || 0),
          minimumStock: Number(variant.minimumStock || 0),
          costPrice: Number(variant.costPrice || 0),
          trackStock: true,
          status: getStockStatus(
            Number(variant.stock || 0),
            Number(variant.minimumStock || 0),
            true,
          ),
          type: product.type,
        })
      })

      return
    }

    rows.push({
      id: product.id,
      productId: product.id,
      variantId: '',
      productName: product.name,
      variantName: product.trackStock ? '-' : 'Service / no inventory',
      categoryName,
      unitName,
      sku: product.sku || '-',
      stock: product.trackStock ? Number(product.stock || 0) : null,
      minimumStock: product.trackStock ? Number(product.minimumStock || 0) : null,
      costPrice: Number(product.costPrice || 0),
      trackStock: product.trackStock,
      status: getStockStatus(
        Number(product.stock || 0),
        Number(product.minimumStock || 0),
        product.trackStock,
      ),
      type: product.type,
    })
  })

  return rows
}

export function getSuccessfulTransactions(database) {
  return database.transactions.filter((transaction) =>
    ['Successful', 'Berhasil'].includes(transaction.status),
  )
}

export function getTransactionItems(database, transactionId) {
  return database.transactionItems.filter((item) => item.transactionId === transactionId)
}

export function getDashboardMetrics(database) {
  const todayKey = getTodayDateKey()
  const successfulTransactions = getSuccessfulTransactions(database)
  const todaysTransactions = successfulTransactions.filter(
    (transaction) => getDateKey(transaction.createdAt) === todayKey,
  )
  const todaysItems = database.transactionItems.filter((item) =>
    todaysTransactions.some((transaction) => transaction.id === item.transactionId),
  )
  const stockRows = flattenStockRows(database).filter((row) => row.trackStock)

  return {
    salesToday: todaysTransactions.reduce((total, transaction) => total + transaction.total, 0),
    profitToday: todaysItems.reduce(
      (total, item) => total + (item.sellPrice - item.costPrice) * item.qty,
      0,
    ),
    itemsSoldToday: todaysItems.reduce((total, item) => total + item.qty, 0),
    lowStockCount: stockRows.filter(
      (row) => row.stock <= row.minimumStock && row.trackStock,
    ).length,
    transactionCountToday: todaysTransactions.length,
  }
}

export function getSalesSeries(database, days = 7) {
  const successfulTransactions = getSuccessfulTransactions(database)
  const series = []
  const now = new Date()

  for (let index = days - 1; index >= 0; index -= 1) {
    const cursor = new Date(now)
    cursor.setDate(now.getDate() - index)
    const key = getDateKey(cursor)
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(cursor)

    const total = successfulTransactions
      .filter((transaction) => getDateKey(transaction.createdAt) === key)
      .reduce((sum, transaction) => sum + transaction.total, 0)

    series.push({
      key,
      dayName,
      total,
    })
  }

  return series
}

export function getTopProducts(database, limit = 5) {
  const successfulIds = new Set(getSuccessfulTransactions(database).map((item) => item.id))
  const grouped = new Map()

  database.transactionItems.forEach((item) => {
    if (!successfulIds.has(item.transactionId)) {
      return
    }

    const current = grouped.get(item.productName) || {
      productName: item.productName,
      quantity: 0,
      revenue: 0,
    }

    current.quantity += item.qty
    current.revenue += item.subtotal
    grouped.set(item.productName, current)
  })

  return [...grouped.values()]
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, limit)
}

export function getLatestTransactions(database, limit = 5) {
  return [...database.transactions]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit)
}

export function getLowStockItems(database, limit = 5) {
  return flattenStockRows(database)
    .filter((row) => row.trackStock && row.stock <= row.minimumStock)
    .sort((left, right) => left.stock - right.stock)
    .slice(0, limit)
}

export function getInventoryValue(database) {
  return flattenStockRows(database)
    .filter((row) => row.trackStock)
    .reduce((total, row) => total + row.stock * row.costPrice, 0)
}

export function getPaymentMethodSummary(database, onlyToday = false) {
  const todayKey = getTodayDateKey()
  const successfulTransactions = getSuccessfulTransactions(database).filter((transaction) =>
    onlyToday ? getDateKey(transaction.createdAt) === todayKey : true,
  )
  const totals = {
    cash: 0,
    qris: 0,
    transfer: 0,
  }

  successfulTransactions.forEach((transaction) => {
    totals[transaction.paymentMethod] =
      (totals[transaction.paymentMethod] || 0) + transaction.total
  })

  const grandTotal = Object.values(totals).reduce((sum, value) => sum + value, 0)

  return Object.entries(totals)
    .filter(([, total]) => total > 0)
    .map(([method, total]) => ({
      method,
      label: humanizePaymentMethod(method),
      total,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
}

export function buildHumanSummary(database) {
  const metrics = getDashboardMetrics(database)
  const paymentMethods = getPaymentMethodSummary(database, true)
  const topProduct = getTopProducts(database, 1)[0]

  const lines = [
    `There are ${metrics.transactionCountToday} transactions today.`,
    `Total sales are ${formatRupiah(metrics.salesToday)}.`,
  ]

  paymentMethods.forEach((method) => {
    lines.push(`${method.label} payments total ${formatRupiah(method.total)}.`)
  })

  if (topProduct) {
    lines.push(`The best-selling product is ${topProduct.productName}.`)
  }

  lines.push(`${metrics.lowStockCount} products are running low on stock.`)

  return lines
}
