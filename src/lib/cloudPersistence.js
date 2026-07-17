import { getSupabaseConfig, isSupabaseProviderEnabled } from './dataProvider.js'
import { normalizeDatabase } from './storage.js'
import { getSupabaseClient } from './supabaseClient.js'

function ensureSupabaseReady() {
  if (!isSupabaseProviderEnabled()) {
    return null
  }

  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase credentials are incomplete.')
  }

  return client
}

export async function loadCloudDatabase(fallbackDatabase) {
  const client = ensureSupabaseReady()
  if (!client) {
    return {
      source: 'local',
      database: normalizeDatabase(fallbackDatabase),
      syncedAt: '',
    }
  }

  const config = getSupabaseConfig()
  const { data, error } = await client
    .from(config.tableName)
    .select('payload, updated_at')
    .eq('instance_key', config.instanceKey)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Failed to load data from Supabase.')
  }

  if (!data?.payload) {
    const seeded = normalizeDatabase(fallbackDatabase)
    await saveCloudDatabase(seeded)
    return {
      source: 'seeded-remote',
      database: seeded,
      syncedAt: new Date().toISOString(),
    }
  }

  return {
    source: 'remote',
    database: normalizeDatabase(data.payload),
    syncedAt: data.updated_at || new Date().toISOString(),
  }
}

export async function saveCloudDatabase(database) {
  const client = ensureSupabaseReady()
  if (!client) {
    return {
      ok: true,
      skipped: true,
      syncedAt: '',
    }
  }

  const config = getSupabaseConfig()
  const syncedAt = new Date().toISOString()
  const payload = normalizeDatabase(database)

  const { error } = await client.from(config.tableName).upsert(
    {
      instance_key: config.instanceKey,
      payload,
      updated_at: syncedAt,
    },
    {
      onConflict: 'instance_key',
    },
  )

  if (error) {
    throw new Error(error.message || 'Failed to save data to Supabase.')
  }

  return {
    ok: true,
    skipped: false,
    syncedAt,
  }
}
