import {
  BarChart3,
  Box,
  Boxes,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  Landmark,
  PackagePlus,
  ShoppingBag,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import { usePos } from '../context/PosContext.jsx'
import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
  humanizePaymentMethod,
} from '../lib/format.js'
import {
  getDashboardMetrics,
  getLatestTransactions,
  getLowStockItems,
  getSalesSeries,
  getTopProducts,
} from '../lib/selectors.js'

function DashboardPage() {
  const { database } = usePos()
  const metrics = getDashboardMetrics(database)
  const salesSeries = getSalesSeries(database)
  const topProducts = getTopProducts(database, 4)
  const lowStockItems = getLowStockItems(database, 4)
  const latestTransactions = getLatestTransactions(database, 5)
  const setupTasks = [
    {
      id: 'pin',
      title: 'Ganti PIN default',
      description: 'Amankan akses kasir dengan PIN baru di halaman Pengaturan.',
      done: database.pin !== '1234',
      href: '/pengaturan',
      icon: KeyRound,
      tone: 'blue',
    },
    {
      id: 'products',
      title: 'Tambah produk pertama',
      description: 'Isi katalog agar kasir siap dipakai oleh staf atau owner.',
      done: database.products.length > 0,
      href: '/produk',
      icon: PackagePlus,
      tone: 'emerald',
    },
    {
      id: 'transaction',
      title: 'Coba transaksi pertama',
      description: 'Pastikan alur pembayaran dan struk sudah sesuai kebutuhan toko.',
      done: database.transactions.length > 0,
      href: '/kasir',
      icon: Wallet,
      tone: 'amber',
    },
  ]
  const remainingSetupTasks = setupTasks.filter((task) => !task.done)

  return (
    <div className="space-y-6">
      {remainingSetupTasks.length > 0 ? (
        <Card className="overflow-hidden border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Mulai dari sini
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Sistem sudah siap, tinggal selesaikan langkah awal yang paling penting
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Kami sarankan selesaikan checklist ini lebih dulu agar VIGO POS terasa aman,
                rapi, dan nyaman dipakai sejak hari pertama.
              </p>
            </div>
            <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-blue-100">
              <p className="text-sm font-semibold text-slate-500">Progress setup awal</p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                {setupTasks.length - remainingSetupTasks.length}/{setupTasks.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">langkah sudah selesai</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {setupTasks.map((task) => {
              const Icon = task.icon
              const toneClasses = {
                blue: 'bg-blue-50 text-blue-700',
                emerald: 'bg-emerald-50 text-emerald-700',
                amber: 'bg-amber-50 text-amber-700',
              }

              return (
                <div
                  key={task.id}
                  className={`rounded-[28px] border px-5 py-5 ${
                    task.done
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        task.done ? 'bg-emerald-100 text-emerald-700' : toneClasses[task.tone]
                      }`}
                    >
                      {task.done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <Badge tone={task.done ? 'green' : 'blue'}>
                      {task.done ? 'Selesai' : 'Perlu dilakukan'}
                    </Badge>
                  </div>
                  <p className="mt-4 text-xl font-bold tracking-tight text-slate-900">{task.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">{task.description}</p>
                  <Link
                    to={task.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                  >
                    {task.done ? 'Tinjau lagi' : 'Buka sekarang'}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )
            })}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard
          title="Penjualan Hari Ini"
          value={formatRupiah(metrics.salesToday)}
          subtitle="Total transaksi sukses hari ini"
          icon={Landmark}
          accent="blue"
        />
        <StatCard
          title="Perkiraan Untung"
          value={formatRupiah(metrics.profitToday)}
          subtitle="Selisih harga jual dan modal"
          icon={BarChart3}
          accent="green"
        />
        <StatCard
          title="Produk Terjual"
          value={`${formatQuantity(metrics.itemsSoldToday)} item`}
          subtitle="Akumulasi qty pada transaksi berhasil"
          icon={ShoppingBag}
          accent="blue"
        />
        <StatCard
          title="Stok Menipis"
          value={`${metrics.lowStockCount} produk`}
          subtitle="Perlu dicek di halaman stok"
          icon={Boxes}
          accent="red"
          className="border-rose-200"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title text-[1.8rem]">Penjualan 7 Hari Terakhir</h2>
              <p className="section-subtitle mt-1">Lihat tren pemasukan harian toko Anda.</p>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="dayName" stroke="#64748b" />
                <YAxis
                  stroke="#64748b"
                  tickFormatter={(value) => `Rp${Math.round(value / 1000)}k`}
                />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={4}
                  dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Produk Paling Laku</h2>
              <Box className="h-6 w-6 text-slate-400" />
            </div>
            <div className="mt-6 space-y-4">
              {topProducts.length === 0 ? (
                <EmptyState
                  title="Belum ada data penjualan"
                  description="Produk terlaris akan muncul setelah transaksi pertama."
                />
              ) : (
                topProducts.map((product) => (
                  <div
                    key={product.productName}
                    className="flex items-center justify-between rounded-3xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{product.productName}</p>
                      <p className="text-sm text-slate-500">
                        {formatQuantity(product.quantity)} terjual
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-700">{formatRupiah(product.revenue)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="border-rose-200 bg-rose-50/60">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Stok Hampir Habis</h2>
              <Badge tone="red">Perlu aksi</Badge>
            </div>
            <div className="mt-6 space-y-3">
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada produk yang mendekati batas minimum.</p>
              ) : (
                lowStockItems.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-2xl border border-rose-200 bg-white px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{row.productName}</p>
                      <p className="text-xs text-slate-500">
                        {row.variantName !== '-' ? row.variantName : row.unitName}
                      </p>
                    </div>
                    <Badge tone={row.status.tone}>Sisa {formatQuantity(row.stock)}</Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="section-title text-[1.8rem]">Transaksi Terbaru</h2>
            <p className="section-subtitle mt-1">Lima transaksi terakhir dari seluruh riwayat.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">No Transaksi</th>
                <th className="px-6 py-3 font-semibold">Waktu</th>
                <th className="px-6 py-3 font-semibold">Metode</th>
                <th className="px-6 py-3 font-semibold">Total</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {latestTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8">
                    <EmptyState
                      title="Belum ada transaksi"
                      description="Transaksi terbaru akan muncul setelah kasir dipakai."
                    />
                  </td>
                </tr>
              ) : (
                latestTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {transaction.transactionNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {humanizePaymentMethod(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatRupiah(transaction.total)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={transaction.status === 'Berhasil' ? 'green' : 'red'}>
                        {transaction.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default DashboardPage
