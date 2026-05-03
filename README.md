# VIGO POS

VIGO POS adalah aplikasi kasir dan inventori ringan berbasis React + Vite untuk satu pemilik usaha kecil. Saat ini aplikasi mendukung mode penyimpanan lokal browser dan siap disambungkan ke Supabase staging.

## Menjalankan project

```bash
npm install
npm run dev
```

Untuk build produksi:

```bash
npm run build
```

## Mode penyimpanan

Secara default aplikasi berjalan di mode lokal browser.

Salin `.env.example` menjadi `.env.local`, lalu pilih mode yang diinginkan:

```env
VITE_APP_MODE=local
VITE_DATA_PROVIDER=local
```

Jika ingin mencoba Supabase staging:

```env
VITE_APP_MODE=staging
VITE_DATA_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_STATE_TABLE=vigo_pos_state
VITE_SUPABASE_INSTANCE_KEY=vigo-pos-staging
```

## Menyiapkan Supabase staging

1. Buat project Supabase khusus testing/staging.
2. Buka SQL Editor di Supabase.
3. Jalankan isi file `supabase/staging-schema.sql`.
4. Isi `.env.local` dengan URL dan anon key project staging.
5. Restart dev server.

Catatan:
- Skema staging saat ini menyimpan satu blob JSON aplikasi supaya migrasi dari mode lokal aman dan cepat.
- Ini cocok untuk testing integrasi awal.
- Adapter cloud ini hanya aktif bila `VITE_APP_MODE=staging`.
- Untuk produksi final, saya sarankan nanti kita pindah ke skema tabel ter-normalisasi + auth + role akses.

## Status koneksi di aplikasi

Halaman `Pengaturan` sekarang menampilkan:
- mode penyimpanan aktif
- status sinkronisasi cloud
- waktu sinkron terakhir
- error koneksi jika Supabase belum siap

## QRIS Midtrans sandbox

VIGO POS sekarang punya alur QRIS sandbox-ready:
- buat QR dinamis dari total transaksi
- tampilkan QR ke pelanggan
- cek status pembayaran ke Midtrans
- simpan transaksi setelah status gateway berhasil

Tambahkan env ini di `.env.local` untuk mengaktifkannya:

```env
VITE_QRIS_ENABLED=true
VITE_QRIS_PROVIDER=midtrans
VITE_QRIS_MODE=sandbox
MIDTRANS_ENV=sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
```

Catatan:
- `MIDTRANS_SERVER_KEY` hanya dipakai di backend lokal `server/index.js`
- saat `npm run dev`, Vite dan API QRIS lokal jalan bersamaan
- bila env QRIS belum diisi, tombol QRIS tetap ada sebagai metode manual biasa

Sumber resmi:
- Midtrans QRIS overview: https://docs.midtrans.com/docs/qris-payment-method-in-midtrans
- Midtrans QRIS API reference: https://docs.midtrans.com/reference/qris
