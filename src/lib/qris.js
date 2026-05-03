function readEnv(name) {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function getQrisConfig() {
  return {
    provider: readEnv('VITE_QRIS_PROVIDER') || 'midtrans',
    mode: readEnv('VITE_QRIS_MODE') || 'sandbox',
    enabled: readEnv('VITE_QRIS_ENABLED') === 'true',
  }
}

export function isQrisGatewayEnabled() {
  const config = getQrisConfig()
  return config.provider === 'midtrans' && config.enabled
}

export async function createQrisPayment(payload) {
  const response = await fetch('/api/qris/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const parsed = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(parsed.message || 'Gagal membuat QRIS.')
  }

  return parsed
}

export async function fetchQrisStatus(orderId) {
  const response = await fetch(`/api/qris/status/${encodeURIComponent(orderId)}`)
  const parsed = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(parsed.message || 'Gagal memeriksa status QRIS.')
  }

  return parsed
}

export function isQrisPaid(status) {
  return ['settlement', 'capture'].includes(String(status || '').toLowerCase())
}
