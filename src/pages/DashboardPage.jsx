import {
  Boxes,
  Check,
  ChevronRight,
  KeyRound,
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

function EmptyMessage({ title, description }) {
  return (
    <div className="border-t border-slate-100 px-5 py-9 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  )
}

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
      title: 'Change the default PIN',
      description: 'Secure staff access before opening the register.',
      done: database.pin !== '1234',
      href: '/pengaturan',
      icon: KeyRound,
    },
    {
      id: 'products',
      title: 'Add your first product',
      description: 'Create the catalog that appears at checkout.',
      done: database.products.length > 0,
      href: '/produk',
      icon: PackagePlus,
    },
    {
      id: 'transaction',
      title: 'Run a test transaction',
      description: 'Verify payments, inventory deduction, and receipts.',
      done: database.transactions.length > 0,
      href: '/kasir',
      icon: Wallet,
    },
  ]
  const remainingSetupTasks = setupTasks.filter((task) => !task.done)
  const completedTaskCount = setupTasks.length - remainingSetupTasks.length

  const workflowSteps = [
    { number: '01', label: 'Products', href: '/produk' },
    { number: '02', label: 'Inventory', href: '/stok' },
    { number: '03', label: 'Point of Sale', href: '/kasir' },
    { number: '04', label: 'Transactions', href: '/transaksi' },
    { number: '05', label: 'Reports', href: '/laporan' },
  ]

  const metricItems = [
    {
      label: "Today's sales",
      value: formatRupiah(metrics.salesToday),
      detail: `${metrics.transactionCountToday} successful transactions`,
    },
    {
      label: 'Estimated profit',
      value: formatRupiah(metrics.profitToday),
      detail: 'Sales minus product cost',
    },
    {
      label: 'Items sold',
      value: formatQuantity(metrics.itemsSoldToday),
      detail: 'Units sold today',
    },
    {
      label: 'Low stock',
      value: String(metrics.lowStockCount),
      detail: 'Items requiring attention',
      alert: metrics.lowStockCount > 0,
    },
  ]

  return (
    <div className="space-y-5">
      {remainingSetupTasks.length > 0 ? (
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Getting started</p>
              </div>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-950">
                Finish the essentials before your first day
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-blue-600" style={{ width: `${(completedTaskCount / setupTasks.length) * 100}%` }} />
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-600">
                {completedTaskCount}/{setupTasks.length}
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {setupTasks.map((task) => {
              const Icon = task.icon
              return (
                <Link key={task.id} to={task.href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 lg:px-6">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${task.done ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-500'}`}>
                    {task.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-0.5 text-sm text-slate-400 sm:mt-0">{task.description}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{task.done ? 'Complete' : 'Open'}</span>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="shrink-0">
            <p className="text-sm font-semibold text-slate-900">Store workflow</p>
            <p className="mt-0.5 text-xs text-slate-400">From catalog setup to business reporting</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Store workflow">
            {workflowSteps.map((step, index) => (
              <div key={step.number} className="flex items-center gap-2">
                <Link to={step.href} className="group inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 transition hover:bg-slate-50">
                  <span className="text-[10px] font-semibold tabular-nums text-slate-300">{step.number}</span>
                  <span className="text-sm font-medium text-slate-600 group-hover:text-blue-700">{step.label}</span>
                </Link>
                {index < workflowSteps.length - 1 ? <ChevronRight className="h-3.5 w-3.5 text-slate-300" /> : null}
              </div>
            ))}
          </nav>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {metricItems.map((metric, index) => (
          <div key={metric.label} className={`px-5 py-5 lg:px-6 ${index > 0 ? 'border-t border-slate-200 sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 sm:border-t xl:border-l xl:border-t-0' : ''}`}>
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-[1.7rem] font-semibold tracking-[-0.035em] ${metric.alert ? 'text-rose-600' : 'text-slate-950'}`}>
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{metric.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_0.85fr]">
        <section className="rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 lg:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Sales trend</h2>
              <p className="mt-1 text-sm text-slate-400">Revenue over the last seven days</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="h-2 w-2 rounded-full bg-blue-600" /> Revenue
            </span>
          </div>
          <div className="h-[330px] px-3 pb-4 pt-6 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesSeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="dayName" stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={52} fontSize={12} tickFormatter={(value) => `Rp${Math.round(value / 1000)}k`} />
                <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', boxShadow: '0 10px 30px rgba(15,23,42,.08)' }} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#2563eb' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Best sellers</h2>
                <p className="mt-0.5 text-xs text-slate-400">Products ranked by revenue</p>
              </div>
              <ShoppingBag className="h-4 w-4 text-slate-400" />
            </div>
            {topProducts.length === 0 ? (
              <EmptyMessage title="No sales data yet" description="Product rankings appear after your first sale." />
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {topProducts.map((product, index) => (
                  <div key={product.productName} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="w-5 text-xs font-semibold tabular-nums text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{product.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatQuantity(product.quantity)} sold</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{formatRupiah(product.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Inventory attention</h2>
                <p className="mt-0.5 text-xs text-slate-400">Items at or below minimum stock</p>
              </div>
              <Boxes className="h-4 w-4 text-slate-400" />
            </div>
            {lowStockItems.length === 0 ? (
              <EmptyMessage title="Inventory looks healthy" description="Low-stock items will appear here." />
            ) : (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {lowStockItems.map((row) => (
                  <div key={row.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{row.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{row.variantName !== '-' ? row.variantName : row.unitName}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-rose-600">{formatQuantity(row.stock)} left</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 lg:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Recent transactions</h2>
            <p className="mt-1 text-sm text-slate-400">Latest completed and cancelled sales</p>
          </div>
          <Link to="/transaksi" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-[0.06em] text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium lg:px-6">Transaction</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestTransactions.length === 0 ? (
                <tr><td colSpan="5"><EmptyMessage title="No transactions yet" description="Completed sales will appear here automatically." /></td></tr>
              ) : (
                latestTransactions.map((transaction) => {
                  const successful = ['Successful', 'Berhasil'].includes(transaction.status)
                  return (
                    <tr key={transaction.id} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-medium text-slate-900 lg:px-6">{transaction.transactionNumber}</td>
                      <td className="px-5 py-4 text-slate-500">{formatDateTime(transaction.createdAt)}</td>
                      <td className="px-5 py-4 text-slate-500">{humanizePaymentMethod(transaction.paymentMethod)}</td>
                      <td className="px-5 py-4 font-semibold text-slate-800">{formatRupiah(transaction.total)}</td>
                      <td className="px-5 py-4"><Badge tone={successful ? 'green' : 'red'}>{successful ? 'Successful' : 'Cancelled'}</Badge></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
