import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { usePos } from './context/PosContext.jsx'

const AppShell = lazy(() => import('./components/layout/AppShell.jsx'))
const CashierPage = lazy(() => import('./pages/CashierPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'))
const ProductsPage = lazy(() => import('./pages/ProductsPage.jsx'))
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const SetupPage = lazy(() => import('./pages/SetupPage.jsx'))
const StockPage = lazy(() => import('./pages/StockPage.jsx'))
const TransactionsPage = lazy(() => import('./pages/TransactionsPage.jsx'))

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-600 shadow-sm">
        Memuat VIGO POS...
      </div>
    </div>
  )
}

function ProtectedApp() {
  return (
    <Suspense fallback={<AppLoading />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kasir" element={<CashierPage />} />
          <Route path="/produk" element={<ProductsPage />} />
          <Route path="/stok" element={<StockPage />} />
          <Route path="/transaksi" element={<TransactionsPage />} />
          <Route path="/laporan" element={<ReportsPage />} />
          <Route path="/pengaturan" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

function App() {
  const { hasStore, isAuthenticated } = usePos()

  if (!hasStore) {
    return (
      <Suspense fallback={<AppLoading />}>
        <SetupPage />
      </Suspense>
    )
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<AppLoading />}>
        <LoginPage />
      </Suspense>
    )
  }

  return <ProtectedApp />
}

export default App
