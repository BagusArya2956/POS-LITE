import { useEffect, useRef, useState } from 'react'
import {
  Boxes,
  CreditCard,
  Database,
  Download,
  KeyRound,
  Save,
  Store,
  Trash2,
  Upload,
} from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { usePos } from '../context/PosContext.jsx'
import { readFileAsDataUrl, readFileAsJson } from '../lib/helpers.js'

const settingsSections = [
  { id: 'store', label: 'Store profile', description: 'Identity and receipt', icon: Store },
  { id: 'inventory', label: 'Inventory preferences', description: 'Product and stock defaults', icon: Boxes },
  { id: 'security', label: 'Access & security', description: 'Sign-in PIN', icon: KeyRound },
  { id: 'payments', label: 'Payments', description: 'Checkout methods', icon: CreditCard },
  { id: 'data', label: 'Data & backup', description: 'Storage and recovery', icon: Database },
]

const paymentOptions = [
  { key: 'cash', label: 'Cash', description: 'Accept payment at the register' },
  { key: 'qris', label: 'QRIS', description: 'Accept QR-based payments' },
  { key: 'transfer', label: 'Bank transfer', description: 'Record manual bank transfers' },
]

function buildProfileForm(storeSettings) {
  return {
    storeName: storeSettings?.storeName || '',
    address: storeSettings?.address || '',
    whatsapp: storeSettings?.whatsapp || '',
    logo: storeSettings?.logo || '',
    receiptName: storeSettings?.receiptName || '',
    receiptAddress: storeSettings?.receiptAddress || '',
    receiptWhatsApp: storeSettings?.receiptWhatsApp || '',
    receiptFooter: storeSettings?.receiptFooter || '',
  }
}

function buildInventoryForm(storeSettings) {
  return {
    defaultUnitId: storeSettings?.inventoryPreferences?.defaultUnitId || '',
    defaultMinimumStock: storeSettings?.inventoryPreferences?.defaultMinimumStock ?? 5,
    autoGenerateSku: storeSettings?.inventoryPreferences?.autoGenerateSku ?? true,
    allowOverselling: storeSettings?.inventoryPreferences?.allowOverselling ?? false,
  }
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.025em] text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

