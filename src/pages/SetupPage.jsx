import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  ImagePlus,
  MessageCircle,
  Package,
  Phone,
  ShoppingBag,
  Sparkles,
  Store,
  Tags,
} from 'lucide-react'
import { BUSINESS_TYPES, STOCK_TYPE_OPTIONS } from '../data/templates.js'
import { usePos } from '../context/PosContext.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import { humanizeProductType } from '../lib/format.js'
import { buildWhatsAppLink, readFileAsDataUrl } from '../lib/helpers.js'

const SUPPORT_WHATSAPP_NUMBER = '081353823867'

const stockOptionMap = {
  basic: 'Produk fisik dengan stok satuan yang langsung dijual per item.',
  variant: 'Produk dengan ukuran, warna, rasa, atau model yang punya stok masing-masing.',
  weighted: 'Produk dijual per gram, kg, liter, ml, atau meter.',
  package: 'Produk bundel atau paket hemat dengan harga gabungan.',
  service: 'Layanan atau jasa yang tidak memakai stok fisik.',
}

const onboardingSteps = [
  {
    id: 'intro',
    title: 'Pahami alurnya dulu',
    subtitle: 'Lihat cara kerja singkat VIGO POS sebelum Anda menyiapkan toko.',
  },
  {
    id: 'business',
    title: 'Pilih jenis usaha',
    subtitle: 'Sistem akan menyesuaikan kategori awal dan contoh alur penjualan.',
  },
  {
    id: 'stock',
    title: 'Pilih cara jual dan stok',
    subtitle: 'Tentukan model produk yang memang dipakai agar input nanti tidak membingungkan.',
  },
  {
    id: 'profile',
    title: 'Lengkapi data toko',
    subtitle: 'Data ini dipakai untuk nama toko, struk, dan login pertama dengan PIN.',
  },
  {
    id: 'summary',
    title: 'Periksa ringkasan setup',
    subtitle: 'Pastikan pilihan Anda sudah sesuai sebelum masuk ke sistem.',
  },
]

const businessTypeDescriptions = {
  'Toko Umum': 'Cocok untuk toko campuran dengan produk kebutuhan harian.',
  'Makanan dan Minuman': 'Cocok untuk cafe, warung makan, minuman kekinian, atau snack.',
  'Pakaian dan Aksesoris': 'Cocok untuk fashion dengan ukuran, warna, dan model.',
  Sembako: 'Cocok untuk beras, gula, minyak, telur, dan kebutuhan rumah tangga.',
  Kosmetik: 'Cocok untuk skincare, makeup, dan produk kecantikan.',
  'Alat Tulis': 'Cocok untuk ATK, buku, printer, dan kebutuhan sekolah/kantor.',
  Sparepart: 'Cocok untuk toko onderdil, oli, atau aksesoris kendaraan.',
  Jasa: 'Cocok untuk laundry, service, booking, dan layanan tanpa stok fisik.',
  Custom: 'Pilih ini jika bisnis Anda unik dan ingin atur kategori sendiri.',
}

