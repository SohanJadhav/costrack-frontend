import Modal from './Modal'

export function ExpenseList({ expenses, contractors, onDeletePayment }) {
  return <div className="expense-list">
    {expenses.length ? expenses.slice().reverse().map((expense) => {
      const contractor = contractors.find((item) => item.contractor_id === expense.contractorId)
      const mode = expense.paymentMode || expense.payment_mode || 'cash'
      const formattedDate = new Date(`${expense.date || expense.payment_date}T12:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })

      return <div className="expense-row" key={expense.id}>
        <span className="expense-dot" />
        <span className="expense-copy">
          <strong>{expense.description || 'Contract payment'}</strong>
          <small>{contractor?.contractor_name || 'Unknown contractor'} · {formattedDate} · {formatModeName(mode)}</small>
        </span>
        <strong className="expense-amount">{money(expense.amount)}</strong>
        {onDeletePayment && (
          <button
            type="button"
            className="row-delete-btn"
            title="Delete expense"
            aria-label={`Delete expense of ${money(expense.amount)}`}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDeletePayment(expense)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    }) : <p className="empty-state">No expenses logged yet.</p>}
  </div>
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

