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

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kasir', href: '/kasir', icon: ShoppingCart },
  { label: 'Produk', href: '/produk', icon: PackageSearch },
  { label: 'Stok', href: '/stok', icon: Boxes },
  { label: 'Transaksi', href: '/transaksi', icon: ReceiptText },
  { label: 'Laporan', href: '/laporan', icon: BarChart3 },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
]

function Sidebar({ storeSettings }) {
  return (
    <aside className="border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-72">
      <div className="flex h-20 items-center gap-4 border-b border-slate-200 px-6">
        <VigoLogo size="md" />
        <div>
          <p className="text-3xl font-extrabold tracking-tight text-blue-700">VIGO POS</p>
          <p className="text-xs text-slate-400">POS ringan untuk usaha kecil</p>
        </div>
      </div>

      <div className="flex h-[calc(100%-80px)] flex-col justify-between px-4 py-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition',
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-[inset_4px_0_0_0_#2563eb]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
              {getInitials(storeSettings?.storeName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{storeSettings?.storeName || 'Toko Anda'}</p>
              <p className="text-sm text-slate-500">{storeSettings?.cashierName || 'Admin'}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
