import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
  humanizePaymentMethod,
} from './format.js'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function createId(prefix = 'id') {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

export function toNumber(value) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export function getInitials(name = 'VIGO POS') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function readFileAsJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function downloadFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportRowsToCsv(filename, rows) {
  if (!rows || rows.length === 0) {
    return
  }

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? ''
          const stringValue = String(value).replaceAll('"', '""')
          return `"${stringValue}"`
        })
        .join(','),
    ),
  ]

  downloadFile(filename, csvLines.join('\n'), 'text/csv;charset=utf-8;')
}

export function generateTransactionNumber(transactions) {
  const now = new Date()
  const dateKey = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}`
  const todaysCount = transactions.filter((transaction) =>
    transaction.transactionNumber.includes(dateKey),
  ).length

  return `TRX-${dateKey}-${`${todaysCount + 1}`.padStart(3, '0')}`
}

export function buildWhatsAppLink(phoneNumber, message) {
  const digits = String(phoneNumber || '').replace(/\D/g, '')
  const normalizedPhone = digits.startsWith('0') ? `62${digits.slice(1)}` : digits
  const encodedMessage = encodeURIComponent(message)

  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`
  }

  return `https://wa.me/?text=${encodedMessage}`
}

export function buildReceiptText({ transaction, items, storeSettings }) {
  const headerName = storeSettings?.receiptName || storeSettings?.storeName || 'VIGO POS'
  const address = storeSettings?.receiptAddress || storeSettings?.address || '-'
  const whatsapp = storeSettings?.receiptWhatsApp || storeSettings?.whatsapp || '-'
  const footer =
    storeSettings?.receiptFooter ||
    'Terima kasih atas kunjungan Anda.\nBarang yang sudah dibeli tidak dapat ditukar atau dikembalikan.'

  const itemLines = items.flatMap((item) => {
    const firstLine = `${item.productName}${item.variantName ? ` (${item.variantName})` : ''}`
    const secondLine = `${formatQuantity(item.qty)} ${item.unitName} x ${formatRupiah(item.sellPrice)} = ${formatRupiah(item.subtotal)}`
    return [firstLine, secondLine]
  })

  return [
    headerName,
    address,
    `WhatsApp: ${whatsapp}`,
    '--------------------------------',
    `No Transaksi : ${transaction.transactionNumber}`,
    `Tanggal      : ${formatDateTime(transaction.createdAt)}`,
    `Kasir        : ${transaction.cashierName}`,
    `Metode       : ${humanizePaymentMethod(transaction.paymentMethod)}`,
    '--------------------------------',
    ...itemLines,
    '--------------------------------',
    `Subtotal     : ${formatRupiah(transaction.subtotal)}`,
    `Diskon       : ${formatRupiah(transaction.discount)}`,
    `Total        : ${formatRupiah(transaction.total)}`,
    '--------------------------------',
    footer,
  ].join('\n')
}

export function printReceipt(payload) {
  const receiptText = buildReceiptText(payload)
  const popup = window.open('', '_blank', 'width=420,height=720')

  if (!popup) {
    window.alert('Popup diblokir browser. Izinkan popup untuk mencetak struk.')
    return
  }

  popup.document.write(`
    <html>
      <head>
        <title>Cetak Struk VIGO POS</title>
        <style>
          body {
            font-family: "Courier New", monospace;
            padding: 24px;
            color: #0f172a;
            white-space: pre-wrap;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>${receiptText.replaceAll('\n', '<br/>')}</body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  popup.print()
}
