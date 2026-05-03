import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig, hasSupabaseConfig } from './dataProvider.js'

let supabaseClient = null

export function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null
  }

  if (!supabaseClient) {
    const config = getSupabaseConfig()
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  return supabaseClient
}
