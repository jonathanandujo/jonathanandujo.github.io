import React, { useState, useEffect } from 'react';

const FIELD_LABELS = {
  name: 'Name',
  value: 'Amount / Value ($)',
  notes: 'Notes',
  year: 'Year',
  bank: 'Bank / Institution',
  platform: 'Platform',
  lender: 'Lender',
};

const ItemModal = ({ category, item, onSave, onCancel }) => {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (item) {
      setForm({ ...item });
    } else {
      const blank = {};
      category.fields.forEach((f) => (blank[f] = ''));
      setForm(blank);
    }
  }, [item, category]);

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.name.trim() === '') return;
    onSave({ ...form, value: Number(form.value) || 0 });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{item ? 'Edit' : 'Add'} {category.label.replace(/s$/, '')}</h3>
        <form onSubmit={handleSubmit}>
          {category.fields.map((f) => (
            <div className="field" key={f}>
              <label>{FIELD_LABELS[f] || f}</label>
              {f === 'notes' ? (
                <textarea
                  rows={2}
                  value={form[f] || ''}
                  onChange={(e) => handleChange(f, e.target.value)}
                />
              ) : f === 'value' ? (
                <input
                  type="number"
                  step="0.01"
                  value={form[f] || ''}
                  onChange={(e) => handleChange(f, e.target.value)}
                  required
                />
              ) : (
                <input
                  type="text"
                  value={form[f] || ''}
                  onChange={(e) => handleChange(f, e.target.value)}
                  required={f === 'name'}
                />
              )}
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">
              {item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
