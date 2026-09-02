import Modal from './Modal'

export function ExpenseList({ expenses, contractors }) {
  return <div className="expense-list">
    {expenses.length ? expenses.slice().reverse().map((expense) => {
      const contractor = contractors.find((item) => item.contractor_id === expense.contractorId)
      return <div className="expense-row" key={expense.id}>
        <span className="expense-dot" />
        <span className="expense-copy"><strong>{expense.description || 'Contract payment'}</strong><small>{contractor?.contractor_name || 'Unknown contractor'} · {new Date(`${expense.date || expense.payment_date}T12:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</small></span>
        <strong className="expense-amount">{money(expense.amount)}</strong>
      </div>
    }) : <p className="empty-state">No expenses logged yet.</p>}
  </div>
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}
