import { useState } from 'react'
import { History, Minus, Plus } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import Modal from '../components/ui/Modal.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import StockAdjustmentModal from '../components/stock/StockAdjustmentModal.jsx'
import { usePos } from '../context/PosContext.jsx'
import { formatDateTime, formatQuantity, formatRupiah } from '../lib/format.js'
import { flattenStockRows, getInventoryValue } from '../lib/selectors.js'

const movementTypeLabels = {
  initial: 'Initial Stock',
  adjustment_in: 'Add stock',
  adjustment_out: 'Remove stock',
  sale: 'Sales',
  cancel_sale: 'Transaction cancellation',
}

function StockPage() {
  const { database, adjustStock } = usePos()
  const [modalState, setModalState] = useState({ open: false, mode: 'in', selection: null })
  const [historyState, setHistoryState] = useState({ open: false, rowId: '' })
  const stockRows = flattenStockRows(database)
  const trackableRows = stockRows.filter((row) => row.trackStock)
  const outOfStock = trackableRows.filter((row) => row.stock <= 0).length
  const lowStock = trackableRows.filter(
    (row) => row.stock > 0 && row.stock <= row.minimumStock,
  ).length
  const inventoryValue = getInventoryValue(database)
  const selectedHistoryRow = stockRows.find((row) => row.id === historyState.rowId)
  const rowMovements = database.stockMovements
    .filter(
      (movement) =>
        movement.productId === selectedHistoryRow?.productId &&
        movement.variantId === (selectedHistoryRow?.variantId || ''),
    )
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

  function handleSubmitAdjustment(payload) {
    const result = adjustStock(payload)
    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setModalState({ open: false, mode: 'in', selection: null })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Total Products" value={`${database.products.length}`} subtitle="Active catalog items" />
        <StatCard
          title="Low Stock"
          value={`${lowStock}`}
          subtitle="Restock soon"
          accent="amber"
        />
        <StatCard
          title="Out of Stock"
          value={`${outOfStock}`}
          subtitle="Products unavailable for sale"
          accent="red"
        />
        <StatCard
          title="Inventory Value"
          value={formatRupiah(inventoryValue)}
          subtitle="Based on cost price"
          accent="green"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="section-title text-[1.8rem]">Inventory List</h2>
            <p className="section-subtitle mt-1">View product and variant stock in one place.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setModalState({ open: true, mode: 'in', selection: null })}>
              <Plus className="h-4 w-4" />
              Add Stock
            </Button>
            <Button
              variant="secondary"
              onClick={() => setModalState({ open: true, mode: 'out', selection: null })}
            >
              <Minus className="h-4 w-4" />
              Remove Stock
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Products</th>
                <th className="px-6 py-4 font-semibold">Variant</th>
                <th className="px-6 py-4 font-semibold">Unit</th>
                <th className="px-6 py-4 font-semibold">SKU</th>
                <th className="px-6 py-4 font-semibold">Current Stock</th>
                <th className="px-6 py-4 font-semibold">Minimum Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stockRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8">
                    <EmptyState
                      title="No inventory data"
                      description="Add a product to populate the inventory list."
                    />
                  </td>
                </tr>
              ) : (
                stockRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.productName}</td>
                    <td className="px-6 py-4 text-slate-600">{row.variantName}</td>
                    <td className="px-6 py-4 text-slate-600">{row.unitName}</td>
                    <td className="px-6 py-4 text-slate-600">{row.sku}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.trackStock ? formatQuantity(row.stock) : 'No inventory'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.trackStock ? formatQuantity(row.minimumStock) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={row.status.tone}>{row.status.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setModalState({
                              open: true,
                              mode: 'in',
                              selection: row,
                            })
                          }
                          disabled={!row.trackStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setModalState({
                              open: true,
                              mode: 'out',
                              selection: row,
                            })
                          }
                          disabled={!row.trackStock}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setHistoryState({
                              open: true,
                              rowId: row.id,
                            })
                          }
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <StockAdjustmentModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, mode: 'in', selection: null })}
        onSubmit={handleSubmitAdjustment}
        products={database.products}
        variants={database.variants}
        units={database.units}
        initialSelection={modalState.selection}
        mode={modalState.mode}
      />

      <Modal
        open={historyState.open}
        onClose={() => setHistoryState({ open: false, rowId: '' })}
        title={`Inventory History — ${selectedHistoryRow?.productName || ''}`}
        className="max-w-4xl"
      >
        <div className="space-y-3">
          {rowMovements.length === 0 ? (
            <EmptyState
              title="No inventory history"
              description="Inventory changes for this item will appear here."
            />
          ) : (
            rowMovements.map((movement) => (
              <div key={movement.id} className="rounded-3xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {movement.variantName
                        ? `${movement.productName} - ${movement.variantName}`
                        : movement.productName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{movement.note || movement.reason}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      tone={
                        movement.type === 'sale' || movement.type === 'adjustment_out'
                          ? 'red'
                          : 'green'
                      }
                    >
                      {movementTypeLabels[movement.type] || movement.type}
                    </Badge>
                    <p className="mt-2 text-sm text-slate-500">{formatDateTime(movement.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                  <p>Quantity: {formatQuantity(movement.quantity)}</p>
                  <p>Before: {formatQuantity(movement.beforeStock)}</p>
                  <p>After: {formatQuantity(movement.afterStock)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

export default StockPage
