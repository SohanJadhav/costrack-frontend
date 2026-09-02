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
                {money(contractor.contract_amount)} contract
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
  form,
  setForm,
  onSubmit,
  close,
}) {
  return (
    <Modal
      title="Add contractor expense"
      eyebrow={projectName}
      close={close}
      onSubmit={onSubmit}
    >
      <p className="modal-intro">
        Record a payment or expense made to the contractor.
      </p>

      <label>
        Contractor name *
        <input
          autoFocus
          required
          value={form.name}
          onChange={(event) =>
            setForm({ ...form, name: event.target.value })
          }
          placeholder="e.g. Sam Rivera"
        />
      </label>

      <label>
        Amount paid *
        <input
          type="number"
          required
          min="0"
          value={form.contract_amount}
          onChange={(event) =>
            setForm({
              ...form,
              contract_amount: event.target.value,
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
        value={form.work_description}
        onChange={(event) =>
          setForm({
            ...form,
            work_description: event.target.value,
          })
        }
        rows="3"
        placeholder="Describe the work or expense"
        style={{ width: '100%' }}
      />

      <label>
        Company name
        <input
          value={form.company_name}
          onChange={(event) =>
            setForm({
              ...form,
              company_name: event.target.value,
            })
          }
          placeholder="e.g. Rivera Build Works"
        />
      </label>

      <label>
        Phone
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={(event) =>
            setForm({
              ...form,
              phone: event.target.value
                .replace(/\D/g, '')
                .slice(0, 10),
            })
          }
          placeholder="e.g. 9876543210"
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm({
              ...form,
              email: event.target.value,
            })
          }
          placeholder="e.g. sam@example.com"
        />
      </label>

      <button type="submit" className="primary-button full">
        Add expense
      </button>
    </Modal>
  );
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}
