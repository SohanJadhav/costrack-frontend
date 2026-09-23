export default function Modal({ title, eyebrow, close, onSubmit, children }) {
  return <div className="modal-backdrop">
    <form className="modal" onSubmit={onSubmit}>
      <button type="button" className="close" onClick={close}>×</button>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p className="modal-intro">Keep your project costs organized in one place.</p>
      {children}
    </form>
  </div>
}

export function ConfirmModal({ title = 'Confirm Delete', eyebrow = 'Confirmation', message, onConfirm, onCancel, confirmText = 'Delete', isSubmitting = false }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onCancel} aria-label="Close">×</button>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p className="modal-intro">{message || 'Are you sure you want to delete this payment? This action cannot be undone.'}</p>
        <div className="confirm-modal-actions">
          <button type="button" className="outline-button" onClick={onCancel} disabled={isSubmitting}>Cancel</button>
          <button
            type="button"
            className="primary-button danger-button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onConfirm()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

