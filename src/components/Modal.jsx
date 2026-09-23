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

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function BackupModal({ result, isLoading, onDownload, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal backup-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close" onClick={onClose} aria-label="Close">×</button>
        <span className="eyebrow">Database Backup</span>
        
        {isLoading ? (
          <div className="backup-loading-state">
            <div className="backup-modal-spinner" />
            <h2>Uploading to Google Drive...</h2>
            <p className="modal-intro">Taking a snapshot of SQLite database and uploading to Google Drive for <strong>costtracker07@gmail.com</strong>.</p>
          </div>
        ) : result?.success ? (
          <div className="backup-success-state">
            <div className="backup-success-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ca68c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Backup Successful!</h2>
            <p className="modal-intro">The database has been backed up and shared with <strong>{result.shared_email || 'costtracker07@gmail.com'}</strong>.</p>
            
            <div className="backup-details-card">
              <div className="backup-detail-row">
                <span>Backup File:</span>
                <strong>{result.file_name}</strong>
              </div>
              <div className="backup-detail-row">
                <span>File Size:</span>
                <strong>{formatBytes(result.file_size)}</strong>
              </div>
              <div className="backup-detail-row">
                <span>Destination:</span>
                <strong>{result.shared_email || 'costtracker07@gmail.com'}</strong>
              </div>
              <div className="backup-detail-row">
                <span>Timestamp:</span>
                <strong>{new Date(result.backup_time || Date.now()).toLocaleString()}</strong>
              </div>
            </div>

            <div className="backup-modal-actions">
              {result.drive_link && (
                <a
                  href={result.drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View in Google Drive
                </a>
              )}
              <button type="button" className="outline-button" onClick={onDownload}>
                Download .db File
              </button>
              <button type="button" className="outline-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="backup-error-state">
            <div className="backup-error-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d94343" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Drive Upload Notice</h2>
            <p className="modal-intro">{result?.message || result?.error || 'Unable to upload backup to Google Drive.'}</p>
            
            <div className="backup-instructions-box">
              <strong>Google Drive Setup:</strong>
              <p>To enable direct Google Drive sync to <code>costtracker07@gmail.com</code>, place your Google Cloud <code>service-account.json</code> key inside <code>costrack-backend/</code>.</p>
            </div>

            <div className="backup-modal-actions">
              <button type="button" className="primary-button" onClick={onDownload}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download .db Backup
              </button>
              <button type="button" className="outline-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
