import { useEffect, useRef, useState } from 'react'
import { Download, Plus, Save, Shield, Store, Trash2, Upload } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import Modal from '../components/ui/Modal.jsx'
import { usePos } from '../context/PosContext.jsx'
import { readFileAsDataUrl, readFileAsJson } from '../lib/helpers.js'

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

function SettingsPage() {
  const {
    database,
    syncStatus,
    updateStoreSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    addUnit,
    deleteUnit,
    updatePin,
    updatePaymentMethods,
    downloadBackup,
    exportAllData,
    restoreBackup,
    resetLocalSetup,
  } = usePos()

  const [profileForm, setProfileForm] = useState(() => buildProfileForm(database.storeSettings))
  const [categoryModal, setCategoryModal] = useState({ open: false, id: '', name: '' })
  const [unitName, setUnitName] = useState('')
  const [pinForm, setPinForm] = useState({ newPin: '', confirmPin: '' })
  const backupInputRef = useRef(null)

  useEffect(() => {
    setProfileForm(buildProfileForm(database.storeSettings))
  }, [database.storeSettings])

  async function handleLogoChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const logo = await readFileAsDataUrl(file)
    setProfileForm((current) => ({
      ...current,
      logo,
    }))
  }

  function handleSaveProfile() {
    updateStoreSettings(profileForm)
  }

  async function handleRestoreBackup(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const parsed = await readFileAsJson(file)
      const result = restoreBackup(parsed)
      if (result?.ok) {
        setCategoryModal({ open: false, id: '', name: '' })
        setPinForm({ newPin: '', confirmPin: '' })
        setUnitName('')
      }
    } catch {
      window.alert('File backup tidak valid. Pastikan format JSON benar.')
    } finally {
      event.target.value = ''
    }
  }

  function handleSaveCategory() {
    const action = categoryModal.id ? updateCategory(categoryModal.id, categoryModal.name) : addCategory(categoryModal.name)
    if (!action.ok) {
      window.alert(action.message)
      return
    }

    setCategoryModal({ open: false, id: '', name: '' })
  }

  function handleAddUnit() {
    const result = addUnit(unitName)
    if (!result.ok) {
      window.alert(result.message)
      return
    }

    setUnitName('')
  }

  function handleChangePin() {
    if (!/^\d{4}$/.test(pinForm.newPin)) {
      window.alert('PIN baru harus terdiri dari 4 digit angka.')
      return
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      window.alert('Konfirmasi PIN belum sama.')
      return
    }

    updatePin(pinForm.newPin)
    setPinForm({ newPin: '', confirmPin: '' })
  }

  function handleResetLocalSetup() {
    const approved = window.confirm(
      'Mulai ulang setup akan menghapus data lokal di browser ini dan membawa Anda kembali ke tahap awal. Sebaiknya unduh backup JSON dulu jika data masih ingin disimpan. Lanjutkan?',
    )

    if (!approved) {
      return
    }

    const result = resetLocalSetup()
    if (!result?.ok && result?.message) {
      window.alert(result.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSaveProfile}>
          <Save className="h-4 w-4" />
          Simpan Perubahan
        </Button>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="section-title text-[1.8rem]">Profil Toko & Pengaturan Struk</h2>
            <p className="section-subtitle mt-1">Atur identitas toko yang tampil di aplikasi dan struk.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.55fr_1.45fr]">
          <label className="flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6">
            {profileForm.logo ? (
              <img src={profileForm.logo} alt="Logo toko" className="h-40 w-40 rounded-full object-cover" />
            ) : (
              <>
                <Upload className="h-10 w-10 text-slate-400" />
                <p className="mt-3 font-semibold text-slate-700">Unggah logo toko</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">Nama Toko</label>
              <input
                className="form-input"
                value={profileForm.storeName}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    storeName: event.target.value,
                    receiptName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="form-label">Nomor WhatsApp</label>
              <input
                className="form-input"
                value={profileForm.whatsapp}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    whatsapp: event.target.value,
                    receiptWhatsApp: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Alamat Lengkap</label>
              <textarea
                className="form-textarea"
                value={profileForm.address}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    address: event.target.value,
                    receiptAddress: event.target.value,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Catatan Bawah Struk</label>
              <textarea
                className="form-textarea"
                value={profileForm.receiptFooter}
                onChange={(event) =>
                  setProfileForm((current) => ({
                    ...current,
                    receiptFooter: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Kategori Produk</h2>
            <Button
              variant="secondary"
              onClick={() => setCategoryModal({ open: true, id: '', name: '' })}
            >
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {database.categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
              >
                <p className="font-semibold text-slate-900">{category.name}</p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setCategoryModal({
                        open: true,
                        id: category.id,
                        name: category.name,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Hapus kategori ${category.name}?`)) {
                        const result = deleteCategory(category.id)
                        if (!result.ok) {
                          window.alert(result.message)
                        }
                      }
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Satuan Jual</h2>
          </div>
          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <input
              className="form-input"
              placeholder="Tambah satuan baru"
              value={unitName}
              onChange={(event) => setUnitName(event.target.value)}
            />
            <Button variant="secondary" onClick={handleAddUnit}>
              <Plus className="h-4 w-4" />
              Tambah
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {database.units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
              >
                <p className="font-semibold text-slate-900">{unit.name}</p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Hapus satuan ${unit.name}?`)) {
                      const result = deleteUnit(unit.id)
                      if (!result.ok) {
                        window.alert(result.message)
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="section-title text-[1.8rem]">PIN Masuk</h2>
              <p className="section-subtitle mt-1">
                Gunakan PIN 4 digit untuk mengamankan akses ke layar kasir.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="form-label">PIN baru</label>
              <input
                className="form-input"
                maxLength="4"
                inputMode="numeric"
                value={pinForm.newPin}
                onChange={(event) =>
                  setPinForm((current) => ({
                    ...current,
                    newPin: event.target.value.replace(/\D/g, '').slice(0, 4),
                  }))
                }
              />
            </div>
            <div>
              <label className="form-label">Konfirmasi PIN</label>
              <input
                className="form-input"
                maxLength="4"
                inputMode="numeric"
                value={pinForm.confirmPin}
                onChange={(event) =>
                  setPinForm((current) => ({
                    ...current,
                    confirmPin: event.target.value.replace(/\D/g, '').slice(0, 4),
                  }))
                }
              />
            </div>
          </div>
          <Button className="mt-5" onClick={handleChangePin}>
            Ubah PIN
          </Button>
        </Card>

        <Card>
          <h2 className="section-title text-[1.8rem]">Metode Pembayaran & Backup</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-semibold text-slate-900">Mode penyimpanan aktif</p>
            <p className="mt-1 text-sm text-slate-600">{syncStatus.label}</p>
            <p className="mt-1 text-sm text-slate-500">{syncStatus.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className={`rounded-full px-3 py-1 ${
                  syncStatus.status === 'connected'
                    ? 'bg-emerald-100 text-emerald-700'
                    : syncStatus.status === 'syncing' || syncStatus.status === 'connecting'
                      ? 'bg-amber-100 text-amber-700'
                      : syncStatus.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-700'
                }`}
              >
                {syncStatus.status === 'connected'
                  ? 'Supabase aktif'
                  : syncStatus.status === 'syncing'
                    ? 'Menyimpan ke cloud'
                    : syncStatus.status === 'connecting'
                      ? 'Menghubungkan cloud'
                      : syncStatus.status === 'error'
                        ? 'Cloud bermasalah'
                        : 'Mode lokal'}
              </span>
              {syncStatus.lastSyncedAt ? (
                <span className="text-slate-500">
                  Sinkron terakhir: {new Date(syncStatus.lastSyncedAt).toLocaleString('id-ID')}
                </span>
              ) : null}
            </div>
            {syncStatus.error ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700">
                {syncStatus.error}
              </p>
            ) : null}
          </div>
          <div className="mt-6 space-y-4">
            {[
              { key: 'cash', label: 'Tunai' },
              { key: 'qris', label: 'QRIS' },
              { key: 'transfer', label: 'Transfer' },
            ].map((method) => (
              <label
                key={method.key}
                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{method.label}</p>
                  <p className="text-sm text-slate-500">Tampilkan di halaman kasir</p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-300 text-blue-700"
                  checked={Boolean(database.storeSettings?.paymentMethods?.[method.key])}
                  onChange={(event) =>
                    updatePaymentMethods({
                      [method.key]: event.target.checked,
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <Button variant="secondary" onClick={downloadBackup}>
              <Download className="h-4 w-4" />
              Unduh Backup JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => backupInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Pulihkan dari JSON
            </Button>
          </div>
          <Button className="mt-3" onClick={exportAllData}>
            Export Semua Data
          </Button>
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-900">Lihat tahap awal lagi</p>
            <p className="mt-1 text-sm leading-6 text-amber-800/85">
              Jika Anda ingin kembali ke onboarding pertama dan menguji flow dari nol, gunakan reset
              lokal ini. Data di browser ini akan dihapus, lalu aplikasi kembali ke tahap setup.
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={handleResetLocalSetup}
              disabled={syncStatus.remoteEnabled}
            >
              <Trash2 className="h-4 w-4" />
              Mulai Ulang Setup Lokal
            </Button>
            {syncStatus.remoteEnabled ? (
              <p className="mt-2 text-xs font-medium text-amber-900/80">
                Tombol ini dimatikan saat mode cloud aktif agar data staging tidak ikut ter-reset.
              </p>
            ) : null}
          </div>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleRestoreBackup}
          />
        </Card>
      </div>

      <Modal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, id: '', name: '' })}
        title={categoryModal.id ? 'Edit Kategori' : 'Tambah Kategori'}
        className="max-w-xl"
      >
        <div className="space-y-5">
          <div>
            <label className="form-label">Nama kategori</label>
            <input
              className="form-input"
              value={categoryModal.name}
              onChange={(event) =>
                setCategoryModal((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCategoryModal({ open: false, id: '', name: '' })}>
              Batal
            </Button>
            <Button onClick={handleSaveCategory}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsPage
