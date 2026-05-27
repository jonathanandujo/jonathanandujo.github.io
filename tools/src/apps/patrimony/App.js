import React, { useState, useEffect, useRef, useMemo } from 'react';
import SummaryCards from './components/SummaryCards';
import DonutChart from './components/DonutChart';
import CategorySection from './components/CategorySection';
import ItemModal from './components/ItemModal';
import CategoryModal from './components/CategoryModal';
import ConfirmModal from './components/ConfirmModal';
import { CATEGORIES, DEFAULT_DATA, STORAGE_KEY } from './dataModel';
import { useSupabaseSync } from '../../supabase/useSupabaseSync';
import '../../supabase/SyncPanel.css';
import './Patrimony.css';

const Patrimony = ({ syncAlias }) => {
  const [data, setData] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return { ...DEFAULT_DATA, ...JSON.parse(stored) }; } catch { /* ignore */ }
    }
    return DEFAULT_DATA;
  });
  const [modalState, setModalState] = useState(null); // { categoryKey, index? }
  const [catModalState, setCatModalState] = useState(null); // null | { category? } for add/edit
  const [confirmState, setConfirmState] = useState(null); // { title, message, onConfirm }
  const [allCollapsed, setAllCollapsed] = useState(false);
  const fileInputRef = useRef();
  const autoPulledRef = useRef(false);
  const { push, pull, syncing, lastSync, error: syncError, isConfigured } = useSupabaseSync('patrimony', syncAlias);

  // ── Auto-pull latest version from server on load ─
  useEffect(() => {
    if (!isConfigured || autoPulledRef.current) return;
    autoPulledRef.current = true;
    (async () => {
      const remote = await pull();
      if (remote) setData({ ...DEFAULT_DATA, ...remote });
    })();
  }, [isConfigured, pull]);

  // ── Merge built-in + custom categories (assets first, then liabilities) ─
  const allCategories = useMemo(() => {
    const custom = (data._customCategories || []);
    const all = [...CATEGORIES, ...custom];
    const assets = all.filter((c) => c.type === 'asset');
    const liabilities = all.filter((c) => c.type === 'liability');
    return [...assets, ...liabilities];
  }, [data._customCategories]);

  // ── Persist whenever data changes ────────────────
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // ── CRUD helpers ─────────────────────────────────
  const openAddModal = (categoryKey) => {
    setModalState({ categoryKey, index: null });
  };

  const openEditModal = (categoryKey, index) => {
    setModalState({ categoryKey, index });
  };

  const handleSave = (item) => {
    setData((prev) => {
      const updated = { ...prev };
      const list = [...(updated[modalState.categoryKey] || [])];
      if (modalState.index !== null && modalState.index !== undefined) {
        list[modalState.index] = item;
      } else {
        item.id = Date.now();
        list.push(item);
      }
      updated[modalState.categoryKey] = list;
      return updated;
    });
    setModalState(null);
  };

  const handleDelete = (categoryKey, index) => {
    const itemName = (data[categoryKey] || [])[index]?.name || 'this item';
    setConfirmState({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${itemName}"?`,
      onConfirm: () => {
        setData((prev) => {
          const updated = { ...prev };
          const list = [...(updated[categoryKey] || [])];
          list.splice(index, 1);
          updated[categoryKey] = list;
          return updated;
        });
        setConfirmState(null);
      },
    });
  };

  // ── JSON Download ────────────────────────────────
  const handleDownload = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrimony-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── JSON Upload ──────────────────────────────────
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        setData({ ...DEFAULT_DATA, ...parsed });
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // allow re-uploading same file
  };

  // ── Clear all data ──────────────────────────────
  const handleClear = () => {
    setConfirmState({
      title: 'Clear All Data',
      message: 'Clear ALL patrimony data? This cannot be undone.',
      onConfirm: () => {
        setData({ ...DEFAULT_DATA });
        setConfirmState(null);
      },
    });
  };

  // ── Custom Category CRUD ─────────────────────────
  const handleSaveCategory = (catDef) => {
    setData((prev) => {
      const updated = { ...prev };
      const customs = [...(updated._customCategories || [])];
      const existIdx = customs.findIndex((c) => c.key === catDef.key);
      if (existIdx >= 0) {
        customs[existIdx] = catDef;
      } else {
        customs.push(catDef);
        updated[catDef.key] = []; // init empty data array
      }
      updated._customCategories = customs;
      return updated;
    });
    setCatModalState(null);
  };

  const handleDeleteCategory = (key) => {
    const cat = (data._customCategories || []).find((c) => c.key === key);
    if (!cat) return;
    setConfirmState({
      title: 'Delete Category',
      message: `Delete category "${cat.label}" and all its items?`,
      onConfirm: () => {
        setData((prev) => {
          const updated = { ...prev };
          updated._customCategories = (updated._customCategories || []).filter((c) => c.key !== key);
          delete updated[key];
          return updated;
        });
        setConfirmState(null);
      },
    });
  };

  // ── Determine current modal's category definition ─
  const modalCategory = modalState
    ? allCategories.find((c) => c.key === modalState.categoryKey)
    : null;
  const modalItem =
    modalState && modalState.index !== null && modalState.index !== undefined
      ? (data[modalState.categoryKey] || [])[modalState.index]
      : null;

  // ── Render ───────────────────────────────────────
  return (
    <div className="patrimony">
      <h1>My Patrimony</h1>
      <p className="subtitle">Track your assets, liabilities and net worth</p>

      <div className="top-bar">
        <button className="btn-primary" onClick={handleDownload}>
          ⬇ Download JSON
        </button>
        <label className="file-label">
          ⬆ Import JSON
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleUpload} />
        </label>
        <button className="btn-secondary" onClick={() => setAllCollapsed((v) => !v)}>
          {allCollapsed ? '▶ Expand All' : '▼ Collapse All'}
        </button>
        <button className="btn-danger" onClick={handleClear}>
          🗑 Clear All
        </button>
        {isConfigured && (
          <span className="supabase-sync-bar">
            <button className="btn-push" disabled={syncing} onClick={() => push(data)}>
              ☁↑ Push
            </button>
            <button className="btn-pull" disabled={syncing} onClick={async () => {
              const remote = await pull();
              if (remote) setData({ ...DEFAULT_DATA, ...remote });
            }}>
              ☁↓ Pull
            </button>
            {syncing && <span className="sync-info">Syncing…</span>}
            {syncError && <span className="sync-error">{syncError}</span>}
            {lastSync && !syncing && <span className="sync-info">Last: {lastSync.toLocaleTimeString()}</span>}
          </span>
        )}
      </div>

      <SummaryCards data={data} categories={allCategories} />

      <div className="chart-panel">
        <DonutChart data={data} categories={allCategories} size={150} />
      </div>

      {allCategories.map((cat) => {
        const isCustom = cat.key.startsWith('custom_');
        return (
          <CategorySection
            key={cat.key}
            category={cat}
            items={data[cat.key] || []}
            forceCollapsed={allCollapsed}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isCustom={isCustom}
            onEditCategory={isCustom ? () => setCatModalState({ category: cat }) : undefined}
            onDeleteCategory={isCustom ? () => handleDeleteCategory(cat.key) : undefined}
          />
        );
      })}

      <button
        className="btn-add-category"
        onClick={() => setCatModalState({})}
      >
        + Add Custom Category
      </button>

      {modalState && modalCategory && (
        <ItemModal
          category={modalCategory}
          item={modalItem}
          onSave={handleSave}
          onCancel={() => setModalState(null)}
        />
      )}

      {catModalState && (
        <CategoryModal
          category={catModalState.category || null}
          onSave={handleSaveCategory}
          onCancel={() => setCatModalState(null)}
        />
      )}

      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
};

export default Patrimony;