const businessTypeMeta = {
  'Toko Umum': {
    eyebrow: 'Serbaguna',
    accent: 'from-blue-600/12 via-blue-500/6 to-transparent',
    summary: 'Paling fleksibel untuk toko campuran dengan banyak jenis barang.',
  },
  'Makanan dan Minuman': {
    eyebrow: 'F&B',
    accent: 'from-amber-500/14 via-orange-400/6 to-transparent',
    summary: 'Pas untuk cafe, minuman, warung makan, dan penjualan menu cepat.',
  },
  'Pakaian dan Aksesoris': {
    eyebrow: 'Fashion',
    accent: 'from-fuchsia-500/12 via-pink-400/6 to-transparent',
    summary: 'Mendukung kebutuhan ukuran, warna, model, dan varian fashion.',
  },
  Sembako: {
    eyebrow: 'Grosir',
    accent: 'from-emerald-500/14 via-lime-400/6 to-transparent',
    summary: 'Nyaman untuk barang harian, kebutuhan rumah, dan stok jumlah besar.',
  },
  Kosmetik: {
    eyebrow: 'Beauty',
    accent: 'from-rose-500/12 via-pink-400/6 to-transparent',
    summary: 'Cocok untuk skincare, makeup, dan produk dengan branding rapi.',
  },
  'Alat Tulis': {
    eyebrow: 'ATK',
    accent: 'from-sky-500/12 via-cyan-400/6 to-transparent',
    summary: 'Pas untuk toko sekolah, kantor, buku, dan perlengkapan printer.',
  },
  Sparepart: {
    eyebrow: 'Part',
    accent: 'from-slate-500/12 via-slate-400/6 to-transparent',
    summary: 'Cocok untuk toko onderdil, oli, dan kebutuhan servis kendaraan.',
  },
  Jasa: {
    eyebrow: 'Service',
    accent: 'from-violet-500/12 via-indigo-400/6 to-transparent',
    summary: 'Untuk layanan tanpa stok fisik seperti laundry, booking, dan service.',
  },
  Custom: {
    eyebrow: 'Custom',
    accent: 'from-blue-500/12 via-slate-300/8 to-transparent',
    summary: 'Pilih jika Anda ingin mulai dari template paling netral dan fleksibel.',
  },
}

const introHighlights = [
  {
    title: 'Kasir lebih cepat dipahami',
    description:
      'Produk, kategori, dan metode jual akan disesuaikan sejak awal supaya kasir tidak membingungkan.',
    icon: ShoppingBag,
  },
  {
    title: 'Stok mengikuti jenis bisnis',
    description:
      'Anda bisa menentukan apakah bisnis menjual barang biasa, varian, timbangan, paket, atau jasa.',
    icon: Boxes,
  },
  {
    title: 'Kategori dibuat otomatis',
    description:
      'Sistem akan menyiapkan kategori awal sesuai jenis usaha, lalu tetap bisa Anda ubah lagi nanti.',
    icon: Tags,
  },
]

function getPreviewCategoriesForType(type) {
  const map = {
    'Toko Umum': ['Produk Harian', 'Keperluan Rumah', 'Aksesoris', 'Lainnya'],
    'Makanan dan Minuman': ['Makanan', 'Minuman', 'Snack', 'Paket'],
    'Pakaian dan Aksesoris': ['Kaos', 'Celana', 'Jaket', 'Aksesoris'],
    Sembako: ['Beras', 'Minyak', 'Gula', 'Kebutuhan Harian'],
    Kosmetik: ['Skincare', 'Makeup', 'Haircare', 'Aksesoris'],
    'Alat Tulis': ['Buku', 'Alat Tulis', 'Printer', 'Lainnya'],
    Sparepart: ['Mesin', 'Kelistrikan', 'Oli', 'Aksesoris'],
    Jasa: ['Layanan', 'Paket', 'Kunjungan', 'Lainnya'],
    Custom: ['Umum'],
  }

  return map[type] || ['Umum']
}

function StepChip({ index, title, active, completed }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
          completed
            ? 'bg-emerald-100 text-emerald-700'
            : active
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-500'
        }`}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-slate-900' : 'text-slate-500'}`}>
          {title}
        </p>
      </div>
    </div>
  )
}

