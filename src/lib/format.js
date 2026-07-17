export function formatRupiah(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

export function formatQuantity(value) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number(value || 0))
}

export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(value))
}

export function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatClock(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

export function getDateKey(value) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getTodayDateKey() {
  return getDateKey(new Date())
}

export function humanizePaymentMethod(method) {
  const map = {
    cash: 'Cash',
    qris: 'QRIS',
    transfer: 'Transfer',
  }

  return map[method] ?? method
}

export function humanizeProductType(type) {
  const map = {
    basic: 'Standard Product',
    variant: 'Variant product',
    weighted: 'Weight / volume',
    package: 'Bundle',
    service: 'Service without inventory',
  }

  return map[type] ?? type
}
