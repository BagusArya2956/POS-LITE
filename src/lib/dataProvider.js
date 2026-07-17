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
        'Data is stored only in this browser. Ideal for quick revisions and feature testing.',
      remoteEnabled: false,
      configured: false,
    }
  }

  if (appMode !== 'staging') {
    return {
      appMode,
      provider,
      label: 'Supabase is not enabled',
      description:
        'The cloud adapter is intentionally limited to staging to protect production data.',
      remoteEnabled: false,
      configured: hasSupabaseConfig(),
    }
  }

  if (!hasSupabaseConfig()) {
    return {
      appMode,
      provider,
      label: 'Supabase is not ready',
      description:
        'Cloud mode is selected, but the URL, anon key, or instance key is incomplete.',
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
        ? 'Primary data is sent to Supabase. Use this only when the workflow is stable.'
        : 'Primary data is sent to Supabase staging for safe pre-production testing.',
    remoteEnabled: true,
    configured: true,
  }
}
