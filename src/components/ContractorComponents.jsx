import { useState } from 'react'
import Modal from './Modal'

export function ContractorList({ contractors, payments = [], onEditPayment, onDeletePayment }) {
  const [expandedContractors, setExpandedContractors] = useState({})

  const toggleExpand = (contractorId) => {
    setExpandedContractors((prev) => ({
      ...prev,
      [contractorId]: prev[contractorId] === false ? true : false,
    }))
  }

  return (
    <div className="contractor-list">
      {contractors.length ? (
        contractors.map((contractor) => {
          const contractorPaymentsList = payments.filter(
            (p) => String(p.contractorId) === String(contractor.contractor_id)
          )
          const isExpanded = expandedContractors[contractor.contractor_id] !== false

          return (
            <div className="contractor-card-wrap" key={contractor.contractor_id}>
              <div
                className="contractor-row"
                onClick={() => contractorPaymentsList.length && toggleExpand(contractor.contractor_id)}
                style={{ cursor: contractorPaymentsList.length ? 'pointer' : 'default' }}
                title={contractorPaymentsList.length ? 'Click to toggle payments list' : undefined}
              >
                <span
                  className="avatar"
                  style={{
                    background:
                      contractor.contractor_id % 2
                        ? '#f3d4c5'
                        : '#cce5dc',
                  }}
                >
                  {(contractor.contractor_name || 'C')
                    .split(' ')
                    .map((word) => word[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>

                <span>
                  <strong>{contractor.contractor_name}</strong>
                  <small>
                    {money(contractor.total_paid || 0)} paid · {contractorPaymentsList.length} payment{contractorPaymentsList.length === 1 ? '' : 's'}
                  </small>
                </span>

                <span className="contractor-total">
                  <strong>{money(contractor.total_paid || 0)}</strong>
                  {contractorPaymentsList.length > 0 && (
                    <small className="toggle-label">
                      {isExpanded ? 'Hide payments ▴' : 'View payments ▾'}
                    </small>
                  )}
                </span>
              </div>

              {isExpanded && contractorPaymentsList.length > 0 && (
                <div className="contractor-sub-payments">
                  {contractorPaymentsList.map((payment) => {
                    const dateValue = payment.date || payment.payment_date
                    const formattedDate = dateValue
                      ? new Date(`${String(dateValue).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Date not set'
                    const mode = payment.paymentMode || payment.payment_mode || 'cash'

                    return (
                      <div className="contractor-sub-payment-row" key={payment.id}>
                        <span className="sub-payment-dot" />
                        <span className="sub-payment-info">
                          <strong>{payment.description || payment.note || 'Contractor payment'}</strong>
                          <small>{formattedDate} · {formatModeName(mode)}</small>
                        </span>
                        <strong className="sub-payment-amount">{money(payment.amount)}</strong>
                        <div className="row-action-btns">
                          {onEditPayment && (
                            <button
                              type="button"
                              className="row-edit-btn"
                              title="Edit payment"
                              aria-label={`Edit payment of ${money(payment.amount)}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                onEditPayment(payment)
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                          )}
                          {onDeletePayment && (
                            <button
                              type="button"
                              className="row-delete-btn"
                              title="Delete payment"
                              aria-label={`Delete payment of ${money(payment.amount)}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                onDeletePayment(payment)
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      ) : (
        <p className="empty-state">No contractors assigned yet.</p>
      )}
    </div>
  );
}


export function ContractorForm({
  projectName,
  contractors = [],
  form,
  setForm,
  onSubmit,
  close,
  isEdit = false,
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const today = new Date().toLocaleDateString('en-CA')
  const query = search.toLowerCase()
  const list = Array.isArray(contractors) ? contractors : []
  const filtered = query ? list.filter((c) => (c.name || '').toLowerCase().includes(query)) : list
  const selectedName = list.find((c) => String(c.id) === String(form.contractorId))?.name || ''

  function pick(id) {
    setForm({ ...form, contractorId: id })
    setSearch('')
    setOpen(false)
  }

  return (
    <Modal
      title={isEdit ? "Edit contractor payment" : "Pay contractor"}
      eyebrow={projectName}
      close={close}
      onSubmit={onSubmit}
    >
      <p className="modal-intro">
        {isEdit ? "Update details of this payment made to the contractor." : "Log a payment made to an assigned contractor."}
      </p>

      <label>
        Select contractor *
        <div className="combo-wrap">
          <input
            className="combo-input"
            type="text"
            placeholder={selectedName || 'Search or select contractor…'}
            value={search || (open ? '' : selectedName)}
            onChange={(e) => {
              setSearch(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            readOnly={false}
          />
          {open && (
            <ul className="combo-list">
              {filtered.length ? filtered.map((c) => (
                <li
                  key={c.id}
                  className={`combo-item ${String(c.id) === String(form.contractorId) ? 'selected' : ''}`}
                  onMouseDown={() => pick(c.id)}
                >
                  {c.name} {c.firm_name ? `(${c.firm_name})` : ''}
                </li>
              )) : <li className="combo-empty">No contractors found</li>}
            </ul>
          )}
        </div>
        {/* hidden input to satisfy required validation */}
        <input type="hidden" required value={form.contractorId} />
      </label>

      <label>
        Amount paid *
        <input
          type="number"
          required
          min="0"
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
          placeholder="e.g. 250000"
        />
      </label>

      <label>
        Payment date *
        <input
          type="date"
          required
          max={today}
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
        />
      </label>

      <label>
        Mode
        <select
          value={form.paymentMode || 'cash'}
          onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
        >
          <option value="cash">Cash</option>
          <option value="online">Online</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
      </label>

      <label>
        Description *
      </label>

      <textarea
        required
        value={form.description}
        onChange={(event) => setForm({ ...form, description: event.target.value })}
        rows="3"
        placeholder="Describe the work or payment"
        style={{ width: '100%' }}
      />

      <button type="submit" className="primary-button full">
        {isEdit ? "Update payment" : "Pay contractor"}
      </button>
    </Modal>
  );
}


export function ContractorDirectory({ contractors, onAdd, onEdit }) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const filtered = query
    ? contractors.filter((c) =>
        (c.name || '').toLowerCase().includes(query) ||
        (c.firm_name || '').toLowerCase().includes(query) ||
        (c.phone_number || '').toLowerCase().includes(query) ||
        (c.firm_address || '').toLowerCase().includes(query)
      )
    : contractors

  return (
    <section className="directory-page">
      <div className="directory-header">
        <div>
          <span className="eyebrow">Directory</span>
          <h2>Contractors <span className="count">{filtered.length}</span></h2>
          <p>Manage your contractor contacts and payment records.</p>
        </div>
        <div className="dir-actions">
          <input
            className="dir-search"
            type="search"
            placeholder="Search contractors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search contractors"
          />
          <button type="button" className="primary-button" onClick={onAdd}>+ Add contractor</button>
        </div>
      </div>
      <div className="contractor-table-wrap">
        {filtered.length ? (
          <table className="contractor-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Firm name</th>
                <th>Phone number</th>
                <th>Firm address</th>
                <th>Description</th>
                {onEdit && <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((contractor) => (
                <tr key={contractor.id}>
                  <td><strong>{contractor.name}</strong></td>
                  <td>{contractor.firm_name || '—'}</td>
                  <td>{contractor.phone_number || '—'}</td>
                  <td>{contractor.firm_address || '—'}</td>
                  <td>{contractor.description || '—'}</td>
                  {onEdit && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="row-edit-btn"
                        title="Edit contractor"
                        aria-label={`Edit ${contractor.name}`}
                        onClick={() => onEdit(contractor)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-state">{query ? 'No contractors match your search.' : 'No contractors saved yet.'}</p>}
      </div>
    </section>
  )
}


export function NewContractorForm({ form, setForm, onSubmit, close, isEdit = false }) {
  return (
    <Modal title={isEdit ? "Edit contractor" : "New contractor"} eyebrow="Contractors" close={close} onSubmit={onSubmit}>
      <p className="modal-intro">
        {isEdit ? "Update contractor profile and contact information." : "Save contractor details for future project payments."}
      </p>

      <label>
        Name *
        <input required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Sam Rivera" />
      </label>

      <label>
        Firm name
        <input value={form.firm_name} onChange={(event) => setForm({ ...form, firm_name: event.target.value })} placeholder="e.g. Rivera Build Works" />
      </label>

      <label>
        Phone number
        <input type="tel" inputMode="numeric" value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="e.g. 9876543210" maxLength={10} />
      </label>

      <label>
        Firm address
        <input value={form.firm_address} onChange={(event) => setForm({ ...form, firm_address: event.target.value })} placeholder="e.g. 12 Main Street" />
      </label>

      <label>
        Description
        <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Trade or work speciality" rows="3" style={{ width: '100%' }} />
      </label>

      <button type="submit" className="primary-button full">
        {isEdit ? "Update contractor" : "Save contractor"}
      </button>
    </Modal>
  )
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}

function formatModeName(mode) {
  if (!mode) return 'Cash'
  const clean = String(mode).trim().toLowerCase()
  switch (clean) {
    case 'cash':
      return 'Cash'
    case 'online':
      return 'Online'
    case 'upi':
      return 'UPI'
    case 'bank_transfer':
    case 'bank transfer':
      return 'Bank Transfer'
    case 'cheque':
      return 'Cheque'
    case 'card':
      return 'Card'
    default:
      return clean.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

