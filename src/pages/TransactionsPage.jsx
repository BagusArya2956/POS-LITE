import { useMemo, useState } from 'react'
import { Download, Printer, Search, Undo2 } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import TransactionDetailModal from '../components/transactions/TransactionDetailModal.jsx'
import { usePos } from '../context/PosContext.jsx'
import {
  formatDateTime,
  formatQuantity,
  formatRupiah,
  getDateKey,
  humanizePaymentMethod,
} from '../lib/format.js'
import { exportRowsToCsv, printReceipt } from '../lib/helpers.js'
import { getTransactionItems } from '../lib/selectors.js'

function TransactionsPage() {
  const { database, cancelTransaction } = usePos()
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [activeTransactionId, setActiveTransactionId] = useState('')

  const filteredTransactions = useMemo(() => {
    return [...database.transactions]
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .filter((transaction) => {
        const key = getDateKey(transaction.createdAt)
        const matchesSearch = transaction.transactionNumber
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesStart = startDate ? key >= startDate : true
        const matchesEnd = endDate ? key <= endDate : true

        return matchesSearch && matchesStart && matchesEnd
      })
  }, [database.transactions, endDate, search, startDate])

  const activeTransaction = database.transactions.find(
    (transaction) => transaction.id === activeTransactionId,
  )
  const activeItems = activeTransaction
    ? getTransactionItems(database, activeTransaction.id)
    : []

  function exportTransactions() {
      const rows = filteredTransactions.map((transaction) => ({
        no_transaksi: transaction.transactionNumber,
        tanggal: formatDateTime(transaction.createdAt),
        jumlah_item: getTransactionItems(database, transaction.id).reduce(
          (sum, item) => sum + item.qty,
          0,
        ),
        metode_pembayaran: humanizePaymentMethod(transaction.paymentMethod),
        total: transaction.total,
        status: transaction.status,
      }))

    exportRowsToCsv(`transaksi-vigo-pos-${getDateKey(new Date())}.csv`, rows)
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.7fr_0.7fr_auto]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-12"
              placeholder="Cari nomor transaksi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
          <Button variant="secondary" onClick={exportTransactions}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">No Transaksi</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Jumlah Item</th>
                <th className="px-6 py-4 font-semibold">Metode Pembayaran</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8">
                    <EmptyState
                      title="Belum ada transaksi"
                      description="Transaksi yang sesuai filter akan tampil di sini."
                    />
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => {
                  const items = getTransactionItems(database, transaction.id)
                  const payload = {
                    transaction,
                    items,
                    storeSettings: database.storeSettings,
                  }

                  return (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {transaction.transactionNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateTime(transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatQuantity(items.reduce((sum, item) => sum + item.qty, 0))}
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
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveTransactionId(transaction.id)}
                          >
                            Detail
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => printReceipt(payload)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={transaction.status === 'Dibatalkan'}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Batalkan transaksi ${transaction.transactionNumber}? Stok akan dikembalikan.`,
                                )
                              ) {
                                const result = cancelTransaction(transaction.id)
                                if (!result.ok) {
                                  window.alert(result.message)
                                }
                              }
                            }}
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <TransactionDetailModal
        open={Boolean(activeTransaction)}
        onClose={() => setActiveTransactionId('')}
        transaction={activeTransaction}
        items={activeItems}
        storeSettings={database.storeSettings}
      />
    </div>
  )
}

export default TransactionsPage