function BusinessTypeCard({ type, selected, onSelect, categoryCount }) {
  const meta = businessTypeMeta[type] || businessTypeMeta.Custom

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-[30px] border text-left transition-all duration-200 ${
        selected
          ? 'border-blue-600 bg-white shadow-[0_18px_40px_rgba(37,99,235,0.16)] ring-4 ring-blue-100'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]'
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${meta.accent}`} />
      <div className="relative flex h-full min-h-[208px] flex-col px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95">
            {meta.eyebrow}
          </div>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition ${
              selected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-200 bg-white text-transparent group-hover:border-blue-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[1.45rem] font-extrabold leading-tight tracking-tight text-slate-900">
            {type}
          </p>
          <p
            className="mt-2 text-sm leading-6 text-slate-500"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {businessTypeDescriptions[type]}
          </p>
        </div>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <p
            className="text-xs font-medium leading-5 text-slate-500"
            style={{
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {meta.summary}
          </p>
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {categoryCount} kategori awal
          </p>
        </div>
      </div>
    </button>
  )
}

function SetupPage() {
  const { initializeStore } = usePos()
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState({
    storeName: '',
    address: '',
    whatsapp: '',
    logo: '',
    businessType: 'Toko Umum',
    stockTypesManaged: ['basic'],
  })

  const previewCategories = useMemo(() => {
    return getPreviewCategoriesForType(form.businessType)
  }, [form.businessType])

  const selectedStockTypes = useMemo(
    () =>
      form.stockTypesManaged
        .map(
          (stockTypeId) =>
            STOCK_TYPE_OPTIONS.find((item) => item.id === stockTypeId)?.label || stockTypeId,
        )
        .filter(Boolean),
    [form.stockTypesManaged],
  )
  const supportLink = useMemo(
    () =>
      buildWhatsAppLink(
        SUPPORT_WHATSAPP_NUMBER,
        'Halo, saya sedang menyiapkan VIGO POS dan butuh bantuan memilih jenis usaha atau model stok.',
      ),
    [],
  )

  const progressValue = ((currentStep + 1) / onboardingSteps.length) * 100

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const logo = await readFileAsDataUrl(file)
    setForm((current) => ({
      ...current,
      logo,
    }))
  }

  function goNext() {
    if (currentStep === 2 && form.stockTypesManaged.length === 0) {
      window.alert('Pilih minimal satu tipe stok atau cara jual yang ingin dipakai.')
      return
    }

    if (currentStep === 3 && (!form.storeName.trim() || !form.whatsapp.trim())) {
      window.alert('Isi nama toko dan WhatsApp terlebih dahulu sebelum melihat ringkasan setup.')
      return
    }

    setCurrentStep((value) => Math.min(value + 1, onboardingSteps.length - 1))
  }

  function goBack() {
    setCurrentStep((value) => Math.max(value - 1, 0))
  }

  function handleSubmit(skip = false) {
    const payload = skip
      ? {
          storeName: form.storeName || 'Toko VIGO POS',
          address: form.address || 'Alamat toko belum diisi',
          whatsapp: form.whatsapp || '-',
          logo: form.logo,
          businessType: form.businessType,
          stockTypesManaged:
            form.stockTypesManaged.length > 0 ? form.stockTypesManaged : ['basic'],
        }
      : {
          ...form,
          stockTypesManaged:
            form.stockTypesManaged.length > 0 ? form.stockTypesManaged : ['basic'],
        }

    if (!skip && (!payload.storeName || !payload.whatsapp)) {
      window.alert('Nama toko dan WhatsApp wajib diisi sebelum memulai.')
      return
    }

    initializeStore(payload)
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8">
      <Card className="surface-card w-full max-w-6xl border-white/70 bg-white p-0 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
        <div className="grid items-start gap-0 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="flex flex-col border-b border-slate-200 bg-[linear-gradient(180deg,#0f172a,#1e3a8a)] p-8 text-white lg:border-b-0 lg:border-r">
            <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-white">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100/90">
                Onboarding VIGO POS
              </p>
              <h1 className="mt-3 text-4xl font-extrabold tracking-tight">
                Siapkan sistem sesuai cara jual toko Anda
              </h1>
              <p className="mt-4 text-sm leading-7 text-blue-100/90">
                Kami bantu atur alur dasar terlebih dahulu, supaya saat masuk ke kasir, produk,
                stok, dan kategori sudah terasa masuk akal untuk bisnis Anda.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {onboardingSteps.map((step, index) => (
                <StepChip
                  key={step.id}
                  index={index}
                  title={step.title}
                  active={currentStep === index}
                  completed={currentStep > index}
                />
              ))}
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5 text-sm text-blue-50/90">
              <p className="font-semibold text-white">Kenapa ada tahap awal ini?</p>
              <p className="mt-2 leading-7">
                Karena setiap toko punya cara jual yang berbeda. Dengan memilih model bisnis dan
                tipe stok dari awal, sistem tidak akan terasa membingungkan saat mulai dipakai.
              </p>
              <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.16em] text-blue-50/85">
                Setup ini hanya muncul sekali saat pertama kali menggunakan sistem.
              </p>
            </div>

            {currentStep === onboardingSteps.length - 1 ? (
              <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100/90">
                  Preview Hasil Setup
                </p>
                <p className="mt-3 text-xl font-extrabold tracking-tight text-white">
                  {form.businessType}
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-100/85">
                  VIGO POS akan menyiapkan kategori awal, model stok, dan login pertama sesuai
                  pilihan yang sedang Anda isi.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                      Kategori Awal
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-white">{previewCategories.length}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                      Model Jual
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-white">
                      {Math.max(form.stockTypesManaged.length, 1)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-100/80">
                      Login Awal
                    </p>
                    <p className="mt-2 text-2xl font-extrabold text-white">1234</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Butuh bantuan cepat?</p>
                    <p className="mt-1 text-sm leading-6 text-blue-100/85">
                      Kami bantu pilih jenis usaha dan model stok yang paling pas.
                    </p>
                  </div>
                </div>

                <a
                  href={supportLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-100"
                >
                  <MessageCircle className="h-4 w-4" />
                  Hubungi Bantuan via WhatsApp
                </a>
              </div>
            )}
          </aside>

          <div className="p-8 lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                Langkah {currentStep + 1} dari {onboardingSteps.length}
              </p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                {onboardingSteps[currentStep].title}
              </h2>
              <p className="mt-3 text-base text-slate-500">
                {onboardingSteps[currentStep].subtitle}
              </p>
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-500">Estimasi waktu sekitar 2 menit</span>
                  <span className="font-semibold text-slate-700">{Math.round(progressValue)}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              {currentStep === 0 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {introHighlights.map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <p className="mt-4 text-lg font-bold text-slate-900">{item.title}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Apa yang akan Anda lakukan di sini</p>
                        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                          <p>1. Tentukan jenis usaha yang paling mirip dengan toko Anda.</p>
                          <p>2. Pilih cara jual atau tipe stok yang benar.</p>
                          <p>3. Lengkapi nama toko dan nomor WhatsApp.</p>
                          <p>4. Setelah selesai, Anda akan diarahkan ke layar login PIN pertama.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Pilih jenis usaha yang paling mendekati bisnis Anda sekarang. Pilihan ini akan
                    membantu VIGO POS menyiapkan kategori awal agar input produk nanti lebih cepat
                    dan tidak membingungkan.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {BUSINESS_TYPES.map((type) => (
                      <BusinessTypeCard
                        key={type}
                        type={type}
                        selected={form.businessType === type}
                        categoryCount={getPreviewCategoriesForType(type).length}
                        onSelect={() =>
                          setForm((current) => ({
                            ...current,
                            businessType: type,
                          }))
                        }
                      />
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-5">
                    <p className="font-semibold text-blue-800">Kategori yang akan disiapkan</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {previewCategories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Centang semua model penjualan yang memang dipakai di toko Anda. Ini membantu
                    sistem menampilkan opsi produk dan stok yang benar saat Anda mulai input data.
                    Pilihan ini bisa diubah lagi nanti dari pengaturan toko.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {STOCK_TYPE_OPTIONS.map((option) => {
                      const active = form.stockTypesManaged.includes(option.id)
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              stockTypesManaged: active
                                ? current.stockTypesManaged.filter((item) => item !== option.id)
                                : [...current.stockTypesManaged, option.id],
                            }))
                          }
                          className={`rounded-[28px] border px-5 py-5 text-left transition ${
                            active
                              ? 'border-blue-600 bg-blue-50 shadow-[0_12px_30px_rgba(29,78,216,0.12)]'
                              : 'border-slate-200 bg-white hover:border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p
                                className={`text-lg font-bold ${
                                  active ? 'text-blue-700' : 'text-slate-900'
                                }`}
                              >
                                {option.label}
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-500">
                                {stockOptionMap[option.id]}
                              </p>
                            </div>
                            <div
                              className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                active
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white text-transparent'
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Pilihan aktif saat ini</p>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {form.stockTypesManaged.length > 0
                            ? form.stockTypesManaged
                                .map(
                                  (stockTypeId) =>
                                    STOCK_TYPE_OPTIONS.find((item) => item.id === stockTypeId)
                                      ?.label || stockTypeId,
                                )
                                .join(', ')
                            : 'Belum ada tipe stok yang dipilih.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
                    <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      {form.logo ? (
                        <img
                          src={form.logo}
                          alt="Logo toko"
                          className="h-36 w-36 rounded-full object-cover"
                        />
                      ) : (
                        <>
                          <ImagePlus className="h-12 w-12 text-slate-400" />
                          <p className="mt-3 text-lg font-semibold text-slate-700">Logo toko</p>
                          <p className="text-sm text-slate-500">Opsional, format JPG / PNG</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="form-label">Nama Toko</label>
                        <input
                          className="form-input"
                          placeholder="Contoh: Toko Sinar Jaya"
                          value={form.storeName}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              storeName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="form-label">WhatsApp</label>
                        <input
                          className="form-input"
                          placeholder="08xx xxxx xxxx"
                          value={form.whatsapp}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              whatsapp: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Alamat Toko</label>
                        <textarea
                          className="form-textarea"
                          placeholder="Alamat lengkap toko"
                          value={form.address}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              address: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
                    <p className="font-semibold text-emerald-800">Yang akan terjadi setelah ini</p>
                    <div className="mt-3 space-y-2 text-sm leading-7 text-emerald-800/85">
                      <p>1. Toko Anda dibuat dengan kategori awal sesuai pilihan usaha.</p>
                      <p>2. Sistem siap dipakai tanpa perlu membuat akun email terlebih dahulu.</p>
                      <p>3. Anda akan dibawa ke layar login dengan PIN awal <span className="font-bold">1234</span>.</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,#eff6ff,#ffffff)] p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-900">Ringkasan pilihan Anda</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          Setelah Anda menekan simpan, VIGO POS akan memakai pengaturan ini sebagai
                          fondasi awal sistem. Semua pilihan tetap bisa diubah nanti dari halaman
                          Pengaturan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="rounded-[28px]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Profil Toko
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">
                            {form.storeName || 'Nama toko belum diisi'}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            {form.address || 'Alamat toko belum diisi'}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Phone className="h-4 w-4 text-blue-700" />
                            {form.whatsapp || 'WhatsApp belum diisi'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-[28px]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <Tags className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                            Jenis Usaha
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{form.businessType}</p>
                          <p className="mt-2 text-sm leading-7 text-slate-500">
                            {businessTypeDescriptions[form.businessType]}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {previewCategories.map((category) => (
                          <span
                            key={category}
                            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-100"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card className="rounded-[28px]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Cara Jual Produk yang Aktif
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {selectedStockTypes.length > 0
                            ? `${selectedStockTypes.length} model dipakai`
                            : 'Belum ada pilihan'}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          Ini menentukan opsi produk yang akan sering Anda pakai saat menambah
                          barang atau layanan baru ke sistem.
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {selectedStockTypes.map((type) => (
                        <div
                          key={type}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                        >
                          <p className="font-semibold text-slate-900">{type}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {stockOptionMap[
                              STOCK_TYPE_OPTIONS.find((item) => item.label === type)?.id || ''
                            ] || `${humanizeProductType(type)} siap dipakai.`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <p className="font-semibold text-slate-900">Setelah login pertama, saya sarankan lanjut ke:</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="font-semibold text-slate-900">1. Ganti PIN default</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Agar akses kasir lebih aman.</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="font-semibold text-slate-900">2. Tambah produk pertama</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Mulai isi katalog sesuai barang yang dijual.</p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                        <p className="font-semibold text-slate-900">3. Coba transaksi pertama</p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">Pastikan alur kasir terasa pas untuk toko Anda.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="soft-divider my-8" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" size="lg" onClick={() => handleSubmit(true)}>
                Pakai Pengaturan Cepat
              </Button>

              <div className="flex flex-wrap gap-3">
                {currentStep > 0 ? (
                  <Button variant="secondary" size="lg" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                ) : null}

                {currentStep < onboardingSteps.length - 1 ? (
                  <Button size="lg" onClick={goNext}>
                    Lanjut
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => handleSubmit(false)}>
                    Simpan dan Lanjut ke PIN
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SetupPage
