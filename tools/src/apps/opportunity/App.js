import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
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

  const updateRow = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
  };

  const addRow = () => {
    setState((prev) => ({ ...prev, rows: [...prev.rows, makeRow()] }));
  };

  const removeRow = (id) => {
    setState((prev) => {
      const next = prev.rows.filter((row) => row.id !== id);
      return { ...prev, rows: next.length > 0 ? next : [makeRow()] };
    });
  };

  const clearAll = () => {
    if (!window.confirm('Are you sure you want to reset the table? This will remove all accounts.')) return;
    setState((prev) => ({ ...prev, rows: [makeRow()] }));
  };

  const changeFrequency = (nextFrequency) => {
    setState((prev) => ({ ...prev, frequency: nextFrequency }));
  };

  const totalPeriodicReturn = useMemo(
    () => rows.reduce((sum, row) => sum + computePeriodicReturn(row.amount, row.annualRate, frequency), 0),
    [rows, frequency],
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
              <th>Name</th>
              <th className="num">Amount</th>
              <th className="num">Annual rate (%)</th>
              <th className="num">Calculated value</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const periodicReturn = computePeriodicReturn(row.amount, row.annualRate, frequency);
              return (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                      placeholder="MercadoPago"
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="20000"
                    />
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      step="0.01"
                      value={row.annualRate}
                      onChange={(e) => updateRow(row.id, 'annualRate', e.target.value)}
                      placeholder="50"
                    />
                  </td>
                  <td className="num result-cell">{currencyFmt.format(periodicReturn)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="icon-delete-btn"
                      onClick={() => removeRow(row.id)}
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

      <p className="opportunity-note">
        Example: amount 20000 with annual rate 50% returns 10000 yearly, around 27.40 daily.
      </p>
    </div>
  );
}
