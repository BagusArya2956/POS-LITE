const FRACTIONAL_STEP_BY_UNIT = {
  kg: 0.1,
  liter: 0.1,
  meter: 0.1,
  gram: 1,
  ml: 1,
}

export function getQuantityStep(productType, unitName = '') {
  const normalizedUnit = unitName.toLowerCase()

  if (productType === 'weighted' || productType === 'service') {
    return FRACTIONAL_STEP_BY_UNIT[normalizedUnit] ?? 0.1
  }

  return 1
}

export function allowsDecimalQuantity(productType, unitName = '') {
  return getQuantityStep(productType, unitName) < 1
}

export function roundQuantity(value, precision = 3) {
  const multiplier = 10 ** precision
  return Math.round(Number(value || 0) * multiplier) / multiplier
}

export function normalizeQuantity(value, productType, unitName = '') {
  const numericValue = Number(value || 0)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  const step = getQuantityStep(productType, unitName)
  if (step >= 1) {
    return Math.max(0, Math.round(numericValue))
  }

  return Math.max(0, roundQuantity(numericValue))
}
