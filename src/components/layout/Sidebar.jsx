import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  Settings,
  ShoppingCart,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { getInitials } from '../../lib/helpers.js'
import VigoLogo from '../brand/VigoLogo.jsx'

const menuGroups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Sell',
    items: [
      { label: 'Point of Sale', href: '/kasir', icon: ShoppingCart },
      { label: 'Transactions', href: '/transaksi', icon: ReceiptText },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Products', href: '/produk', icon: PackageSearch },
      { label: 'Inventory', href: '/stok', icon: Boxes },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Reports', href: '/laporan', icon: BarChart3 },
      { label: 'Settings', href: '/pengaturan', icon: Settings },
    ],
  },
]

function Sidebar({ storeSettings }) {
  return (
    <aside className="border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
      <div className="flex h-20 items-center gap-4 border-b border-slate-200 px-6">
        <VigoLogo size="md" />
        <div>
          <div className="flex items-baseline gap-2">
            <p className="font-brand text-[24px] font-extrabold leading-none tracking-[-0.065em] text-slate-950">vigo</p>
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">POS</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Point of sale platform</p>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)] flex-col justify-between px-4 py-6">
        <nav className="space-y-5" aria-label="Main navigation">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition',
                          isActive
                            ? 'bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_0_#2563eb]'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        ].join(' ')
                      }
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
              {getInitials(storeSettings?.storeName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{storeSettings?.storeName || 'Your Store'}</p>
              <p className="text-sm text-slate-500">{storeSettings?.cashierName || 'Admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
