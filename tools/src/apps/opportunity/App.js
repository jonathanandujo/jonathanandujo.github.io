import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
import ItemModal from './components/ItemModal';
import ConfirmModal from './components/ConfirmModal';
import '../../supabase/SyncPanel.css';
import './Opportunity.css';

const STORAGE_KEY = 'opportunity-cost-data-v1';
const AUTO_PUSH_DELAY_MS = 2000;

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', periods: 365 },
  { value: 'weekly', label: 'Weekly', periods: 52 },
  { value: 'monthly', label: 'Monthly', periods: 12 },
  { value: 'yearly', label: 'Yearly', periods: 1 },
];

const makeRow = () => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  name: '',
  amount: '',
  annualRate: '',
});

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const computePeriodicReturn = (amount, annualRate, frequency) => {
  const amountNum = toNumber(amount);
  const rateNum = toNumber(annualRate);
  const annualReturn = amountNum * (rateNum / 100);
  const option = FREQUENCY_OPTIONS.find((f) => f.value === frequency) || FREQUENCY_OPTIONS[0];
  return annualReturn / option.periods;
};

const computeAnnualReturn = (amount, annualRate) => toNumber(amount) * (toNumber(annualRate) / 100);

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export default function OpportunityCost({ syncAlias }) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { rows: [makeRow()], frequency: 'daily' };
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return {
          rows: parsed.length > 0 ? parsed : [makeRow()],
          frequency: 'daily',
        };
      }
      const parsedRows = Array.isArray(parsed?.rows) && parsed.rows.length > 0 ? parsed.rows : [makeRow()];
      const parsedFrequency = FREQUENCY_OPTIONS.some((f) => f.value === parsed?.frequency)
        ? parsed.frequency
        : 'daily';
      return { rows: parsedRows, frequency: parsedFrequency };
    } catch {
      return { rows: [makeRow()], frequency: 'daily' };
    }
  });

  const rows = state.rows;
  const frequency = state.frequency;
  const [modalState, setModalState] = useState(null); // { index: number | null }
  const [confirmState, setConfirmState] = useState(null); // { title, message, onConfirm, confirmLabel?, danger? }
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragFromIndexRef = useRef(null);
  const touchDragFromIndexRef = useRef(null);

  const autoPulledRef = useRef(false);
  const autoPushTimerRef = useRef(null);
  const skipNextAutoPushRef = useRef(true);
  const { push, pull, syncing, lastSync, error: syncError, isConfigured } = useSupabaseSync('opportunity-cost', syncAlias);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!isConfigured || autoPulledRef.current) return;
    autoPulledRef.current = true;
    (async () => {
      const remote = await pull();
      if (remote?.rows && Array.isArray(remote.rows) && remote.rows.length > 0) {
        const remoteFrequency = FREQUENCY_OPTIONS.some((f) => f.value === remote.frequency)
          ? remote.frequency
          : 'daily';
        skipNextAutoPushRef.current = true;
        setState({ rows: remote.rows, frequency: remoteFrequency });
      }
    })();
  }, [isConfigured, pull]);

  useEffect(() => {
    if (!isConfigured) return;
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const remote = await pull();
      if (remote?.rows && Array.isArray(remote.rows) && remote.rows.length > 0) {
        const remoteFrequency = FREQUENCY_OPTIONS.some((f) => f.value === remote.frequency)
          ? remote.frequency
          : 'daily';
        skipNextAutoPushRef.current = true;
        setState({ rows: remote.rows, frequency: remoteFrequency });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isConfigured, pull]);

  useEffect(() => {
    if (!isConfigured) return;
    if (skipNextAutoPushRef.current) {
      skipNextAutoPushRef.current = false;
      return;
    }

    if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
    autoPushTimerRef.current = setTimeout(() => {
      push({ rows, frequency });
    }, AUTO_PUSH_DELAY_MS);

    return () => {
      if (autoPushTimerRef.current) clearTimeout(autoPushTimerRef.current);
    };
  }, [rows, frequency, isConfigured, push]);

  const openAddModal = () => {
    setModalState({ index: null });
  };

  const openEditModal = (index) => {
    setModalState({ index });
  };

  const handleSave = (item) => {
    setState((prev) => {
      if (modalState?.index === null || modalState?.index === undefined) {
        return { ...prev, rows: [...prev.rows, { ...item, id: Date.now() + Math.floor(Math.random() * 1000) }] };
      }

      const next = [...prev.rows];
      const existing = next[modalState.index] || {};
      next[modalState.index] = { ...existing, ...item };
      return { ...prev, rows: next };
    });
    setModalState(null);
  };

  const handleDelete = (id) => {
    const rowName = rows.find((row) => row.id === id)?.name?.trim() || 'this account';
    setConfirmState({
      title: 'Delete Account',
      message: `Are you sure you want to delete "${rowName}"?`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        setState((prev) => {
          const next = prev.rows.filter((row) => row.id !== id);
          return { ...prev, rows: next.length > 0 ? next : [makeRow()] };
        });
        setConfirmState(null);
      },
    });
  };

  const addRow = () => {
    openAddModal();
  };

  const clearAll = () => {
    setConfirmState({
      title: 'Reset Table',
      message: 'Clear all opportunity accounts? This cannot be undone.',
      confirmLabel: 'Reset',
      danger: true,
      onConfirm: () => {
        setState((prev) => ({ ...prev, rows: [makeRow()] }));
        setConfirmState(null);
      },
    });
  };

  const changeFrequency = (nextFrequency) => {
    setState((prev) => ({ ...prev, frequency: nextFrequency }));
  };

  const reorderRows = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) return;
    setState((prev) => {
      const next = [...prev.rows];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...prev, rows: next };
    });
  };

  const onDragStart = (index) => (e) => {
    dragFromIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const onDragOver = (index) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const onDrop = (index) => (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const parsed = Number(raw);
    const fromIndex = Number.isInteger(parsed) ? parsed : dragFromIndexRef.current;
    reorderRows(fromIndex, index);
    dragFromIndexRef.current = null;
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    dragFromIndexRef.current = null;
    setDragOverIndex(null);
  };

  const onTouchStartHandle = (index) => () => {
    touchDragFromIndexRef.current = index;
    setDragOverIndex(index);
  };

  const onTouchMoveHandle = (e) => {
    if (touchDragFromIndexRef.current == null) return;
    const touch = e.touches?.[0];
    if (!touch) return;
    const hovered = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = hovered?.closest?.('tr[data-row-index]');
    const idx = Number(row?.getAttribute('data-row-index'));
    if (Number.isInteger(idx)) {
      setDragOverIndex(idx);
    }
    e.preventDefault();
  };

  const onTouchEndHandle = () => {
    const fromIndex = touchDragFromIndexRef.current;
    const toIndex = dragOverIndex ?? fromIndex;
    reorderRows(fromIndex, toIndex);
    touchDragFromIndexRef.current = null;
    setDragOverIndex(null);
  };

  const totalPeriodicReturn = useMemo(
    () => rows.reduce((sum, row) => sum + computePeriodicReturn(row.amount, row.annualRate, frequency), 0),
    [rows, frequency],
  );

  const totalAmount = useMemo(
    () => rows.reduce((sum, row) => sum + toNumber(row.amount), 0),
    [rows],
  );

  const totalAnnualReturn = useMemo(
    () => rows.reduce((sum, row) => sum + computeAnnualReturn(row.amount, row.annualRate), 0),
    [rows],
  );

  const selectedFrequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label || 'Daily';

  return (
    <div className="opportunity-app">
      <h1>Opportunity Cost</h1>
      <p className="opportunity-subtitle">
        Estimate how much each account returns based on annual rate and payout frequency.
      </p>

      <div className="opportunity-toolbar card">
        <div className="toolbar-left">
          <label className="main-frequency-control">
            Frequency for all accounts
            <select value={frequency} onChange={(e) => changeFrequency(e.target.value)}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-secondary danger-soft" onClick={clearAll}>Reset table</button>
        </div>
        <div className="toolbar-metrics">
          <div className="metric-item">
            <span className="metric-label">Total amount</span>
            <strong>{currencyFmt.format(totalAmount)}</strong>
          </div>
          <div className="metric-item">
            <span className="metric-label">Annual return</span>
            <strong>{currencyFmt.format(totalAnnualReturn)}</strong>
          </div>
          <div className="metric-item metric-accent">
            <span className="metric-label">{selectedFrequencyLabel} return</span>
            <strong>{currencyFmt.format(totalPeriodicReturn)}</strong>
          </div>
        </div>
      </div>

      {isConfigured && (
        <div className="supabase-sync-bar" style={{ marginBottom: 10 }}>
          {syncing && <span className="sync-info">Syncing...</span>}
          {syncError && <span className="sync-error">{syncError}</span>}
          {lastSync && !syncing && <span className="sync-info">Last sync: {lastSync.toLocaleTimeString()}</span>}
        </div>
      )}

      <div className="opportunity-table-wrap">
        <table className="opportunity-table">
          <thead>
            <tr>
              <th className="drag-col" title="Drag">⋮⋮</th>
              <th className="name-col">Name</th>
              <th className="num amount-col">Amount</th>
              <th className="num rate-col">
                <span className="th-main">Annual</span>
                <span className="th-sub">rate %</span>
              </th>
              <th className="num value-col">
                <span className="th-main">Calculated</span>
                <span className="th-sub">return</span>
              </th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const periodicReturn = computePeriodicReturn(row.amount, row.annualRate, frequency);
              return (
                <tr
                  key={row.id}
                  data-row-index={idx}
                  className={dragOverIndex === idx ? 'drag-over-row' : ''}
                  onDragOver={onDragOver(idx)}
                  onDrop={onDrop(idx)}
                >
                  <td className="drag-col" data-label="Move">
                    <span
                      className="drag-handle"
                      draggable
                      onDragStart={onDragStart(idx)}
                      onDragEnd={onDragEnd}
                      onTouchStart={onTouchStartHandle(idx)}
                      onTouchMove={onTouchMoveHandle}
                      onTouchEnd={onTouchEndHandle}
                      onTouchCancel={onTouchEndHandle}
                      title="Drag to reorder"
                      aria-label="Drag to reorder"
                    >
                      ⋮⋮
                    </span>
                  </td>
                  <td className="name-col" data-label="Name" title={row.name || ''}>
                    {row.name || '—'}
                  </td>
                  <td className="num amount-col" data-label="Amount">
                    {currencyFmt.format(toNumber(row.amount))}
                  </td>
                  <td className="num rate-col" data-label="Annual rate (%)">
                    {toNumber(row.annualRate).toFixed(2)}%
                  </td>
                  <td className="num result-cell value-col" data-label="Calculated value">{currencyFmt.format(periodicReturn)}</td>
                  <td className="actions" data-label="Actions">
                    <button
                      type="button"
                      className="icon-edit-btn"
                      onClick={() => openEditModal(idx)}
                      title="Edit account"
                      aria-label="Edit account"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="icon-delete-btn"
                      onClick={() => handleDelete(row.id)}
                      title="Remove account"
                      aria-label="Remove account"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-bottom-actions">
          <button type="button" className="btn-primary add-row-btn" onClick={addRow}>+ Add account</button>
        </div>
      </div>

      {modalState && (
        <ItemModal
          item={modalState.index !== null && modalState.index !== undefined ? rows[modalState.index] : null}
          onSave={handleSave}
          onCancel={() => setModalState(null)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          danger={confirmState.danger}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
