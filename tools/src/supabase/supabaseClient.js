import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nwzvuenfhqmixicsphod.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_P4RzvZ_fX6KEmUi6kLFfgw_ldiRIz9Q';

const SYNC_ALIAS_KEY = 'supabaseSyncAlias';

let clientInstance = null;

export function getSupabaseClient() {
  if (!clientInstance) {
    clientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return clientInstance;
}

export function getSyncAlias() {
  let alias = (localStorage.getItem(SYNC_ALIAS_KEY) || '').trim();
  if (!alias) {
    alias = _generateAlias();
    localStorage.setItem(SYNC_ALIAS_KEY, alias);
  }
  return alias;
}

function _generateAlias() {
  const adj = ['swift','brave','calm','keen','bold','cool','warm','fast','wise','free'];
  const animals = ['dolphin','falcon','otter','tiger','panda','eagle','fox','wolf','hawk','bear'];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${pick(adj)}-${pick(animals)}-${num}`;
}

export function setSyncAlias(alias) {
  localStorage.setItem(SYNC_ALIAS_KEY, (alias || '').trim());
}

export function clearSyncAlias() {
  localStorage.removeItem(SYNC_ALIAS_KEY);
}

/**
 * SHA-256 hash the alias so it's unguessable in the database.
 * Returns a hex string.
 */
export async function hashAlias(alias) {
  const encoder = new TextEncoder();
  const data = encoder.encode(alias);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
