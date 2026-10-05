import { useState } from 'react'
import Modal from './Modal'

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function FirmAccountDirectory({ firmAccounts = [], onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const filtered = query
    ? firmAccounts.filter(
        (fa) =>
          (fa.name || '').toLowerCase().includes(query) ||
          (fa.description || '').toLowerCase().includes(query) ||
          (fa.status || '').toLowerCase().includes(query)
      )
    : firmAccounts

  return (
    <section className="directory-page">
      <div className="directory-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h2>
            Firm Accounts <span className="count">{filtered.length}</span>
          </h2>
          <p>Manage firm profiles, descriptions, and account statuses.</p>
        </div>
        <div className="dir-actions">
          <input
            className="dir-search"
            type="search"
            placeholder="Search firm accounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search firm accounts"
          />
          {onAdd && (
            <button type="button" className="primary-button" onClick={onAdd}>
              + Add firm account
            </button>
          )}
        </div>
      </div>

      <div className="contractor-table-wrap">
        {filtered.length ? (
          <table className="contractor-table">
            <thead>
              <tr>
                <th>Firm Name</th>
                <th className="col-description">Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                {(onEdit || onDelete) && (
                  <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const isActive = account.status === 'active'
                return (
                  <tr key={account.id}>
                    <td>
                      <strong>{account.name}</strong>
                    </td>
                    <td className="cell-description" title={account.description || ''}>
                      <span className="truncate-text">{account.description || '—'}</span>
                    </td>
                    <td>
                      <span
                        className={`status-pill ${isActive ? 'status-active' : 'status-inactive'}`}
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'capitalize',
                          backgroundColor: isActive ? '#e3f9e5' : '#fbeae5',
                          color: isActive ? '#1f7a37' : '#c93b2b',
                        }}
                      >
                        {account.status || 'active'}
                      </span>
                    </td>
                    <td>{formatDate(account.created_at)}</td>
                    <td>{formatDate(account.updated_at)}</td>
                    {(onEdit || onDelete) && (
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {onEdit && (
                          <button
                            type="button"
                            className="row-edit-btn"
                            title="Edit firm account"
                            aria-label={`Edit ${account.name}`}
                            onClick={() => onEdit(account)}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            className="row-edit-btn"
                            style={{ color: '#d9534f', marginLeft: '6px' }}
                            title="Delete firm account"
                            aria-label={`Delete ${account.name}`}
                            onClick={() => onDelete(account)}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">
            {query ? 'No firm accounts match your search.' : 'No firm accounts saved yet.'}
          </p>
        )}
      </div>
    </section>
  )
}

export function FirmAccountForm({ form, setForm, onSubmit, close, error, isEdit = false }) {
  return (
    <Modal
      title={isEdit ? 'Edit firm account' : 'New firm account'}
      eyebrow="Firm Accounts"
      close={close}
      onSubmit={onSubmit}
    >
      <p className="modal-intro">
        {isEdit
          ? 'Update firm details, description, and status.'
          : 'Save firm details and account information.'}
      </p>

      {error && (
        <div
          className="error-banner"
          style={{
            background: '#fee8df',
            color: '#c0532e',
            border: '1px solid #f9c7b4',
            padding: '8px 12px',
            borderRadius: '5px',
            fontSize: '11px',
            marginBottom: '14px',
          }}
        >
          {error}
        </div>
      )}

      <label>
        Firm name *
        <input
          required
          autoFocus
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="e.g. Apex Infrastructure Pvt Ltd"
        />
      </label>

      <label>
        Status
        <select
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid #dcd4cc',
            background: '#fff',
            fontSize: '14px',
            marginTop: '4px',
          }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive (Disabled)</option>
        </select>
      </label>

      <label>
        Description
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Firm specialization, business notes, or account remarks"
          rows="3"
          style={{ width: '100%' }}
        />
      </label>

      <button type="submit" className="primary-button full">
        {isEdit ? 'Update firm account' : 'Save firm account'}
      </button>
    </Modal>
  )
}

