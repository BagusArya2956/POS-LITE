import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Download,
  PackageMinus,
  ReceiptText,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Button from '../components/ui/Button.jsx'
import { usePos } from '../context/PosContext.jsx'
import {
  formatQuantity,
  formatRupiah,
  getDateKey,
  humanizePaymentMethod,
} from '../lib/format.js'
import { exportRowsToCsv } from '../lib/helpers.js'
import { getLowStockItems } from '../lib/selectors.js'

const periodOptions = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
]

const paymentColors = {
  cash: '#059669',
  qris: '#2563eb',
  transfer: '#d97706',
}

function isSuccessful(transaction) {
  return ['Successful', 'Berhasil'].includes(transaction.status)
}

function getPeriodBounds(days, offset = 0) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  end.setDate(end.getDate() - offset * days)

  const start = new Date(end)
  start.setDate(end.getDate() - days + 1)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

function isWithinPeriod(value, bounds) {
  const time = new Date(value).getTime()
  return time >= bounds.start.getTime() && time <= bounds.end.getTime()
}

function calculateMetrics(transactions, items) {
  const revenue = transactions.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0)
  const profit = items.reduce(
    (sum, item) =>
      sum + (Number(item.sellPrice || 0) - Number(item.costPrice || 0)) * Number(item.qty || 0),
    0,
  )
  const itemCount = items.reduce((sum, item) => sum + Number(item.qty || 0), 0)

  return {
    revenue,
    profit,
    itemCount,
    transactionCount: transactions.length,
    averageOrder: transactions.length > 0 ? revenue / transactions.length : 0,
    margin: revenue > 0 ? (profit / revenue) * 100 : 0,
  }
}

function buildReportData(database, days) {
  const currentBounds = getPeriodBounds(days)
  const previousBounds = getPeriodBounds(days, 1)
  const allCurrentTransactions = database.transactions.filter((transaction) =>
    isWithinPeriod(transaction.createdAt, currentBounds),
  )
  const currentTransactions = allCurrentTransactions.filter(isSuccessful)
  const previousTransactions = database.transactions.filter(
    (transaction) => isSuccessful(transaction) && isWithinPeriod(transaction.createdAt, previousBounds),
  )
  const currentIds = new Set(currentTransactions.map((transaction) => transaction.id))
  const previousIds = new Set(previousTransactions.map((transaction) => transaction.id))
  const currentItems = database.transactionItems.filter((item) => currentIds.has(item.transactionId))
  const previousItems = database.transactionItems.filter((item) => previousIds.has(item.transactionId))
  const metrics = calculateMetrics(currentTransactions, currentItems)
  const previousMetrics = calculateMetrics(previousTransactions, previousItems)

  const itemsByTransaction = currentItems.reduce((groups, item) => {
    if (!groups.has(item.transactionId)) groups.set(item.transactionId, [])
    groups.get(item.transactionId).push(item)
    return groups
  }, new Map())

  const salesSeries = []
  for (let index = 0; index < days; index += 1) {
    const date = new Date(currentBounds.start)
    date.setDate(currentBounds.start.getDate() + index)
    const key = getDateKey(date)
    const dailyTransactions = currentTransactions.filter(
      (transaction) => getDateKey(transaction.createdAt) === key,
    )
    const dailyItems = dailyTransactions.flatMap(
      (transaction) => itemsByTransaction.get(transaction.id) || [],
    )

    salesSeries.push({
      key,
      label: new Intl.DateTimeFormat('en-US', {
        month: days > 7 ? 'short' : undefined,
        day: days > 7 ? 'numeric' : undefined,
        weekday: days <= 7 ? 'short' : undefined,
      }).format(date),
      revenue: dailyTransactions.reduce(
        (sum, transaction) => sum + Number(transaction.total || 0),
        0,
      ),
      profit: calculateMetrics(dailyTransactions, dailyItems).profit,
    })
  }

  const productGroups = new Map()
  currentItems.forEach((item) => {
    const current = productGroups.get(item.productName) || {
      productName: item.productName,
      quantity: 0,
      revenue: 0,
    }
    current.quantity += Number(item.qty || 0)
    current.revenue += Number(item.subtotal || 0)
    productGroups.set(item.productName, current)
  })

  const topProducts = [...productGroups.values()]
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5)

  const paymentTotals = currentTransactions.reduce((totals, transaction) => {
    totals[transaction.paymentMethod] =
      (totals[transaction.paymentMethod] || 0) + Number(transaction.total || 0)
    return totals
  }, {})

  const paymentMethods = Object.entries(paymentTotals)
    .filter(([, total]) => total > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([method, total]) => ({
      method,
      label: humanizePaymentMethod(method),
      total,
      percentage: metrics.revenue > 0 ? (total / metrics.revenue) * 100 : 0,
    }))

  return {
    currentBounds,
    allCurrentTransactions,
    metrics,
    previousMetrics,
    salesSeries,
    topProducts,
    paymentMethods,
  }
}

function formatPeriodDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatAxisCurrency(value) {
  if (!value) return '0'
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function getRevenueChange(currentRevenue, previousRevenue) {
  if (previousRevenue === 0) return currentRevenue > 0 ? null : 0
  return ((currentRevenue - previousRevenue) / previousRevenue) * 100
}

function RevenueChange({ value, hasNewActivity }) {
  if (hasNewActivity) {
    return <span className="text-xs font-medium text-blue-700">New activity this period</span>
  }

  const positive = value >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-emerald-700' : 'text-rose-600'}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}% vs previous period
    </span>
  )
}

function EmptyPanel({ title, description }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
      <ReceiptText className="h-5 w-5 text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
    </div>
  )
}

function ReportsPage() {
  const { database } = usePos()
  const [periodDays, setPeriodDays] = useState(30)
  const report = useMemo(() => buildReportData(database, periodDays), [database, periodDays])
  const lowStockItems = getLowStockItems(database, 5)
  const revenueChange = getRevenueChange(
    report.metrics.revenue,
    report.previousMetrics.revenue,
  )

  const metricItems = [
    {
      label: 'Net revenue',
      value: formatRupiah(report.metrics.revenue),
      detail: (
        <RevenueChange
          value={revenueChange || 0}
          hasNewActivity={revenueChange === null}
        />
      ),
    },
    {
      label: 'Estimated profit',
      value: formatRupiah(report.metrics.profit),
      detail: `${report.metrics.margin.toFixed(1)}% gross margin`,
    },
    {
      label: 'Completed sales',
      value: String(report.metrics.transactionCount),
      detail: `${formatRupiah(report.metrics.averageOrder)} average order`,
    },
    {
      label: 'Items sold',
      value: formatQuantity(report.metrics.itemCount),
      detail: 'Across the selected period',
    },
  ]

  function exportReport() {
    const rows = report.allCurrentTransactions.map((transaction) => ({
      transaction_number: transaction.transactionNumber,
      date: transaction.createdAt,
      payment_method: humanizePaymentMethod(transaction.paymentMethod),
      status: transaction.status,
      subtotal: transaction.subtotal,
      discount: transaction.discount,
      total: transaction.total,
    }))

    exportRowsToCsv(
      `vigo-sales-report-${periodDays}-days-${getDateKey(new Date())}.csv`,
      rows,
    )
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">Reporting period</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatPeriodDate(report.currentBounds.start)} – {formatPeriodDate(report.currentBounds.end)}
            </p>
          </div>
          <div className="flex w-fit rounded-xl bg-slate-100 p-1" role="group" aria-label="Reporting period">
            {periodOptions.map((option) => {
              const active = periodDays === option.days
              return (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => setPeriodDays(option.days)}
                  className={`min-h-10 rounded-lg px-3.5 text-sm font-medium transition ${active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
        <Button
          variant="secondary"
          className="disabled:cursor-not-allowed disabled:opacity-50"
          onClick={exportReport}
          disabled={report.allCurrentTransactions.length === 0}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </section>

      <section className="grid overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        {metricItems.map((metric, index) => (
          <div
            key={metric.label}
            className={`px-5 py-5 lg:px-6 ${index === 1 ? 'border-t border-slate-200 sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'border-t border-slate-200 xl:border-l xl:border-t-0' : ''} ${index === 3 ? 'border-t border-slate-200 sm:border-l xl:border-t-0' : ''}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              {metric.label}
            </p>
            <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.035em] text-slate-950">
              {metric.value}
            </p>
            <div className="mt-1 text-xs text-slate-400">{metric.detail}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between lg:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Revenue performance</h2>
              <p className="mt-1 text-sm text-slate-400">Daily revenue and estimated profit</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" /> Revenue</span>
              <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-600" /> Profit</span>
            </div>
          </div>

          {report.metrics.transactionCount === 0 ? (
            <EmptyPanel
              title="No sales in this period"
              description="Choose a wider period or complete a transaction to begin tracking performance."
            />
          ) : (
            <div className="h-[350px] px-2 pb-4 pt-6 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={report.salesSeries} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.015} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    interval={periodDays === 90 ? 13 : periodDays === 30 ? 4 : 0}
                    minTickGap={18}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={formatAxisCurrency}
                    width={52}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatRupiah(value), name === 'revenue' ? 'Revenue' : 'Profit']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.key || ''}
                    contentStyle={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      boxShadow: '0 12px 30px rgba(15,23,42,.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#reportRevenueFill)"
                    activeDot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Payment mix</h2>
            <p className="mt-1 text-sm text-slate-400">Share of completed revenue</p>
          </div>
          {report.paymentMethods.length === 0 ? (
            <EmptyPanel
              title="No payments recorded"
              description="Payment composition appears after a completed sale."
            />
          ) : (
            <div className="divide-y divide-slate-100 px-5">
              {report.paymentMethods.map((method) => (
                <div key={method.method} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: paymentColors[method.method] || '#64748b' }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{method.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{method.percentage.toFixed(1)}% of revenue</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {formatRupiah(method.total)}
                    </p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${method.percentage}%`,
                        backgroundColor: paymentColors[method.method] || '#64748b',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 lg:px-6">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Best-selling products</h2>
              <p className="mt-1 text-sm text-slate-400">Ranked by revenue in the selected period</p>
            </div>
            <span className="text-xs font-medium text-slate-400">Top 5</span>
          </div>

          {report.topProducts.length === 0 ? (
            <EmptyPanel
              title="No product rankings yet"
              description="Products will be ranked after completed transactions in this period."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] uppercase tracking-[0.06em] text-slate-400">
                  <tr>
                    <th className="w-16 px-5 py-3 font-medium lg:px-6">Rank</th>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 text-right font-medium">Units sold</th>
                    <th className="px-5 py-3 text-right font-medium">Revenue</th>
                    <th className="px-5 py-3 text-right font-medium">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.topProducts.map((product, index) => (
                    <tr key={product.productName} className="transition hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-xs font-semibold tabular-nums text-slate-400 lg:px-6">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-900">{product.productName}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-slate-500">
                        {formatQuantity(product.quantity)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold tabular-nums text-slate-800">
                        {formatRupiah(product.revenue)}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-500">
                        {report.metrics.revenue > 0
                          ? `${((product.revenue / report.metrics.revenue) * 100).toFixed(1)}%`
                          : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Inventory alerts</h2>
              <p className="mt-1 text-sm text-slate-400">Current stock requiring attention</p>
            </div>
            <PackageMinus className="h-[18px] w-[18px] text-slate-400" />
          </div>

          {lowStockItems.length === 0 ? (
            <EmptyPanel
              title="Inventory looks healthy"
              description="Low-stock products will appear here automatically."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockItems.map((row) => (
                <div key={row.id} className="flex items-center gap-3 px-5 py-4">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${row.stock <= 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{row.productName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {row.variantName !== '-' ? row.variantName : row.unitName}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${row.stock <= 0 ? 'text-rose-600' : 'text-amber-700'}`}>
                    {formatQuantity(row.stock)} left
                  </span>
                </div>
              ))}
              <Link
                to="/stok"
                className="flex min-h-12 items-center justify-center gap-1.5 border-t border-slate-100 text-sm font-medium text-blue-700 transition hover:bg-slate-50 hover:text-blue-800"
              >
                Review inventory <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ReportsPage
