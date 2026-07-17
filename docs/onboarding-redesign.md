# VIGO POS — Onboarding redesign

## Struktur flow

1. Welcome — value proposition, estimasi ±3 menit, dan satu CTA.
2. Jenis usaha — enam visual selection cards.
3. Operasional — metode penjualan tunggal dan opsi stok multi-select.
4. Informasi toko — form dua kolom dengan validasi realtime.
5. Review — ringkasan yang dapat diedit per bagian.
6. Success — konfirmasi setup dan CTA langsung ke dashboard.

## Wireframe tingkat tinggi

```text
┌─────────────────────────────────────────────────────────┐
│ Logo + Persiapan toko        Autosave      ± waktu      │
├─────────────────────────────────────────────────────────┤
│ Progress: Langkah n/4  ━━━━━━━━━━━━━━━  25–100%         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Eyebrow                                                │
│  Judul langkah                                          │
│  Microcopy singkat                                      │
│                                                         │
│  [ Card / Field ] [ Card / Field ] [ Card ]             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ← Kembali                              Lanjut →         │
└─────────────────────────────────────────────────────────┘
```

Pada mobile, grid menjadi satu kolom dan footer tetap menempel di bawah. Header progress disederhanakan tanpa menghilangkan persentase.

## Komponen

- `OnboardingShell`: header, progress, estimasi waktu, autosave status, sticky navigation.
- `WelcomeStep`: entry point dan dashboard preview.
- `BusinessStep`: accessible visual radio cards.
- `OperationsStep`: radio dan checkbox cards.
- `StoreStep`: form dua kolom, logo, dan feedback realtime.
- `ReviewStep`: summary cards dengan deep edit.
- `SuccessStep`: completion state dan handoff ke dashboard.

State form dikelola React Hook Form + Zod. Draft disimpan secara debounced ke `localStorage`; animasi 150–250 ms menggunakan Framer Motion.
