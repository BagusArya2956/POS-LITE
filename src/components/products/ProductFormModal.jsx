import { useEffect, useState } from 'react'
import {
  Barcode,
  Boxes,
  ImagePlus,
  Package,
  Package2,
  Plus,
  ScanLine,
  Shirt,
  ShoppingBag,
  Trash2,
  Wrench,
} from 'lucide-react'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import { humanizeProductType } from '../../lib/format.js'
import { readFileAsDataUrl, toNumber } from '../../lib/helpers.js'
import { getQuantityStep } from '../../lib/quantity.js'

const PRODUCT_TYPES = [
  {
    id: 'basic',
    label: 'Barang biasa',
    description: 'Untuk produk satuan tanpa pilihan varian.',
    icon: Package,
  },
  {
    id: 'variant',
    label: 'Barang varian',
    description: 'Untuk produk dengan ukuran, warna, atau model.',
    icon: Shirt,
  },
  {
    id: 'weighted',
    label: 'Berat / volume',
    description: 'Untuk produk yang dijual per kg, gram, liter, atau ml.',
    icon: Boxes,
  },
  {
    id: 'package',
    label: 'Paket',
    description: 'Untuk bundling atau paket penjualan.',
    icon: Package2,
  },
  {
    id: 'service',
    label: 'Jasa tanpa stok',
    description: 'Untuk layanan yang tidak memiliki stok fisik.',
    icon: Wrench,
  },
]

function createEmptyVariant() {
  return {
    id: '',
    name: '',
    attributes: '',
    sku: '',
    sellPrice: 0,
    costPrice: 0,
    stock: 0,
    minimumStock: 0,
  }
}

function mapProductToForm(product, productVariants) {
  if (!product) {
    return {
      id: '',
      mode: 'create',
      name: '',
      categoryId: '',
      unitId: '',
      type: 'basic',
      costPrice: 0,
      sellPrice: 0,
      trackStock: true,
      stock: 0,
      minimumStock: 0,
      sku: '',
      barcode: '',
      image: '',
      status: 'Aktif',
      isFavorite: false,
      variants: [createEmptyVariant()],
    }
  }

  return {
    id: product.id,
    mode: 'edit',
    name: product.name,
    categoryId: product.categoryId,
    unitId: product.unitId,
    type: product.type,
    costPrice: product.costPrice,
    sellPrice: product.sellPrice,
    trackStock: product.trackStock,
    stock: product.stock,
    minimumStock: product.minimumStock,
    sku: product.sku || '',
    barcode: product.barcode || '',
    image: product.image || '',
    status: product.status || 'Aktif',
    isFavorite: Boolean(product.isFavorite),
    variants:
      productVariants.length > 0
        ? productVariants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            attributes: variant.attributes,
            sku: variant.sku,
            sellPrice: variant.sellPrice,
            costPrice: variant.costPrice,
            stock: variant.stock,
            minimumStock: variant.minimumStock,
          }))
        : [createEmptyVariant()],
  }
}

