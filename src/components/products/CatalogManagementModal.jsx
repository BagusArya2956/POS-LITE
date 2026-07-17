import { useEffect, useMemo, useState } from 'react'
import { FolderTree, Pencil, Plus, Ruler, Trash2, X } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

function CatalogManagementModal({
  open,
  onClose,
  categories,
  units,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddUnit,
  onDeleteUnit,
}) {
  const [categoryDraft, setCategoryDraft] = useState({ id: '', name: '' })
  const [unitName, setUnitName] = useState('')

  useEffect(() => {
    if (!open) {
      setCategoryDraft({ id: '', name: '' })
      setUnitName('')
    }
  }, [open])

  const categoryUsage = useMemo(() => {
    return products.reduce((counts, product) => {
      counts[product.categoryId] = (counts[product.categoryId] || 0) + 1
      return counts
    }, {})
  }, [products])

  const unitUsage = useMemo(() => {
    return products.reduce((counts, product) => {
      counts[product.unitId] = (counts[product.unitId] || 0) + 1
      return counts
    }, {})
  }, [products])

  function handleSaveCategory(event) {
    event.preventDefault()
    const result = categoryDraft.id
      ? onUpdateCategory(categoryDraft.id, categoryDraft.name)
      : onAddCategory(categoryDraft.name)

    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setCategoryDraft({ id: '', name: '' })
  }

  function handleAddUnit(event) {
    event.preventDefault()
    const result = onAddUnit(unitName)
    if (!result.ok) {
      window.alert(result.message)
      return
    }
    setUnitName('')
  }

  function handleDeleteCategory(category) {
    if (!window.confirm(`Delete category ${category.name}?`)) return
    const result = onDeleteCategory(category.id)
    if (!result.ok) window.alert(result.message)
  }

  function handleDeleteUnit(unit) {
    if (!window.confirm(`Delete unit ${unit.name}?`)) return
    const result = onDeleteUnit(unit.id)
    if (!result.ok) window.alert(result.message)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catalog management"
      className="max-w-5xl"
      contentClassName="p-0"
    >
      <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-4">
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Organize the reusable categories and units shown when staff add products. Items already
          in use are protected from accidental deletion.
        </p>
      </div>

      <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="p-6" aria-labelledby="catalog-category-title">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 id="catalog-category-title" className="font-semibold text-slate-950">
                Categories
              </h3>
              <p className="mt-1 text-sm text-slate-500">Group products for faster filtering.</p>
            </div>
          </div>

          <form className="mt-5 flex gap-2" onSubmit={handleSaveCategory}>
            <input
              className="form-input min-w-0"
              value={categoryDraft.name}
              onChange={(event) =>
                setCategoryDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder={categoryDraft.id ? 'Update category name' : 'New category name'}
              aria-label="Category name"
            />
            {categoryDraft.id ? (
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                onClick={() => setCategoryDraft({ id: '', name: '' })}
                aria-label="Cancel editing category"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <Button type="submit" className="h-11 shrink-0 px-4 py-0">
              {categoryDraft.id ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {categoryDraft.id ? 'Save' : 'Add'}
            </Button>
          </form>

          <div className="mt-5 max-h-72 divide-y divide-slate-100 overflow-y-auto border-y border-slate-100">
            {categories.map((category) => {
              const usage = categoryUsage[category.id] || 0
              return (
                <div key={category.id} className="flex min-h-16 items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{category.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {usage === 1 ? 'Used by 1 product' : `Used by ${usage} products`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
                      onClick={() => setCategoryDraft({ id: category.id, name: category.name })}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={usage > 0}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      onClick={() => handleDeleteCategory(category)}
                      aria-label={`Delete ${category.name}`}
                      title={usage > 0 ? 'Move products to another category before deleting' : 'Delete category'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="p-6" aria-labelledby="catalog-unit-title">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <h3 id="catalog-unit-title" className="font-semibold text-slate-950">
                Sales units
              </h3>
              <p className="mt-1 text-sm text-slate-500">Examples: pcs, kg, liter, or box.</p>
            </div>
          </div>

          <form className="mt-5 flex gap-2" onSubmit={handleAddUnit}>
            <input
              className="form-input min-w-0"
              value={unitName}
              onChange={(event) => setUnitName(event.target.value)}
              placeholder="New unit name"
              aria-label="Unit name"
            />
            <Button type="submit" className="h-11 shrink-0 px-4 py-0">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>

          <div className="mt-5 max-h-72 divide-y divide-slate-100 overflow-y-auto border-y border-slate-100">
            {units.map((unit) => {
              const usage = unitUsage[unit.id] || 0
              return (
                <div key={unit.id} className="flex min-h-16 items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{unit.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {usage === 1 ? 'Used by 1 product' : `Used by ${usage} products`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={usage > 0}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    onClick={() => handleDeleteUnit(unit)}
                    aria-label={`Delete ${unit.name}`}
                    title={usage > 0 ? 'Change the product unit before deleting' : 'Delete unit'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </Modal>
  )
}

export default CatalogManagementModal
