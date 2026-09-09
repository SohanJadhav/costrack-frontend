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
  contractors,
  form,
  setForm,
  onSubmit,
  close,
}) {
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
        <select required autoFocus value={form.contractorId} onChange={(event) => setForm({ ...form, contractorId: event.target.value })}>
          <option value="">Select contractor</option>
          {contractors.map((contractor) => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
        </select>
      </label>

      <label>
        Amount paid *
        <input
          type="number"
          required
          min="0"
          value={form.amount}
          onChange={(event) =>
            setForm({
              ...form,
              amount: event.target.value,
            })
          }
          placeholder="e.g. 250000"
        />
      </label>

      <label>
        Payment date *
        <input
          type="date"
          required
          value={form.date}
          onChange={(event) =>
            setForm({
              ...form,
              date: event.target.value,
            })
          }
        />
      </label>

      <label>
        Description *
      </label>

      <textarea
        required
        value={form.description}
        onChange={(event) =>
          setForm({
            ...form,
            description: event.target.value,
          })
        }
        rows="3"
        placeholder="Describe the work or payment"
        style={{ width: '100%' }}
      />

      <label>
        Firm name
        <input
          value={form.firm_name}
          onChange={(event) =>
            setForm({
                ...form,
                firm_name: event.target.value,
            })
          }
          placeholder="e.g. Rivera Build Works"
        />
      </label>

      <label>
        Firm address
        <input
          value={form.firm_address}
          onChange={(event) => setForm({ ...form, firm_address: event.target.value })}
          placeholder="e.g. 12 Main Street"
        />
      </label>

      <button type="submit" className="primary-button full">
        Add expense
      </button>
    </Modal>
  );
}

export function ContractorDirectory({ contractors, onAdd, close }) {
  return (
    <Modal title="Contractors" eyebrow="Directory" close={close} onSubmit={(event) => event.preventDefault()}>
      <div className="section-actions">
        <span className="modal-intro">{contractors.length} contractor{contractors.length === 1 ? '' : 's'} saved</span>
        <button type="button" className="primary-button" onClick={onAdd}>+ Add contractor</button>
      </div>
      <div className="contractor-list">
        {contractors.length ? contractors.map((contractor) => (
          <div className="contractor-row" key={contractor.id}>
            <span className="avatar">{(contractor.name || 'C').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span><strong>{contractor.name}</strong><small>{contractor.firm_name || 'Independent contractor'}</small></span>
            <span className="contractor-total"><small>{contractor.phone_number || 'No phone'}</small></span>
          </div>
        )) : <p className="empty-state">No contractors saved yet.</p>}
      </div>
    </Modal>
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