function ProductTypeCard({ type, selected, disabled, onSelect }) {
  const Icon = type.icon

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(type.id)}
      className={`rounded-3xl border px-4 py-4 text-left transition ${
        selected
          ? 'border-blue-600 bg-blue-50 shadow-[0_10px_24px_rgba(37,99,235,0.12)]'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={`font-semibold ${selected ? 'text-blue-700' : 'text-slate-900'}`}>
            {type.label}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{type.description}</p>
        </div>
      </div>
    </button>
  )
}

function normalizeCurrencyFieldValue(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function formatCurrencyInputValue(value) {
  const digits = normalizeCurrencyFieldValue(value)

  if (!digits) {
    return ''
  }

  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Number(digits))
}

function CurrencyInput({ value, disabled, onChange, placeholder = '0' }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
        Rp
      </span>
      <input
        type="text"
        inputMode="numeric"
        className="form-input pl-11"
        value={formatCurrencyInputValue(value)}
        disabled={disabled}
        onChange={(event) => {
          const digits = normalizeCurrencyFieldValue(event.target.value)
          onChange({
            ...event,
            target: {
              ...event.target,
              value: digits,
            },
          })
        }}
        placeholder={placeholder}
      />
    </div>
  )
}

function ProductFormModal({
  open,
  onClose,
  onSubmit,
  categories,
  units,
  product,
  productVariants,
  mode = 'create',
}) {
  const [form, setForm] = useState(mapProductToForm(product, productVariants))

  useEffect(() => {
    if (!open) {
      return
    }

    setForm({
      ...mapProductToForm(product, productVariants),
      mode,
    })
  }, [mode, open, product, productVariants])

  const isEdit = mode === 'edit'
  const isView = mode === 'view'
  const isVariantProduct = form.type === 'variant'
  const isService = form.type === 'service'
  const selectedUnitName = units.find((unit) => unit.id === form.unitId)?.name || ''
  const stockStep = getQuantityStep(form.type, selectedUnitName)
  const currentType = PRODUCT_TYPES.find((type) => type.id === form.type)

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const imageUrl = await readFileAsDataUrl(file)
    setForm((current) => ({
      ...current,
      image: imageUrl,
    }))
  }

  function updateVariant(index, patch) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              ...patch,
            }
          : variant,
      ),
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      ...form,
      trackStock: isService ? false : isVariantProduct ? true : form.trackStock,
      stock: isService || isVariantProduct ? 0 : toNumber(form.stock),
      minimumStock: isService || isVariantProduct ? 0 : toNumber(form.minimumStock),
      variants: form.variants
        .filter((variant) => variant.name.trim())
        .map((variant) => ({
          ...variant,
          stock: toNumber(variant.stock),
          minimumStock: toNumber(variant.minimumStock),
          sellPrice: toNumber(variant.sellPrice),
          costPrice: toNumber(variant.costPrice),
        })),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? 'Tambah Produk Baru'
          : mode === 'edit'
            ? 'Edit Produk'
            : 'Detail Produk'
      }
      className="max-w-5xl"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] px-5 py-4">
          <p className="text-sm font-semibold text-blue-700">
            Isi informasi inti terlebih dahulu, lalu atur stok atau varian sesuai tipe produk.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Field penting yang perlu dipastikan: nama produk, kategori, satuan, tipe produk, dan harga jual.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Informasi Utama</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Data ini akan dipakai di katalog produk dan layar kasir.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="form-label">Nama Produk</label>
                <input
                  className="form-input"
                  value={form.name}
                  disabled={isView}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Masukkan nama produk"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Gunakan nama yang mudah dikenali kasir, misalnya Air Mineral 600 ml.
                </p>
              </div>
              <div>
                <label className="form-label">Kategori</label>
                <select
                  className="form-select"
                  value={form.categoryId}
                  disabled={isView}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Kategori membantu produk lebih cepat ditemukan saat transaksi.
                </p>
              </div>
              <div>
                <label className="form-label">Satuan</label>
                <select
                  className="form-select"
                  value={form.unitId}
                  disabled={isView}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitId: event.target.value,
                    }))
                  }
                >
                  <option value="">Pilih satuan</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  Contoh: pcs, kg, liter, paket, atau set.
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="form-label">Tipe Produk</label>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {PRODUCT_TYPES.map((type) => (
                    <ProductTypeCard
                      key={type.id}
                      type={type}
                      selected={form.type === type.id}
                      disabled={isView || isEdit}
                      onSelect={(nextType) =>
                        setForm((current) => ({
                          ...current,
                          type: nextType,
                          trackStock:
                            nextType === 'service'
                              ? false
                              : nextType === 'variant'
                                ? true
                                : current.trackStock,
                        }))
                      }
                    />
                  ))}
                </div>
                {isEdit ? (
                  <p className="mt-3 text-xs text-slate-400">
                    Tipe produk dikunci saat edit agar histori stok dan transaksi tetap aman.
                  </p>
                ) : null}
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <label className="form-label">Harga Modal</label>
                <CurrencyInput
                  value={form.costPrice}
                  disabled={isView}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      costPrice: event.target.value,
                    }))
                  }
                  placeholder="Contoh 10000"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Dipakai untuk menghitung perkiraan untung.
                </p>
              </div>
              <div className="rounded-3xl border border-blue-100 bg-blue-50/50 px-4 py-4">
                <label className="form-label">Harga Jual</label>
                <CurrencyInput
                  value={form.sellPrice}
                  disabled={isView}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sellPrice: event.target.value,
                    }))
                  }
                  placeholder="Contoh 15000"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Harga ini yang muncul di kasir saat produk dijual.
                </p>
              </div>
              <div>
                <label className="form-label">SKU</label>
                <div className="relative">
                  <Barcode className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="form-input pl-11"
                    value={form.sku}
                    disabled={isView}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sku: event.target.value,
                      }))
                    }
                    placeholder="Opsional"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Berguna jika Anda ingin kode internal untuk gudang atau katalog.
                </p>
              </div>
              <div>
                <label className="form-label">Barcode</label>
                <div className="relative">
                  <ScanLine className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="form-input pl-11"
                    value={form.barcode}
                    disabled={isView}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        barcode: event.target.value,
                      }))
                    }
                    placeholder="Opsional"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Isi jika Anda ingin scan produk lebih cepat di masa depan.
                </p>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">Favorit di Kasir</p>
                  <p className="text-sm text-slate-500">
                    Produk favorit akan muncul saat filter Favorit dipilih.
                  </p>
                </div>
                <label className="inline-flex items-center gap-3 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-slate-300 text-blue-700"
                    checked={form.isFavorite}
                    disabled={isView}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isFavorite: event.target.checked,
                      }))
                    }
                  />
                  Ya
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <ImagePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Foto & Ringkasan</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Foto bersifat opsional, tetapi membantu kasir mengenali produk lebih cepat.
                </p>
              </div>
            </div>
            <label className="mt-5 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              {form.image ? (
                <img
                  src={form.image}
                  alt={form.name}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-base font-semibold text-slate-700">Pilih gambar</p>
                  <p className="mt-1 text-sm text-slate-500">JPG / PNG maksimal 2 MB</p>
                </>
              )}
              {!isView ? (
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              ) : null}
            </label>
            <div className="mt-5 space-y-3">
              <div className="rounded-3xl bg-blue-50 p-4 text-sm text-blue-700">
                Tipe saat ini:{' '}
                <span className="font-semibold">
                  {currentType?.label || humanizeProductType(form.type)}
                </span>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Checklist cepat
                </p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>{form.name ? 'Nama produk sudah diisi' : 'Isi nama produk terlebih dahulu'}</p>
                  <p>
                    {form.categoryId ? 'Kategori sudah dipilih' : 'Pilih kategori agar produk mudah dicari'}
                  </p>
                  <p>{form.unitId ? 'Satuan sudah dipilih' : 'Pilih satuan jual yang sesuai'}</p>
                  <p>{toNumber(form.sellPrice) > 0 ? 'Harga jual sudah siap' : 'Isi harga jual agar bisa disimpan'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Lacak Stok</h3>
                <p className="text-sm text-slate-500">
                  Hitung dan kelola ketersediaan stok produk ini.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-6 w-6 rounded border-slate-300 text-blue-700"
                checked={isService ? false : isVariantProduct ? true : form.trackStock}
                disabled={isView || isService || isVariantProduct}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    trackStock: event.target.checked,
                  }))
                }
              />
            </div>

            {isService ? (
              <div className="mt-5 rounded-3xl bg-emerald-50 p-4 text-sm text-emerald-700">
                Produk ini tidak menggunakan stok.
              </div>
            ) : null}

            {isVariantProduct ? (
              <div className="mt-5 rounded-3xl bg-blue-50 p-4 text-sm text-blue-700">
                Produk varian selalu melacak stok per varian agar transaksi tetap akurat.
              </div>
            ) : null}

            {!isService && !isVariantProduct ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="form-label">{isEdit ? 'Stok saat ini' : 'Stok awal'}</label>
                  <input
                    type="number"
                    step={stockStep}
                    className="form-input"
                    value={form.stock}
                    disabled={isView || isEdit}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        stock: event.target.value,
                      }))
                    }
                  />
                  {isEdit ? (
                    <p className="mt-2 text-xs text-slate-400">
                      Gunakan halaman Stok untuk menambah atau mengurangi jumlah.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Isi stok awal jika produk langsung tersedia setelah dibuat.
                    </p>
                  )}
                </div>
                <div>
                  <label className="form-label">Stok minimum</label>
                  <input
                    type="number"
                    step={stockStep}
                    className="form-input"
                    value={form.minimumStock}
                    disabled={isView}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minimumStock: event.target.value,
                      }))
                    }
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Sistem akan memberi peringatan saat stok menyentuh angka ini.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 p-5">
            <h3 className="text-xl font-bold text-slate-900">Status Produk</h3>
            <p className="text-sm text-slate-500">Atur apakah produk tampil aktif di katalog kasir.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {['Aktif', 'Nonaktif'].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isView}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      status,
                    }))
                  }
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    form.status === status
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-blue-200'
                  }`}
                >
                  <p className="font-semibold">{status}</p>
                  <p className="mt-1 text-sm">
                    {status === 'Aktif'
                      ? 'Produk tampil dan bisa dijual di kasir.'
                      : 'Produk disembunyikan dari kasir tanpa menghapus data.'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {isVariantProduct ? (
          <div className="rounded-3xl border border-slate-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Daftar Varian</h3>
                <p className="text-sm text-slate-500">
                  Tambahkan warna, ukuran, rasa, atau model produk. Setiap varian bisa punya harga dan stok sendiri.
                </p>
              </div>
              {!isView ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      variants: [...current.variants, createEmptyVariant()],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Tambah varian
                </Button>
              ) : null}
            </div>
            <div className="mt-5 space-y-4">
              {form.variants.map((variant, index) => (
                <div key={variant.id || index} className="rounded-3xl border border-slate-200 p-4">
                  <div className="grid gap-4 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                      <label className="form-label">Nama varian</label>
                      <input
                        className="form-input"
                        value={variant.name}
                        disabled={isView}
                        onChange={(event) => updateVariant(index, { name: event.target.value })}
                        placeholder="Mis. Hitam M"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="form-label">Atribut</label>
                      <input
                        className="form-input"
                        value={variant.attributes}
                        disabled={isView}
                        onChange={(event) =>
                          updateVariant(index, { attributes: event.target.value })
                        }
                        placeholder="Mis. Warna Hitam, Ukuran M"
                      />
                    </div>
                    <div>
                      <label className="form-label">SKU</label>
                      <input
                        className="form-input"
                        value={variant.sku}
                        disabled={isView}
                        onChange={(event) => updateVariant(index, { sku: event.target.value })}
                      />
                    </div>
                    <div className="flex items-end justify-end">
                      {!isView ? (
                        <Button
                          variant="ghost"
                          className="h-12 w-12 rounded-full p-0 text-rose-600 hover:bg-rose-50"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              variants: current.variants.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="form-label">Harga jual</label>
                      <CurrencyInput
                        value={variant.sellPrice}
                        disabled={isView}
                        onChange={(event) =>
                          updateVariant(index, { sellPrice: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">Harga modal</label>
                      <CurrencyInput
                        value={variant.costPrice}
                        disabled={isView}
                        onChange={(event) =>
                          updateVariant(index, { costPrice: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label">{isEdit ? 'Stok saat ini' : 'Stok awal'}</label>
                      <input
                        type="number"
                        className="form-input"
                        value={variant.stock}
                        disabled={isView || isEdit}
                        onChange={(event) => updateVariant(index, { stock: event.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Stok minimum</label>
                      <input
                        type="number"
                        className="form-input"
                        value={variant.minimumStock}
                        disabled={isView}
                        onChange={(event) =>
                          updateVariant(index, { minimumStock: event.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {isView ? 'Tutup' : 'Batal'}
          </Button>
          {!isView ? <Button type="submit">Simpan Produk</Button> : null}
        </div>
      </form>
    </Modal>
  )
}

export default ProductFormModal
