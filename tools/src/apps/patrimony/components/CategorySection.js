import React, { useState } from 'react';

const formatMoney = (n) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

const CategorySection = ({ category, items, forceCollapsed, onAdd, onEdit, onDelete, onReorder, isCustom, onEditCategory, onDeleteCategory }) => {
  const [open, setOpen] = useState(true);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  React.useEffect(() => {
    setOpen(!forceCollapsed);
  }, [forceCollapsed]);

  const total = items.reduce((s, i) => s + Number(i.value || 0), 0);
  const isLiability = category.type === 'liability';

  const onDragStart = (idx) => (e) => {
    setDraggingIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(idx);
  };

  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const parsed = Number(raw);
    const fromIdx = Number.isInteger(parsed) ? parsed : draggingIndex;
    if (fromIdx !== null && onReorder) {
      onReorder(category.key, fromIdx, idx);
    }
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const onDragEnd = () => {
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  return (
    <div className="category-section">
      <div className="category-header" onClick={() => setOpen(!open)}>
        <div className="left">
          <span className="icon">{category.icon}</span>
          <h2>{category.label}</h2>
          <span className="count">{items.length}</span>
          {isCustom && (
            <span className="custom-badge">Custom</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isCustom && onEditCategory && (
            <button className="cat-action-btn" title="Edit category" onClick={(e) => { e.stopPropagation(); onEditCategory(); }}>⚙️</button>
          )}
          {isCustom && onDeleteCategory && (
            <button className="cat-action-btn cat-delete-btn" title="Delete category" onClick={(e) => { e.stopPropagation(); onDeleteCategory(); }}>🗑️</button>
          )}
          <span className={`total ${isLiability ? 'negative' : 'positive'}`}>
            {isLiability ? `-${formatMoney(total)}` : formatMoney(total)}
          </span>
          <span className={`chevron ${open ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {open && (
        <div className="category-body">
          {items.length > 0 ? (
            <table className="items-table">
              <thead>
                <tr>
                  <th className="col-drag" title="Drag">⋮⋮</th>
                  {category.fields.map((f) => {
                    let colClass = 'col-extra';
                    if (f === 'name') colClass = 'col-name';
                    else if (f === 'value') colClass = 'col-value';
                    else if (f === 'notes') colClass = 'col-notes';
                    return (
                      <th key={f} className={colClass}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </th>
                    );
                  })}
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id || idx}
                    className={dragOverIndex === idx ? 'drag-over-row' : ''}
                    onDragOver={onDragOver(idx)}
                    onDrop={onDrop(idx)}
                  >
                    <td className="drag-cell">
                      <span
                        className="drag-row-handle"
                        draggable
                        onDragStart={onDragStart(idx)}
                        onDragEnd={onDragEnd}
                        title="Drag to reorder"
                        aria-label="Drag to reorder"
                      >
                        ⋮⋮
                      </span>
                    </td>
                    {category.fields.map((f) => (
                      <td
                        key={f}
                        className={f === 'value' ? `amount ${isLiability ? 'negative' : 'positive'}` : ''}
                      >
                        {f === 'value' ? formatMoney(Number(item[f] || 0)) : (item[f] || '—')}
                      </td>
                    ))}
                    <td className="actions">
                      <button title="Edit" onClick={() => onEdit(category.key, idx)}>✏️</button>
                      <button title="Delete" onClick={() => onDelete(category.key, idx)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', margin: '8px 0' }}>
              No items yet. Add your first one below.
            </p>
          )}
          <button className="add-item-btn" onClick={() => onAdd(category.key)}>
            + Add {category.label.replace(/s$/, '')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySection;
