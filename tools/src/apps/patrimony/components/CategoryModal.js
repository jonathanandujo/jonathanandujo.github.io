import React, { useState, useEffect } from 'react';
import { REQUIRED_FIELDS } from '../dataModel';

const EMOJI_SUGGESTIONS = ['📦', '🎨', '🏆', '💰', '🏢', '🎓', '👜', '🔧', '🎵', '🐾', '✈️', '🎯'];

const CategoryModal = ({ category, onSave, onCancel }) => {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('📦');
  const [type, setType] = useState('asset');
  const [extraFields, setExtraFields] = useState([]);
  const [newField, setNewField] = useState('');

  useEffect(() => {
    if (category) {
      setLabel(category.label);
      setIcon(category.icon);
      setType(category.type);
      setExtraFields(
        category.fields.filter((f) => !REQUIRED_FIELDS.includes(f))
      );
    } else {
      setLabel('');
      setIcon('📦');
      setType('asset');
      setExtraFields([]);
    }
  }, [category]);

  const handleAddField = () => {
    const f = newField.trim().toLowerCase();
    if (!f || REQUIRED_FIELDS.includes(f) || extraFields.includes(f)) return;
    setExtraFields((prev) => [...prev, f]);
    setNewField('');
  };

  const handleRemoveField = (f) => {
    setExtraFields((prev) => prev.filter((x) => x !== f));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!label.trim()) return;

    const key = category
      ? category.key
      : `custom_${Date.now()}`;

    onSave({
      key,
      label: label.trim(),
      icon,
      type,
      fields: ['name', 'value', ...extraFields, 'notes'],
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal category-modal">
        <h3>{category ? 'Edit Category' : 'New Category'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Category Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Collectibles"
              required
            />
          </div>

          <div className="field">
            <label>Icon (emoji)</label>
            <div className="emoji-row">
              <input
                type="text"
                className="emoji-input"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
              />
              <div className="emoji-suggestions">
                {EMOJI_SUGGESTIONS.map((em) => (
                  <button
                    type="button"
                    key={em}
                    className={`emoji-btn ${icon === em ? 'selected' : ''}`}
                    onClick={() => setIcon(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field">
            <label>Type</label>
            <div className="type-toggle">
              <button
                type="button"
                className={`toggle-btn ${type === 'asset' ? 'active-asset' : ''}`}
                onClick={() => setType('asset')}
              >
                ✅ Asset
              </button>
              <button
                type="button"
                className={`toggle-btn ${type === 'liability' ? 'active-liability' : ''}`}
                onClick={() => setType('liability')}
              >
                ⚠️ Liability
              </button>
            </div>
          </div>

          <div className="field">
            <label>Fields</label>
            <div className="fields-list">
              {REQUIRED_FIELDS.map((f) => (
                <span key={f} className="field-tag built-in">
                  {f}
                </span>
              ))}
              {extraFields.map((f) => (
                <span key={f} className="field-tag custom">
                  {f}
                  <button type="button" onClick={() => handleRemoveField(f)}>×</button>
                </span>
              ))}
            </div>
            <div className="add-field-row">
              <input
                type="text"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                placeholder="Add a field (e.g. bank, type)"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddField(); } }}
              />
              <button type="button" className="btn-secondary" onClick={handleAddField}>+ Add</button>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {category ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
