import Modal from './Modal'

export function PaymentList({ payments, onDeletePayment }) {
  const entries = Array.isArray(payments) ? payments.slice().reverse() : []

  return <div className="payment-list">
    {entries.length ? entries.map((payment) => {
      const dateValue = payment.date || payment.payment_date
      const formattedDate = dateValue
        ? new Date(`${String(dateValue).slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date not set'
      const mode = payment.paymentMode || payment.payment_mode || 'cash'
      const modeLabel = formatModeName(mode)

      return <div className="payment-row" key={payment.id}>
        <span className="payment-date-badge" aria-hidden="true">₹</span>
        <span className="payment-copy">
          <strong>{payment.note || payment.description || 'Payment received'}</strong>
          <small>{formattedDate}<span className="payment-meta-separator">·</span>{modeLabel}</small>
        </span>
        <strong className="payment-amount">{money(payment.amount)}</strong>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    }) : <div className="payment-empty"><span className="payment-empty-icon">+</span><strong>No payments received yet</strong><small>Owner installments will appear here.</small></div>}
  </div>
}


export function PaymentForm({ projectName, form, setForm, onSubmit, close }) {
  const today = new Date().toLocaleDateString('en-CA')

  return (
    <Modal
      title="Add received payment"
      eyebrow={projectName}
      close={close}
      onSubmit={onSubmit}
    >
      <p className="modal-intro">
        Record an installment received from the project owner.
      </p>

      <label>
        Amount received *
        <input
          type="number"
          required
          min="1"
          value={form.amount}
          onChange={(event) =>
            setForm({ ...form, amount: event.target.value })
          }
          placeholder="e.g. 100000"
        />
      </label>

      <label>
        Received on
        <input
          type="date"
          max={today}
          value={form.date}
          onChange={(event) =>
            setForm({ ...form, date: event.target.value })
          }
        />
      </label>

      <label>
        Mode
        <select
          value={form.paymentMode || 'cash'}
          onChange={(event) =>
            setForm({ ...form, paymentMode: event.target.value })
          }
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
        Payment note
        <input
          value={form.note}
          onChange={(event) =>
            setForm({ ...form, note: event.target.value })
          }
          placeholder="e.g. First installment"
        />
      </label>

      <button type="submit" className="primary-button full">
        Save payment
      </button>
    </Modal>
  );
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
