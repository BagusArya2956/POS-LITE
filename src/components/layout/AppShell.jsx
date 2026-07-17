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
    subtitle: 'Monitor sales, inventory, and recent transactions.',
  },
  '/kasir': {
    title: 'POS',
    subtitle: 'Process transactions quickly from a single screen.',
  },
  '/produk': {
    title: 'Products',
    subtitle: 'Manage your store catalog, pricing, and product status.',
  },
  '/stok': {
    title: 'Inventory',
    subtitle: 'Monitor inventory availability and adjustment history.',
  },
  '/transaksi': {
    title: 'Transactions',
    subtitle: 'View transaction history, receipts, and cancellations.',
  },
  '/laporan': {
    title: 'Reports',
    subtitle: 'Review revenue, profit, products, and payment performance.',
  },
  '/pengaturan': {
    title: 'Settings',
    subtitle: 'Manage store preferences, receipts, and operations.',
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
    'Hello, I need help using VIGO POS.',
  )

  const notificationItems = useMemo(() => {
    const items = []

    if (database.products.length === 0) {
      items.push({
        id: 'empty-products',
        tone: 'info',
        title: 'Your catalog is empty',
        description: 'Add your first product to start using the POS.',
        actionLabel: 'Open Products',
        href: '/produk',
      })
    }

    if (metrics.lowStockCount > 0) {
      items.push({
        id: 'low-stock',
        tone: 'warning',
        title: `${metrics.lowStockCount} inventory ${metrics.lowStockCount === 1 ? 'item needs' : 'items need'} attention`,
        description: 'Some items have reached their minimum stock level.',
        actionLabel: 'View Inventory',
        href: '/stok',
      })
    }

    if (metrics.transactionCountToday === 0) {
      items.push({
        id: 'no-sales-today',
        tone: 'info',
        title: 'No transactions yet today',
        description: 'Open the POS to start your first transaction today.',
        actionLabel: 'Open POS',
        href: '/kasir',
      })
    }

    if (!storeSettings?.address || !storeSettings?.whatsapp) {
      items.push({
        id: 'incomplete-profile',
        tone: 'warning',
        title: 'Store profile is incomplete',
        description: 'Add your address and WhatsApp number to complete receipts and support details.',
        actionLabel: 'Open Settings',
        href: '/pengaturan',
      })
    }

    if (activePaymentCount <= 1) {
      items.push({
        id: 'payment-methods',
        tone: 'info',
        title: 'Payment options are limited',
        description: 'Enable more than one payment method for greater flexibility.',
        actionLabel: 'Manage Payments',
        href: '/pengaturan',
      })
    }

    if (items.length === 0) {
      items.push({
        id: 'all-good',
        tone: 'success',
        title: 'Everything looks good',
        description: 'There are no important alerts. Your store is ready to operate.',
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
    notify('WhatsApp support opened', 'You will be redirected to the configured support number.', 'info')
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
                Store Open
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
                Log out
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
        title="Operational Notifications"
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
        title="Help Center"
        className="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">Need quick help?</p>
                <p className="mt-1 text-sm text-slate-600">
                  This button opens a WhatsApp chat with the configured support number.
                </p>
              </div>
              <Button onClick={openSupportChat}>
                <MessageCircleMore className="h-4 w-4" />
                Contact via WhatsApp
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">Recommended Help Topics</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => goToPage('/produk', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <PackagePlus className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Add your first product</p>
                <p className="mt-1 text-sm text-slate-500">
                  Ideal for new users preparing their catalog.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/kasir', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <ReceiptText className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Start a transaction</p>
                <p className="mt-1 text-sm text-slate-500">
                  A quick guide to selecting products and completing payment.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/pengaturan', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <Download className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Backup and restore</p>
                <p className="mt-1 text-sm text-slate-500">
                  Save a data backup and restore it when moving to another device.
                </p>
              </button>
              <button
                type="button"
                onClick={() => goToPage('/pengaturan', 'help')}
                className="rounded-3xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-slate-50"
              >
                <Settings2 className="h-6 w-6 text-blue-700" />
                <p className="mt-3 font-semibold text-slate-900">Manage store and payments</p>
                <p className="mt-1 text-sm text-slate-500">
                  Complete your store profile, PIN, payment methods, and receipt settings.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-slate-900">Most useful recommendations</p>
                <p className="mt-1 text-sm text-slate-600">
                  Use the bell for low-stock alerts, today's transactions,
                  an empty catalog, and incomplete store profiles. Use the help icon
                  for WhatsApp support, getting-started guides, and Settings shortcuts.
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
