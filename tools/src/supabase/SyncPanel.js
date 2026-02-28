import React, { useState } from 'react';
import { getSyncAlias, setSyncAlias, clearSyncAlias } from './supabaseClient';
import './SyncPanel.css';

/**
 * Bottom-of-sidebar sync button.
 * Opens a centered modal to set/change the sync alias.
 */
const SyncPanel = ({ collapsed, onAliasChange }) => {
  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState(getSyncAlias());
  const [draft, setDraft] = useState(alias);

  const connected = !!alias;

  const handleOpen = () => {
    setDraft(alias);
    setOpen(true);
  };

  const handleSave = () => {
    const val = draft.trim();
    if (!val) return;
    setSyncAlias(val);
    setAlias(val);
    onAliasChange?.(val);
    setOpen(false);
  };

  const handleDisconnect = () => {
    clearSyncAlias();
    setAlias('');
    setDraft('');
    onAliasChange?.('');
    setOpen(false);
  };

  return (
    <>
      <div className="sync-panel">
        <button
          className="sync-toggle"
          onClick={handleOpen}
          title={connected ? `Syncing as "${alias}"` : 'Configure cloud sync'}
        >
          <span className={`sync-dot ${connected ? 'connected' : ''}`} />
          {!collapsed && (
            <span className="sync-label">
              {connected ? `Sync: ${alias}` : 'Sync'}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="sync-modal-overlay" onClick={() => setOpen(false)}>
          <div className="sync-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cloud Sync</h3>
            <p className="sync-modal-hint">
              Choose a unique alias to identify your data. Your Patrimony and Sankey charts will be
              saved under this name. Use a format like <strong>yourname:secret</strong> to keep it
              unique and hard to guess (e.g. <em>jonathan:m1c4s4</em>).
            </p>
            <label>
              Your alias
              <input
                type="text"
                placeholder="e.g. jonathan:mysecret123"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </label>
            {connected && (
              <p className="sync-modal-status">✅ Currently syncing as “{alias}”</p>
            )}
            <div className="sync-modal-actions">
              <button className="btn-sync-save" onClick={handleSave} disabled={!draft.trim()}>
                {connected ? 'Update' : 'Enable Sync'}
              </button>
              {connected && (
                <button className="btn-sync-disconnect" onClick={handleDisconnect}>Disconnect</button>
              )}
              <button className="btn-sync-cancel" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SyncPanel;
