import React, { useState, useEffect, useRef } from 'react';
import SummaryCards from './components/SummaryCards';
import DonutChart from './components/DonutChart';
import CategorySection from './components/CategorySection';
import ItemModal from './components/ItemModal';
import { CATEGORIES, DEFAULT_DATA, STORAGE_KEY } from './dataModel';
import './Patrimony.css';

const Patrimony = () => {
  const [data, setData] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return { ...DEFAULT_DATA, ...JSON.parse(stored) }; } catch { /* ignore */ }
    }
    return DEFAULT_DATA;
  });
  const [modalState, setModalState] = useState(null); // { categoryKey, index? }
  const [allCollapsed, setAllCollapsed] = useState(false);
  const fileInputRef = useRef();

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
    if (!window.confirm('Delete this item?')) return;
    setData((prev) => {
      const updated = { ...prev };
      const list = [...(updated[categoryKey] || [])];
      list.splice(index, 1);
      updated[categoryKey] = list;
      return updated;
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
    if (!window.confirm('Clear ALL patrimony data? This cannot be undone.')) return;
    setData({ ...DEFAULT_DATA });
  };

  // ── Determine current modal's category definition ─
  const modalCategory = modalState
    ? CATEGORIES.find((c) => c.key === modalState.categoryKey)
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
      </div>

      <SummaryCards data={data} categories={CATEGORIES} />

      <div className="chart-panel">
        <DonutChart data={data} categories={CATEGORIES} size={150} />
      </div>

      {CATEGORIES.map((cat) => (
        <CategorySection
          key={cat.key}
          category={cat}
          items={data[cat.key] || []}
          forceCollapsed={allCollapsed}
          onAdd={openAddModal}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      ))}

      {modalState && modalCategory && (
        <ItemModal
          category={modalCategory}
          item={modalItem}
          onSave={handleSave}
          onCancel={() => setModalState(null)}
        />
      )}
    </div>
  );
};

export default Patrimony;
