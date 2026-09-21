import { useState } from 'react'
import Modal from './Modal'

export function ContractorList({ contractors }) {
  return (
    <div className="contractor-list">
      {contractors.length ? (
        contractors.map((contractor) => (
          <div className="contractor-row" key={contractor.contractor_id}>
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
                {money(contractor.total_paid || 0)} paid
              </small>
            </span>

            <span className="contractor-total">
              <strong>{money(contractor.total_paid || 0)}</strong>
              {contractor.payment_date && (
                <small>
                  Paid on {contractor.payment_date}
                </small>
              )}
            </span>
          </div>
        ))
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
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
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
      title="Pay contractor"
      eyebrow={projectName}
      close={close}
      onSubmit={onSubmit}
    >
      <p className="modal-intro">
        Record a payment made to a contractor for this project.
      </p>

      <label>
        Contractor *
        <div className="combo-wrap">
          <input
            className="combo-input"
            required
            autoFocus
            placeholder={selectedName || 'Search contractor…'}
            value={open ? search : selectedName}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          />
          {open && (
            <ul className="combo-list">
              {filtered.length ? filtered.map((c) => (
                <li
                  key={c.id}
                  className={`combo-item${String(form.contractorId) === String(c.id) ? ' selected' : ''}`}
                  onMouseDown={() => pick(c.id)}
                >
                  {c.name}
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
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
        />
      </label>

      <label>
        Payment mode
        <select
          value={form.paymentMode || ''}
          onChange={(event) => setForm({ ...form, paymentMode: event.target.value })}
        >
          <option value="">— optional —</option>
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="upi">UPI</option>
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
        Pay contractor
      </button>
    </Modal>
  );
}


export function ContractorDirectory({ contractors, onAdd }) {
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
              <tr><th>Name</th><th>Firm name</th><th>Phone number</th><th>Firm address</th><th>Description</th></tr>
            </thead>
            <tbody>
              {filtered.map((contractor) => (
                <tr key={contractor.id}>
                  <td><strong>{contractor.name}</strong></td>
                  <td>{contractor.firm_name || '—'}</td>
                  <td>{contractor.phone_number || '—'}</td>
                  <td>{contractor.firm_address || '—'}</td>
                  <td>{contractor.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-state">{query ? 'No contractors match your search.' : 'No contractors saved yet.'}</p>}
      </div>
    </section>
  )
}


export function NewContractorForm({ form, setForm, onSubmit, close }) {
  return (
    <Modal title="New contractor" eyebrow="Contractors" close={close} onSubmit={onSubmit}>
      <p className="modal-intro">Save contractor details for future project payments.</p>

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

      <button type="submit" className="primary-button full">Save contractor</button>
    </Modal>
  )
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}
