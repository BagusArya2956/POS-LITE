import { useMemo, useState } from 'react'
import {
  Bell,
  CircleHelp,
  Download,
  LogOut,
  MessageCircleMore,
  PackagePlus,
  ReceiptText,
  Settings2,
  TriangleAlert,
} from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { formatDate } from '../../lib/format.js'
import { buildWhatsAppLink, getInitials } from '../../lib/helpers.js'
import { usePos } from '../../context/PosContext.jsx'
import { getDashboardMetrics } from '../../lib/selectors.js'
import Sidebar from './Sidebar.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'
import ToastStack from '../ui/ToastStack.jsx'

const pageTitles = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Pantau penjualan, stok, dan transaksi terbaru.',
  },
  '/kasir': {
    title: 'Kasir',
    subtitle: 'Layani transaksi dengan cepat dari satu layar.',
  },
  '/produk': {
    title: 'Produk',
    subtitle: 'Kelola katalog, harga, dan status produk toko.',
  },
  '/stok': {
    title: 'Stok',
    subtitle: 'Pantau ketersediaan dan riwayat perubahan stok.',
  },
  '/transaksi': {
    title: 'Transaksi',
    subtitle: 'Lihat histori transaksi, struk, dan pembatalan.',
  },
  '/laporan': {
    title: 'Laporan',
    subtitle: 'Ringkasan performa bisnis Anda hari ini.',
  },
  '/pengaturan': {
    title: 'Pengaturan',
    subtitle: 'Kelola preferensi toko, struk, dan sistem operasional.',
  },
}
const SUPPORT_WHATSAPP_NUMBER = '081353823867'

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { database, logout, notifications, removeNotification, notify } = usePos()
  const pageMeta = pageTitles[location.pathname] || pageTitles['/dashboard']
  const storeSettings = database.storeSettings
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const metrics = getDashboardMetrics(database)
  const activePaymentCount = Object.values(storeSettings?.paymentMethods || {}).filter(Boolean).length
  const supportLink = buildWhatsAppLink(
    SUPPORT_WHATSAPP_NUMBER,
    'Halo, saya butuh bantuan menggunakan VIGO POS.',
  )

  const notificationItems = useMemo(() => {
    const items = []

    if (database.products.length === 0) {
      items.push({
        id: 'empty-products',
        tone: 'info',
        title: 'Katalog masih kosong',
        description: 'Tambahkan produk pertama agar kasir bisa mulai dipakai.',
        actionLabel: 'Buka Produk',
        href: '/produk',
      })
    }

    if (metrics.lowStockCount > 0) {
      items.push({
        id: 'low-stock',
        tone: 'warning',
        title: `Ada ${metrics.lowStockCount} stok perlu dicek`,
        description: 'Beberapa item sudah mencapai batas minimum stok.',
        actionLabel: 'Lihat Stok',
        href: '/stok',
      })
    }

    if (metrics.transactionCountToday === 0) {
      items.push({
        id: 'no-sales-today',
        tone: 'info',
        title: 'Belum ada transaksi hari ini',
        description: 'Coba cek halaman kasir untuk mulai transaksi pertama hari ini.',
        actionLabel: 'Buka Kasir',
        href: '/kasir',
      })
    }

    if (!storeSettings?.address || !storeSettings?.whatsapp) {
      items.push({
        id: 'incomplete-profile',
        tone: 'warning',
        title: 'Profil toko belum lengkap',
        description: 'Lengkapi alamat dan WhatsApp agar struk dan bantuan lebih siap dipakai.',
        actionLabel: 'Buka Pengaturan',
        href: '/pengaturan',
      })
    }

    if (activePaymentCount <= 1) {
      items.push({
        id: 'payment-methods',
        tone: 'info',
        title: 'Metode pembayaran masih terbatas',
        description: 'Aktifkan lebih dari satu metode agar kasir lebih fleksibel.',
        actionLabel: 'Atur Pembayaran',
        href: '/pengaturan',
      })
    }

    if (items.length === 0) {
      items.push({
        id: 'all-good',
        tone: 'success',
        title: 'Semua terlihat rapi',
        description: 'Tidak ada catatan penting saat ini. Operasional toko siap berjalan.',
        actionLabel: '',
        href: '',
      })
    }

    return items
  }, [
    activePaymentCount,
    database.products.length,
    metrics.lowStockCount,
    metrics.transactionCountToday,
    storeSettings?.address,
    storeSettings?.whatsapp,
  ])

  const actionableNotificationCount = notificationItems.filter(
    (item) => item.tone !== 'success',
  ).length

  function openSupportChat() {
    window.open(supportLink, '_blank', 'noopener,noreferrer')
    notify('WhatsApp bantuan dibuka', 'Anda akan diarahkan ke nomor support yang sudah ditentukan.', 'info')
  }

  function goToPage(path, target = 'notifications') {
    if (target === 'notifications') {
      setNotificationsOpen(false)
    } else {
      setHelpOpen(false)
    }

    navigate(path)
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar storeSettings={storeSettings} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {pageMeta.title}
                </h1>
                <span className="hidden h-8 w-px bg-slate-200 lg:block" />
                <p className="hidden text-base text-slate-500 lg:block">{formatDate(new Date())}</p>
              </div>
              <p className="mt-1 text-sm text-slate-500">{pageMeta.subtitle}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-700"
              >
                <Bell className="h-5 w-5" />
                {actionableNotificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                    {actionableNotificationCount}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-500 transition hover:text-slate-700"
              >
                <CircleHelp className="h-5 w-5" />
              </button>
              <Badge tone="green" className="px-4 py-2 text-sm">
                Toko Buka
              </Badge>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
                onClick={() => navigate('/pengaturan')}
              >
                {getInitials(storeSettings?.storeName)}
              </button>
              <Button variant="secondary" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <Modal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifikasi Operasional"
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {notificationItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border p-4 ${
                item.tone === 'warning'
                  ? 'border-amber-200 bg-amber-50/70'
                  : item.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-blue-200 bg-blue-50/70'
              }`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
                {item.actionLabel ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => goToPage(item.href, 'notifications')}
                  >
                    {item.actionLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Pusat Bantuan"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">Butuh bantuan cepat?</p>
                <p className="mt-1 text-sm text-slate-600">
                  Tombol ini akan membuka WhatsApp bantuan ke nomor support yang sudah ditentukan.
                </p>
              </div>
              <Button onClick={openSupportChat}>
                <MessageCircleMore className="h-4 w-4" />
                Hubungi via WhatsApp
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Isi bantuan yang saya sarankan</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => goToPage('/produk', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <PackagePlus className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Tambah produk pertama</p>
                <p className="mt-1 text-sm text-slate-500">
                  Cocok untuk pengguna baru yang masih menyiapkan katalog.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/kasir', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <ReceiptText className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Mulai transaksi</p>
                <p className="mt-1 text-sm text-slate-500">
                  Panduan cepat untuk memilih produk dan menyelesaikan pembayaran.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/pengaturan', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <Download className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Backup dan restore</p>
                <p className="mt-1 text-sm text-slate-500">
                  Simpan cadangan data dan pulihkan jika Anda pindah perangkat.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/pengaturan', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <Settings2 className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Atur toko dan pembayaran</p>
                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi profil toko, PIN, metode pembayaran, dan pengaturan struk.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-slate-900">Saran pengisian yang paling berguna</p>
                <p className="mt-1 text-sm text-slate-600">
                  Untuk ikon lonceng, isi terbaik adalah notifikasi stok menipis, transaksi hari ini,
                  katalog kosong, dan profil toko yang belum lengkap. Untuk ikon bantuan, isi terbaik
                  adalah tombol WhatsApp bantuan, panduan langkah awal, dan shortcut ke Pengaturan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ToastStack notifications={notifications} onDismiss={removeNotification} />
    </div>
  )
}

export default AppShell
