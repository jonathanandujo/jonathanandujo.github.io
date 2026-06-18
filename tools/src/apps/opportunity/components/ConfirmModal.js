import React from 'react';

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) => {
  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">
        <h3>{title || 'Confirm'}</h3>
        <p className="confirm-message">{message || 'Are you sure?'}</p>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
