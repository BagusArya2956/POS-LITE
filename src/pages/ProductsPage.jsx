import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import ProductFormModal from '../components/products/ProductFormModal.jsx'
import { usePos } from '../context/PosContext.jsx'
import { formatQuantity, formatRupiah, humanizeProductType } from '../lib/format.js'
import {
  getCategoryName,
  getProductCurrentStock,
  getStockStatus,
  getUnitName,
  getVariantsForProduct,
} from '../lib/selectors.js'

function ProductsPage() {
  const { database, upsertProduct, deleteProduct } = usePos()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    productId: '',
  })

  const filteredProducts = useMemo(() => {
    return database.products.filter((product) => {
      const categoryName = getCategoryName(database.categories, product.categoryId)
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        categoryName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' ? true : product.categoryId === categoryFilter
      const matchesType = typeFilter === 'all' ? true : product.type === typeFilter

      return matchesSearch && matchesCategory && matchesType
    })
  }, [categoryFilter, database.categories, database.products, search, typeFilter])

  const activeProduct = database.products.find((product) => product.id === modalState.productId)
  const activeVariants = activeProduct
    ? getVariantsForProduct(database.variants, activeProduct.id)
    : []

  function handleSaveProduct(payload) {
    if (!payload.name || !payload.categoryId || !payload.unitId) {
      window.alert('Nama, kategori, dan satuan wajib diisi.')
      return
    }

    if (payload.type === 'variant' && payload.variants.length === 0) {
      window.alert('Produk varian minimal harus memiliki satu varian.')
      return
    }

    const result = upsertProduct(payload)
    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setModalState({
      open: false,
      mode: 'create',
      productId: '',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-12"
              placeholder="Cari produk..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
            <select
              className="form-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">Semua kategori</option>
              {database.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">Semua tipe</option>
              <option value="basic">Barang biasa</option>
              <option value="variant">Barang varian</option>
              <option value="weighted">Berat / volume</option>
              <option value="package">Paket</option>
              <option value="service">Jasa tanpa stok</option>
            </select>
          </div>
          <Button
            size="lg"
            onClick={() =>
              setModalState({
                open: true,
                mode: 'create',
                productId: '',
              })
            }
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                <th className="px-6 py-4 font-semibold">Kategori</th>
                <th className="px-6 py-4 font-semibold">Tipe Produk</th>
                <th className="px-6 py-4 font-semibold">Satuan</th>
                <th className="px-6 py-4 font-semibold">Harga Jual</th>
                <th className="px-6 py-4 font-semibold">Stok</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8">
                    <EmptyState
                      title="Produk belum tersedia"
                      description="Tambahkan produk baru atau ubah filter pencarian."
                    />
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const productVariants = getVariantsForProduct(database.variants, product.id)
                  const currentStock = getProductCurrentStock(product, productVariants)
                  const stockStatus = getStockStatus(
                    currentStock || 0,
                    product.minimumStock,
                    product.trackStock,
                  )

                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-extrabold text-blue-700">
                            {product.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">{product.name}</p>
                              {product.isFavorite ? (
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-500">
                              {product.type === 'variant'
                                ? `${productVariants.length} varian`
                                : product.sku || 'Tanpa SKU'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {getCategoryName(database.categories, product.categoryId)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{humanizeProductType(product.type)}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {getUnitName(database.units, product.unitId)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {formatRupiah(product.sellPrice)}
                      </td>
                      <td className="px-6 py-4">
                        {product.trackStock ? (
                          <Badge tone={stockStatus.tone}>
                            {product.type === 'variant'
                              ? `${formatQuantity(currentStock)} total`
                              : `${formatQuantity(currentStock)} ${getUnitName(database.units, product.unitId)}`}
                          </Badge>
                        ) : (
                          <Badge tone="green">Tanpa stok</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={product.status === 'Aktif' ? 'green' : 'slate'}>
                          {product.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setModalState({
                                open: true,
                                mode: 'view',
                                productId: product.id,
                              })
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setModalState({
                                open: true,
                                mode: 'edit',
                                productId: product.id,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Hapus produk ${product.name}?`)) {
                                const result = deleteProduct(product.id)
                                if (!result.ok) {
                                  window.alert(result.message)
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
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

      <ProductFormModal
        open={modalState.open}
        onClose={() =>
          setModalState({
            open: false,
            mode: 'create',
            productId: '',
          })
        }
        onSubmit={handleSaveProduct}
        categories={database.categories}
        units={database.units}
        product={activeProduct}
        productVariants={activeVariants}
        mode={modalState.mode}
      />
    </div>
  )
}

export default ProductsPage
