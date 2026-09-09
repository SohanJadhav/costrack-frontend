import Modal from './Modal'

export function PaymentList({ payments }) {
  return <div className="payment-list">
    {payments.length ? payments.slice().reverse().map((payment) => <div className="payment-row" key={payment.id}>
      <span className="payment-dot">+</span>
      <span className="payment-copy"><strong>{payment.note || payment.description || 'Payment received'}</strong><small>{new Date(`${payment.date || payment.payment_date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small></span>
      <strong className="payment-amount">{money(payment.amount)}</strong>
    </div>) : <p className="empty-state">No payments received yet.</p>}
  </div>
}

export function PaymentForm({ projectName, form, setForm, onSubmit, close }) {
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
          value={form.date}
          onChange={(event) =>
            setForm({ ...form, date: event.target.value })
          }
        />
      </label>

      <label>
        Mode
        <select
          value={form.paymentMode}
          onChange={(event) =>
            setForm({ ...form, paymentMode: event.target.value })
          }
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
          <option value="upi">UPI</option>
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
