import dotenv from 'dotenv'
import express from 'express'
import { Buffer } from 'node:buffer'

dotenv.config()

const app = express()
const PORT = Number(process.env.API_PORT || 3001)
const MIDTRANS_SERVER_KEY = (process.env.MIDTRANS_SERVER_KEY || '').trim()
const MIDTRANS_ENV = (process.env.MIDTRANS_ENV || 'sandbox').trim().toLowerCase()
const MIDTRANS_API_BASE_URL =
  MIDTRANS_ENV === 'production'
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'

app.use(express.json({ limit: '1mb' }))

function requireMidtransConfig(response) {
  if (!MIDTRANS_SERVER_KEY) {
    response.status(500).json({
      message:
        'MIDTRANS_SERVER_KEY belum diisi. Tambahkan kredensial sandbox Midtrans di file .env.local.',
    })
    return false
  }

  return true
}

function buildMidtransHeaders() {
  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64')
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  }
}

function getQrActionUrl(actions = []) {
  const targetAction = actions.find((action) => action.name === 'generate-qr-code')
  return targetAction?.url || actions[0]?.url || ''
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    provider: 'midtrans',
    mode: MIDTRANS_ENV,
  })
})

app.post('/api/qris/create', async (request, response) => {
  if (!requireMidtransConfig(response)) {
    return
  }

  const { cartItems = [], discount = 0, total = 0, storeSettings = {} } = request.body || {}

  if (!Array.isArray(cartItems) || cartItems.length === 0 || Number(total) <= 0) {
    response.status(400).json({
      message: 'Keranjang kosong atau total transaksi tidak valid untuk QRIS.',
    })
    return
  }

  const transactionNumber =
    String(request.body?.transactionNumber || '').trim() || `TRX-${Date.now()}`
  const payload = {
    payment_type: 'qris',
    transaction_details: {
      order_id: transactionNumber,
      gross_amount: Math.round(Number(total)),
    },
    item_details: cartItems.map((item, index) => ({
      id: item.variantId || item.productId || `ITEM-${index + 1}`,
      price: Math.round(Number(item.sellPrice || 0)),
      quantity: Number(item.qty || 0),
      name: String(item.variantName ? `${item.productName} - ${item.variantName}` : item.productName)
        .slice(0, 50),
    })),
    customer_details: {
      first_name: storeSettings?.storeName || 'Pelanggan VIGO POS',
    },
    custom_expiry: {
      expiry_duration: 15,
      unit: 'minute',
    },
  }

  if (Number(discount) > 0) {
    payload.item_details.push({
      id: 'DISCOUNT',
      price: -Math.round(Number(discount)),
      quantity: 1,
      name: 'Diskon',
    })
  }

  try {
    const result = await fetch(`${MIDTRANS_API_BASE_URL}/v2/charge`, {
      method: 'POST',
      headers: buildMidtransHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await result.json()

    if (!result.ok) {
      response.status(result.status).json({
        message: data.status_message || 'Midtrans menolak pembuatan QRIS.',
        details: data,
      })
      return
    }

    response.json({
      orderId: data.order_id,
      transactionNumber,
      total: Math.round(Number(total)),
      qrUrl: getQrActionUrl(data.actions),
      gatewayStatus: data.transaction_status || 'pending',
      expiresAt: data.expiry_time || '',
      raw: data,
    })
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Gagal terhubung ke Midtrans.',
    })
  }
})

app.get('/api/qris/status/:orderId', async (request, response) => {
  if (!requireMidtransConfig(response)) {
    return
  }

  try {
    const result = await fetch(
      `${MIDTRANS_API_BASE_URL}/v2/${encodeURIComponent(request.params.orderId)}/status`,
      {
        headers: buildMidtransHeaders(),
      },
    )

    const data = await result.json()

    if (!result.ok) {
      response.status(result.status).json({
        message: data.status_message || 'Gagal memeriksa status pembayaran.',
        details: data,
      })
      return
    }

    response.json({
      orderId: data.order_id,
      gatewayStatus: data.transaction_status || 'pending',
      paymentType: data.payment_type || 'qris',
      transactionTime: data.transaction_time || '',
      settlementTime: data.settlement_time || '',
      raw: data,
    })
  } catch (error) {
    response.status(500).json({
      message: error.message || 'Gagal memeriksa status Midtrans.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[qris-api] listening on http://127.0.0.1:${PORT}`)
})
