import { useState, useCallback } from 'react';
import { getSupabaseClient, hashAlias } from './supabaseClient';

/**
 * Hook that syncs a JSON blob to Supabase, namespaced by a hashed alias.
 *
 * Row id format: "{sha256(alias)}:{rowId}"
 * The alias is hashed so row IDs are unguessable even though the
 * Supabase URL and anon key are public.
 *
 * Table schema:
 *   CREATE TABLE app_data (
 *     id         TEXT PRIMARY KEY,
 *     data       JSONB NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT now()
 *   );
 *
 * @param {string} rowId – e.g. "patrimony", "sankey-3"
 * @param {string} alias – the user's chosen alias (empty = sync disabled)
 */
export function useSupabaseSync(rowId, alias) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  const isConfigured = !!alias;

  const getKey = useCallback(async () => {
    const hash = await hashAlias(alias);
    return `${hash}:${rowId}`;
  }, [alias, rowId]);

  const push = useCallback(async (localData) => {
    if (!alias) return;
    const client = getSupabaseClient();
    const key = await getKey();
    setSyncing(true);
    setError(null);
    try {
      const { error: err } = await client
        .from('app_data')
        .upsert({ id: key, data: localData, updated_at: new Date().toISOString() });
      if (err) throw err;
      setLastSync(new Date());
    } catch (e) {
      setError(e.message || 'Push failed');
    } finally {
      setSyncing(false);
    }
  }, [alias, rowId, getKey]);

  const pull = useCallback(async () => {
    if (!alias) return null;
    const client = getSupabaseClient();
    const key = await getKey();
    setSyncing(true);
    setError(null);
    try {
      const { data: rows, error: err } = await client
        .from('app_data')
        .select('data')
        .eq('id', key)
        .single();
      if (err && err.code !== 'PGRST116') throw err;
      setLastSync(new Date());
      return rows?.data ?? null;
    } catch (e) {
      setError(e.message || 'Pull failed');
      return null;
    } finally {
      setSyncing(false);
    }
  }, [alias, rowId, getKey]);

  return { push, pull, syncing, lastSync, error, isConfigured };
}
