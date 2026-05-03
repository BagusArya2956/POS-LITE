const APP_MODE_VALUES = new Set(['local', 'staging', 'production'])
const DATA_PROVIDER_VALUES = new Set(['local', 'supabase'])

function readEnv(name) {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function getAppMode() {
  const appMode = readEnv('VITE_APP_MODE').toLowerCase()
  return APP_MODE_VALUES.has(appMode) ? appMode : 'local'
}

export function getDataProvider() {
  const provider = readEnv('VITE_DATA_PROVIDER').toLowerCase()
  return DATA_PROVIDER_VALUES.has(provider) ? provider : 'local'
}

export function getSupabaseConfig() {
  return {
    url: readEnv('VITE_SUPABASE_URL'),
    anonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
    tableName: readEnv('VITE_SUPABASE_STATE_TABLE') || 'vigo_pos_state',
    instanceKey: readEnv('VITE_SUPABASE_INSTANCE_KEY') || 'vigo-pos-staging',
  }
}

export function hasSupabaseConfig() {
  const config = getSupabaseConfig()
  return Boolean(config.url && config.anonKey && config.tableName && config.instanceKey)
}

export function isSupabaseProviderEnabled() {
  return getDataProvider() === 'supabase' && getAppMode() === 'staging' && hasSupabaseConfig()
}

export function getPersistenceMeta() {
  const provider = getDataProvider()
  const appMode = getAppMode()
  const isSupabase = provider === 'supabase'

  if (!isSupabase) {
    return {
      appMode,
      provider,
      label: 'Browser lokal',
      description:
        'Data disimpan di browser ini saja. Cocok untuk revisi cepat dan uji coba fitur.',
      remoteEnabled: false,
      configured: false,
    }
  }

  if (appMode !== 'staging') {
    return {
      appMode,
      provider,
      label: 'Supabase belum diaktifkan',
      description:
        'Adapter cloud yang ada sekarang sengaja dibatasi untuk mode staging agar data produksi tidak tersentuh lebih awal.',
      remoteEnabled: false,
      configured: hasSupabaseConfig(),
    }
  }

  if (!hasSupabaseConfig()) {
    return {
      appMode,
      provider,
      label: 'Supabase belum siap',
      description:
        'Mode cloud dipilih, tetapi URL, anon key, atau instance key belum diisi lengkap.',
      remoteEnabled: false,
      configured: false,
    }
  }

  return {
    appMode,
    provider,
    label: appMode === 'production' ? 'Supabase' : 'Supabase staging',
    description:
      appMode === 'production'
        ? 'Data utama diarahkan ke Supabase. Gunakan hanya saat alur sudah benar-benar stabil.'
        : 'Data utama diarahkan ke Supabase staging untuk pengujian aman sebelum produksi.',
    remoteEnabled: true,
    configured: true,
  }
}