function SettingsPage() {
  const {
    database,
    syncStatus,
    updateStoreSettings,
    updateInventoryPreferences,
    updatePin,
    updatePaymentMethods,
    downloadBackup,
    exportAllData,
    restoreBackup,
    resetLocalSetup,
  } = usePos()

  const [activeSection, setActiveSection] = useState('store')
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(database.storeSettings))
  const [inventoryForm, setInventoryForm] = useState(() =>
    buildInventoryForm(database.storeSettings),
  )
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' })
  const backupInputRef = useRef(null)

  useEffect(() => {
    setProfileForm(buildProfileForm(database.storeSettings))
    setInventoryForm(buildInventoryForm(database.storeSettings))
  }, [database.storeSettings])

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const logo = await readFileAsDataUrl(file)
    setProfileForm((current) => ({ ...current, logo }))
  }

  function handleSaveProfile() {
    updateStoreSettings(profileForm)
  }

  async function handleRestoreBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsed = await readFileAsJson(file)
      const result = restoreBackup(parsed)
      if (result?.ok) {
        setPinForm({ newPin: '', confirmPin: '' })
      }
    } catch {
      window.alert('Invalid backup file. Make sure the JSON format is correct.')
    } finally {
      event.target.value = ''
    }
  }

  function handleSaveInventoryPreferences() {
    updateInventoryPreferences(inventoryForm)
  }

  function handleChangePin() {
    if (!/^\d{4}$/.test(pinForm.newPin)) {
      window.alert('The new PIN must contain 4 digits.')
      return
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      window.alert('PIN confirmation does not match.')
      return
    }
    updatePin(pinForm.newPin)
    setPinForm({ newPin: '', confirmPin: '' })
  }

  function handleResetLocalSetup() {
    const approved = window.confirm(
      'Restarting setup will delete local data in this browser and return you to the beginning. Download a JSON backup first if you want to keep your data. Continue?',
    )
    if (!approved) return
    const result = resetLocalSetup()
    if (!result?.ok && result?.message) window.alert(result.message)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-28 xl:h-fit">
        <nav className="flex gap-2 overflow-x-auto rounded-[18px] border border-slate-200 bg-white p-2 shadow-sm xl:block xl:space-y-1" aria-label="Settings sections">
          {settingsSections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition xl:w-full ${active ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>
                  <span className="block whitespace-nowrap text-sm font-semibold">{section.label}</span>
                  <span className={`mt-0.5 hidden text-xs xl:block ${active ? 'text-slate-400' : 'text-slate-400'}`}>{section.description}</span>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        {activeSection === 'store' ? (
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Store profile"
              description="Information shown across the app and on customer receipts."
              action={<Button onClick={handleSaveProfile}><Save className="h-4 w-4" /> Save profile</Button>}
            />
            <div className="grid gap-7 px-5 py-6 lg:grid-cols-[170px_minmax(0,1fr)] lg:px-7">
              <div>
                <p className="form-label">Store logo</p>
                <label className="flex aspect-square max-w-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  {profileForm.logo ? (
                    <img src={profileForm.logo} alt="Store logo" className="h-full w-full object-cover" />
                  ) : (
                    <><Upload className="h-6 w-6 text-slate-400" /><span className="mt-2 text-xs font-medium text-slate-500">Upload logo</span></>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="mt-2 text-xs leading-5 text-slate-400">Square PNG or JPG works best.</p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="form-label">Store name</label>
                  <input className="form-input" value={profileForm.storeName} onChange={(event) => setProfileForm((current) => ({ ...current, storeName: event.target.value, receiptName: event.target.value }))} />
                </div>
                <div>
                  <label className="form-label">WhatsApp number</label>
                  <input className="form-input" value={profileForm.whatsapp} onChange={(event) => setProfileForm((current) => ({ ...current, whatsapp: event.target.value, receiptWhatsApp: event.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Store address</label>
                  <textarea className="form-textarea" value={profileForm.address} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value, receiptAddress: event.target.value }))} />
                </div>
                <div className="md:col-span-2 border-t border-slate-100 pt-5">
                  <label className="form-label">Receipt footer</label>
                  <textarea className="form-textarea" value={profileForm.receiptFooter} onChange={(event) => setProfileForm((current) => ({ ...current, receiptFooter: event.target.value }))} />
                  <p className="mt-2 text-xs text-slate-400">Printed at the bottom of every receipt.</p>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === 'inventory' ? (
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Inventory preferences"
              description="Set the defaults used when staff create products and sell tracked inventory."
              action={<Button onClick={handleSaveInventoryPreferences}><Save className="h-4 w-4" /> Save preferences</Button>}
            />
            <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="p-5 lg:p-7">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">New product defaults</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Pre-fill common values to make product entry faster and more consistent.
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="form-label">Default sales unit</label>
                    <select
                      className="form-select"
                      value={inventoryForm.defaultUnitId}
                      onChange={(event) =>
                        setInventoryForm((current) => ({
                          ...current,
                          defaultUnitId: event.target.value,
                        }))
                      }
                    >
                      <option value="">No default unit</option>
                      {database.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      Staff can still choose a different unit for individual products.
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Default low-stock threshold</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-input"
                      value={inventoryForm.defaultMinimumStock}
                      onChange={(event) =>
                        setInventoryForm((current) => ({
                          ...current,
                          defaultMinimumStock: event.target.value,
                        }))
                      }
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      New tracked products will use this alert level by default.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 lg:p-7">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Product and stock behavior</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Control how identifiers and insufficient stock are handled.
                  </p>
                </div>

                <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
                  <div className="flex min-h-24 items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Generate SKU automatically</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Create a VIGO SKU when the product SKU is left blank.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inventoryForm.autoGenerateSku}
                      onClick={() =>
                        setInventoryForm((current) => ({
                          ...current,
                          autoGenerateSku: !current.autoGenerateSku,
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${inventoryForm.autoGenerateSku ? 'bg-blue-600' : 'bg-slate-200'}`}
                      aria-label="Generate SKU automatically"
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${inventoryForm.autoGenerateSku ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex min-h-24 items-center justify-between gap-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Allow sales below zero stock</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Let checkout continue when tracked stock is insufficient.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={inventoryForm.allowOverselling}
                      onClick={() =>
                        setInventoryForm((current) => ({
                          ...current,
                          allowOverselling: !current.allowOverselling,
                        }))
                      }
                      className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${inventoryForm.allowOverselling ? 'bg-amber-500' : 'bg-slate-200'}`}
                      aria-label="Allow sales below zero stock"
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${inventoryForm.allowOverselling ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                {inventoryForm.allowOverselling ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    Stock may become negative. Use this only when inventory is reconciled after sales.
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeSection === 'security' ? (
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Access & security" description="Protect the register with a four-digit staff PIN." />
            <div className="max-w-2xl px-5 py-7 lg:px-7">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm leading-6 text-blue-800">
                Staff will use this PIN every time they sign in. Choose a code that is easy for your team to remember but difficult for customers to guess.
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div><label className="form-label">New PIN</label><input type="password" className="form-input" maxLength="4" inputMode="numeric" autoComplete="new-password" value={pinForm.newPin} onChange={(event) => setPinForm((current) => ({ ...current, newPin: event.target.value.replace(/\D/g, '').slice(0, 4) }))} /></div>
                <div><label className="form-label">Confirm PIN</label><input type="password" className="form-input" maxLength="4" inputMode="numeric" autoComplete="new-password" value={pinForm.confirmPin} onChange={(event) => setPinForm((current) => ({ ...current, confirmPin: event.target.value.replace(/\D/g, '').slice(0, 4) }))} /></div>
              </div>
              <Button className="mt-5" onClick={handleChangePin}>Update PIN</Button>
            </div>
          </section>
        ) : null}

        {activeSection === 'payments' ? (
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Payment methods" description="Choose the options available to staff during checkout." />
            <div className="divide-y divide-slate-100 px-5 lg:px-7">
              {paymentOptions.map((method) => {
                const enabled = Boolean(database.storeSettings?.paymentMethods?.[method.key])
                return (
                  <div key={method.key} className="flex min-h-20 items-center justify-between gap-6 py-4">
                    <div><p className="text-sm font-semibold text-slate-900">{method.label}</p><p className="mt-1 text-sm text-slate-400">{method.description}</p></div>
                    <button type="button" role="switch" aria-checked={enabled} onClick={() => updatePaymentMethods({ [method.key]: !enabled })} className={`relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${enabled ? 'bg-blue-600' : 'bg-slate-200'}`} aria-label={`${enabled ? 'Disable' : 'Enable'} ${method.label}`}>
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${enabled ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {activeSection === 'data' ? (
          <section className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <SectionHeader title="Data & backup" description="Review storage status, export records, or restore a backup." />
            <div className="space-y-7 px-5 py-6 lg:px-7">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-sm font-semibold text-slate-900">{syncStatus.label}</p><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{syncStatus.description}</p></div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${syncStatus.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : syncStatus.status === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                    {syncStatus.status === 'connected' ? 'Cloud connected' : syncStatus.status === 'syncing' ? 'Saving' : syncStatus.status === 'connecting' ? 'Connecting' : syncStatus.status === 'error' ? 'Connection error' : 'Local storage'}
                  </span>
                </div>
                {syncStatus.lastSyncedAt ? <p className="mt-3 text-xs text-slate-400">Last synced: {new Date(syncStatus.lastSyncedAt).toLocaleString('en-US')}</p> : null}
                {syncStatus.error ? <p className="mt-3 text-sm text-rose-600">{syncStatus.error}</p> : null}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">Backup and export</h3>
                <p className="mt-1 text-sm text-slate-400">Keep a copy before moving devices or making major changes.</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={downloadBackup}><Download className="h-4 w-4" /> Download backup</Button>
                  <Button variant="secondary" onClick={() => backupInputRef.current?.click()}><Upload className="h-4 w-4" /> Restore backup</Button>
                  <Button variant="secondary" onClick={exportAllData}>Export transactions</Button>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-6">
                <h3 className="text-sm font-semibold text-rose-700">Danger zone</h3>
                <div className="mt-3 flex flex-col gap-4 rounded-xl border border-rose-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-semibold text-slate-900">Restart local setup</p><p className="mt-1 text-sm leading-6 text-slate-500">Deletes local data and returns this browser to onboarding.</p></div>
                  <Button variant="danger" size="sm" onClick={handleResetLocalSetup} disabled={syncStatus.remoteEnabled}><Trash2 className="h-4 w-4" /> Restart setup</Button>
                </div>
                {syncStatus.remoteEnabled ? <p className="mt-2 text-xs text-slate-400">Reset is unavailable while cloud storage is active.</p> : null}
              </div>

              <input ref={backupInputRef} type="file" accept="application/json" className="hidden" onChange={handleRestoreBackup} />
            </div>
          </section>
        ) : null}
      </div>

    </div>
  )
}

export default SettingsPage
