import React, { useEffect, useState } from 'react';

const ItemModal = ({ item, onSave, onCancel }) => {
  const [form, setForm] = useState({ name: '', amount: '', annualRate: '' });

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        amount: item.amount ?? '',
        annualRate: item.annualRate ?? '',
      });
    } else {
      setForm({ name: '', amount: '', annualRate: '' });
    }
  }, [item]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const annualRate = Number(form.annualRate);
    const normalizedRate = Number.isFinite(annualRate)
      ? Math.max(0, Math.min(100, annualRate))
      : 0;

    onSave({
      name,
      amount: form.amount,
      annualRate: String(normalizedRate),
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{item ? 'Edit Account' : 'Add Account'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="MercadoPago"
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              placeholder="20000"
            />
          </div>

          <div className="field">
            <label>Annual rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.annualRate}
              onChange={(e) => handleChange('annualRate', e.target.value)}
              placeholder="5.00"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary">{item ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemModal;
