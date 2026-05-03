import { AlertTriangle, Download, Sparkles } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import { usePos } from '../context/PosContext.jsx'
import { formatQuantity, formatRupiah, getDateKey } from '../lib/format.js'
import { exportRowsToCsv } from '../lib/helpers.js'
import {
  buildHumanSummary,
  getDashboardMetrics,
  getLowStockItems,
  getPaymentMethodSummary,
  getSalesSeries,
  getTopProducts,
} from '../lib/selectors.js'

function ReportsPage() {
  const { database } = usePos()
  const metrics = getDashboardMetrics(database)
  const salesSeries = getSalesSeries(database)
  const paymentMethods = getPaymentMethodSummary(database, true)
  const topProducts = getTopProducts(database, 5)
  const lowStockItems = getLowStockItems(database, 5)
  const summaryLines = buildHumanSummary(database)

  function exportReport() {
    const rows = database.transactions.map((transaction) => ({
      no_transaksi: transaction.transactionNumber,
      tanggal: transaction.createdAt,
      metode: transaction.paymentMethod,
      status: transaction.status,
      total: transaction.total,
    }))
    exportRowsToCsv(`laporan-vigo-pos-${getDateKey(new Date())}.csv`, rows)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <Button size="lg" onClick={exportReport}>
          <Download className="h-4 w-4" />
          Unduh Laporan Excel
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Penjualan Hari Ini" value={formatRupiah(metrics.salesToday)} />
        <StatCard
          title="Perkiraan Untung"
          value={formatRupiah(metrics.profitToday)}
          accent="green"
        />
        <StatCard
          title="Produk Terjual"
          value={`${formatQuantity(metrics.itemsSoldToday)} Item`}
          accent="blue"
        />
        <StatCard
          title="Barang Hampir Habis"
          value={`${metrics.lowStockCount} Produk`}
          accent="red"
          className="border-rose-200 bg-rose-50/50"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title text-[1.8rem]">Grafik Penjualan 7 Hari</h2>
              <p className="section-subtitle mt-1">Ringkasan performa penjualan satu minggu terakhir.</p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesSeries}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="dayName" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `Rp${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Bar dataKey="total" fill="#2563eb" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div>
              <h2 className="section-title leading-tight">Produk Paling Laku</h2>
              <p className="section-subtitle mt-1">Top 5 produk dari transaksi yang berhasil.</p>
            </div>
            <div className="mt-6 space-y-4">
              {topProducts.length === 0 ? (
                <EmptyState
                  title="Belum ada produk terlaris"
                  description="Daftar produk paling laku akan muncul setelah ada transaksi berhasil."
                />
              ) : (
                topProducts.map((product, index) => (
                  <div key={product.productName} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-700">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{product.productName}</p>
                        <p className="text-sm text-slate-500">
                          {formatQuantity(product.quantity)} terjual
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-700">{formatRupiah(product.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div>
              <h2 className="section-title leading-tight">Metode Pembayaran</h2>
              <p className="section-subtitle mt-1">Ringkasan kontribusi setiap metode pembayaran hari ini.</p>
            </div>
            <div className="mt-6 space-y-4">
              {paymentMethods.length === 0 ? (
                <EmptyState
                  title="Belum ada pembayaran tercatat"
                  description="Komposisi metode pembayaran akan tampil setelah transaksi pertama berhasil."
                />
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.method}>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                      <span>{method.label}</span>
                      <span>{method.percentage}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full ${
                          method.method === 'cash'
                            ? 'bg-emerald-600'
                            : method.method === 'qris'
                              ? 'bg-blue-700'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${method.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="relative overflow-hidden border-blue-100 bg-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-600" />
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Ringkasan Sederhana</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bacaan singkat tentang performa penjualan dan stok hari ini.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {summaryLines.map((line) => (
              <div
                key={line}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-medium text-slate-700"
              >
                {line}
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-rose-100 bg-white">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Barang Hampir Habis</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pantau item yang perlu segera ditambah sebelum mengganggu penjualan.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {lowStockItems.length === 0 ? (
              <EmptyState
                title="Belum ada stok yang perlu diwaspadai"
                description="Semua stok masih aman. Daftar peringatan akan muncul otomatis saat stok menipis."
              />
            ) : (
              lowStockItems.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/40 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{row.productName}</p>
                    <p className="text-xs text-slate-500">
                      {row.variantName !== '-' ? row.variantName : row.unitName}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
                    Sisa {formatQuantity(row.stock)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ReportsPage
