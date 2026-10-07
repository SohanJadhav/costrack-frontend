import { useState, useEffect, useMemo, useCallback } from 'react'
import './TransactionSheet.css'

function money(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(isoOrDateStr) {
  if (!isoOrDateStr) return '—'
  try {
    const d = new Date(String(isoOrDateStr).slice(0, 10) + 'T12:00:00')
    if (Number.isNaN(d.getTime())) return isoOrDateStr
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoOrDateStr
  }
}

function formatPaymentMode(mode) {
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

export function TransactionSheet({ apiBase = '/api/v1', projects = [], contractors = [] }) {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const firstOfMonthStr = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
  }, [])

  const [startDate, setStartDate] = useState(firstOfMonthStr)
  const [endDate, setEndDate] = useState(todayStr)
  const [activePreset, setActivePreset] = useState('this-month')
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'debit' | 'credit'
  const [selectedProject, setSelectedProject] = useState('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' | 'asc'
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('start_date', startDate)
      if (endDate) params.set('end_date', endDate)
      if (sortOrder) params.set('order', sortOrder)

      const response = await fetch(`${apiBase}/payments?${params.toString()}`)
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error?.message || `Failed to fetch sheet data (${response.status})`)
      }
      const data = await response.json()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Could not load sheet transactions.')
    } finally {
      setIsLoading(false)
    }
  }, [apiBase, startDate, endDate, sortOrder])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Quick Preset Handlers
  const applyPreset = (preset) => {
    setActivePreset(preset)
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()

    if (preset === 'this-month') {
      setStartDate(new Date(y, m, 1).toISOString().slice(0, 10))
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === 'last-month') {
      const firstLastMonth = new Date(y, m - 1, 1).toISOString().slice(0, 10)
      const lastLastMonth = new Date(y, m, 0).toISOString().slice(0, 10)
      setStartDate(firstLastMonth)
      setEndDate(lastLastMonth)
    } else if (preset === 'this-year') {
      setStartDate(`${y}-01-01`)
      setEndDate(now.toISOString().slice(0, 10))
    } else if (preset === 'all-time') {
      setStartDate('')
      setEndDate('')
    }
  }

  const handleStartDateChange = (val) => {
    setStartDate(val)
    setActivePreset('custom')
  }

  const handleEndDateChange = (val) => {
    setEndDate(val)
    setActivePreset('custom')
  }

  const handleResetFilters = () => {
    applyPreset('this-month')
    setSelectedType('all')
    setSelectedProject('all')
    setSearch('')
    setSortOrder('desc')
  }

  // Filtered transactions for display
  const filteredTransactions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions.filter((t) => {
      // Type filter
      if (selectedType !== 'all' && t.type !== selectedType) {
        return false
      }
      // Project filter
      if (selectedProject !== 'all' && String(t.project_id) !== String(selectedProject)) {
        return false
      }
      // Search query
      if (q) {
        const matchProject = (t.project_name || '').toLowerCase().includes(q)
        const matchContractor = (t.contractor_name || '').toLowerCase().includes(q)
        const matchDesc = (t.description || '').toLowerCase().includes(q)
        const matchAccount = (t.firm_account_name || '').toLowerCase().includes(q)
        const matchMode = (t.payment_mode || '').toLowerCase().includes(q)
        const matchAmount = String(t.amount || '').includes(q)
        return (
          matchProject ||
          matchContractor ||
          matchDesc ||
          matchAccount ||
          matchMode ||
          matchAmount
        )
      }
      return true
    })
  }, [transactions, selectedType, selectedProject, search])

  // Aggregate totals
  const { totalDebit, totalCredit, netBalance, debitCount, creditCount } = useMemo(() => {
    let debit = 0
    let credit = 0
    let dCount = 0
    let cCount = 0
    filteredTransactions.forEach((t) => {
      if (t.type === 'debit') {
        debit += Number(t.debit || t.amount || 0)
        dCount++
      } else {
        credit += Number(t.credit || t.amount || 0)
        cCount++
      }
    })
    return {
      totalDebit: debit,
      totalCredit: credit,
      netBalance: credit - debit,
      debitCount: dCount,
      creditCount: cCount,
    }
  }, [filteredTransactions])

  // Download CSV
  const handleDownloadCSV = () => {
    if (!filteredTransactions.length) {
      alert('No transaction records to export.')
      return
    }

    const headers = [
      'Date',
      'Type',
      'Project',
      'Contractor / Party',
      'Description',
      'Transaction Account',
      'Payment Mode',
      'Debit (Expense ₹)',
      'Credit (Received ₹)',
      'Amount (₹)',
    ]

    const escapeCSV = (val) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replaceAll('"', '""')}"`
      }
      return str
    }

    const rows = filteredTransactions.map((item) => {
      const isDebit = item.type === 'debit'
      const party = isDebit ? (item.contractor_name || 'Contractor') : 'Project Owner'
      const typeLabel = isDebit ? 'Debit (Expense)' : 'Credit (Received)'
      const debit = isDebit ? item.amount : 0
      const credit = !isDebit ? item.amount : 0

      return [
        item.date || String(item.payment_date || '').slice(0, 10),
        typeLabel,
        item.project_name || '',
        party,
        item.description || '',
        item.firm_account_name || '',
        formatPaymentMode(item.payment_mode),
        debit,
        credit,
        item.amount,
      ]
    })

    // Totals row at the bottom
    rows.push([
      'TOTAL',
      '',
      '',
      '',
      '',
      '',
      '',
      totalDebit,
      totalCredit,
      totalDebit + totalCredit,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(escapeCSV).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    const filename = `costtrack_sheet_${startDate || 'all'}_to_${endDate || 'all'}.csv`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Report PDF
  const handlePrintSheet = () => {
    const printWindow = window.open('', '_blank', 'width=1050,height=850')
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to export the sheet as PDF.')
      return
    }

    const rowsHtml = filteredTransactions
      .map((item) => {
        const isDebit = item.type === 'debit'
        const party = isDebit ? (item.contractor_name || 'Contractor') : 'Client Installment'
        const badgeClass = isDebit ? 'badge-debit' : 'badge-credit'
        const typeText = isDebit ? 'Debit' : 'Credit'

        return `
        <tr>
          <td>${formatDate(item.payment_date || item.date)}</td>
          <td><span class="badge ${badgeClass}">${typeText}</span></td>
          <td><strong>${item.project_name || '—'}</strong></td>
          <td>${party}</td>
          <td class="desc-cell">${item.description || '—'}</td>
          <td>${item.firm_account_name || '—'}</td>
          <td>${formatPaymentMode(item.payment_mode)}</td>
          <td class="num debit-num">${isDebit ? money(item.amount) : '—'}</td>
          <td class="num credit-num">${!isDebit ? money(item.amount) : '—'}</td>
        </tr>
      `
      })
      .join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CostTrack – Complete Statement Sheet</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 32px; color: #1f1f1f; font-size: 12px; }
            .header { border-bottom: 2px solid #e77b54; padding-bottom: 16px; margin-bottom: 22px; }
            .eyebrow { text-transform: uppercase; letter-spacing: 1.5px; color: #7d766d; font-size: 10px; font-weight: 700; }
            h1 { margin: 6px 0 4px; font-size: 24px; color: #272724; }
            .meta { color: #6b655d; font-size: 12px; margin-top: 5px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0 24px; }
            .card { border: 1px solid #e8e0d8; border-radius: 6px; padding: 14px; background: #fffaf6; }
            .card.debit-card { background: #fdf5f3; border-color: #f7d5cc; }
            .card.credit-card { background: #f3faf7; border-color: #d1eee3; }
            .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #756f68; font-weight: 600; }
            .value { font-size: 20px; font-weight: 700; margin-top: 6px; font-family: 'DM Mono', monospace; }
            .val-debit { color: #c04928; }
            .val-credit { color: #1f7a37; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
            th, td { padding: 9px 8px; border-bottom: 1px solid #ece6df; text-align: left; vertical-align: middle; }
            th { background: #f6f2ec; color: #55514a; text-transform: uppercase; font-size: 10px; letter-spacing: 0.8px; font-family: 'DM Mono', monospace; }
            .num { text-align: right; font-weight: 600; font-family: 'DM Mono', monospace; }
            .debit-num { color: #c04928; }
            .credit-num { color: #1f7a37; }
            .desc-cell { max-width: 280px; word-break: break-word; }
            .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
            .badge-debit { background: #fee8df; color: #c04928; }
            .badge-credit { background: #e3f9e5; color: #1f7a37; }
            tr.total-row td { background: #fcf4ee; font-weight: 700; border-top: 2px solid #e77b54; font-size: 12px; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 15px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="eyebrow">Financial Statement Sheet</div>
            <h1>CostTrack Complete Sheet</h1>
            <div class="meta">
              Period: ${startDate ? formatDate(startDate) : 'Earliest'} to ${endDate ? formatDate(endDate) : 'Latest'} • 
              Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • 
              ${filteredTransactions.length} transactions
            </div>
          </div>
          <div class="summary-grid">
            <div class="card credit-card">
              <div class="label">Total Received (Credit)</div>
              <div class="value val-credit">${money(totalCredit)}</div>
            </div>
            <div class="card debit-card">
              <div class="label">Total Expenses (Debit)</div>
              <div class="value val-debit">${money(totalDebit)}</div>
            </div>
            <div class="card">
              <div class="label">Net Balance</div>
              <div class="value ${netBalance >= 0 ? 'val-credit' : 'val-debit'}">${money(netBalance)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Project</th>
                <th>Party</th>
                <th>Description</th>
                <th>Account</th>
                <th>Mode</th>
                <th class="num">Debit (₹)</th>
                <th class="num">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="7">Total</td>
                <td class="num debit-num">${money(totalDebit)}</td>
                <td class="num credit-num">${money(totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }

  return (
    <>
      {/* Top summary cards matching Overview */}
      <section className="summary-grid">
        <div className="summary-card">
          <span>Total Received (Credit)</span>
          <strong>{money(totalCredit)}</strong>
          <small><em className="green">●</em> {creditCount} client payment{creditCount === 1 ? '' : 's'}</small>
        </div>
        <div className="summary-card warm">
          <span>Total Expenses (Debit)</span>
          <strong>{money(totalDebit)}</strong>
          <small><em>↘</em> {debitCount} contractor payment{debitCount === 1 ? '' : 's'}</small>
        </div>
        <div className="summary-card">
          <span>Net Balance</span>
          <strong style={{ color: netBalance >= 0 ? 'var(--green, #4ca68c)' : '#c0532e' }}>
            {money(netBalance)}
          </strong>
          <small>
            <em className={netBalance >= 0 ? 'green' : 'blue'}>●</em>{' '}
            {netBalance >= 0 ? 'Net Cash Surplus' : 'Net Cash Deficit'}
          </small>
        </div>
      </section>

      {/* Directory-Page Container matching ContractorDirectory & ProjectDirectory */}
      <section className="directory-page">
        <div className="directory-header">
          <div>
            <span className="eyebrow">Financial Ledger</span>
            <h2>
              Complete Sheet <span className="count">{filteredTransactions.length}</span>
            </h2>
            <p>Consolidated cashbook tracking project client installments and contractor payments.</p>
          </div>
          <div className="dir-actions">
            <input
              className="dir-search"
              type="search"
              placeholder="Search sheet…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search sheet"
            />
            <button
              type="button"
              className="outline-button"
              onClick={handleDownloadCSV}
              title="Download CSV"
            >
              Download CSV
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={handlePrintSheet}
              title="Export PDF"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="sheet-filters-bar">
          <div className="sheet-filters-left">
            <div className="sheet-date-filter-group">
              <span>From:</span>
              <input
                type="date"
                className="sheet-date-input"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                aria-label="Start date"
              />
              <span>To:</span>
              <input
                type="date"
                className="sheet-date-input"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                aria-label="End date"
              />
            </div>

            <div className="sheet-preset-buttons">
              <button
                type="button"
                className={`sheet-preset-btn ${activePreset === 'this-month' ? 'active' : ''}`}
                onClick={() => applyPreset('this-month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`sheet-preset-btn ${activePreset === 'last-month' ? 'active' : ''}`}
                onClick={() => applyPreset('last-month')}
              >
                Last Month
              </button>
              <button
                type="button"
                className={`sheet-preset-btn ${activePreset === 'this-year' ? 'active' : ''}`}
                onClick={() => applyPreset('this-year')}
              >
                This Year
              </button>
              <button
                type="button"
                className={`sheet-preset-btn ${activePreset === 'all-time' ? 'active' : ''}`}
                onClick={() => applyPreset('all-time')}
              >
                All Time
              </button>
            </div>
          </div>

          <div className="sheet-filters-right">
            <select
              className="filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              <option value="debit">Expenses (Debit)</option>
              <option value="credit">Received (Credit)</option>
            </select>

            {projects.length > 0 && (
              <select
                className="filter-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                aria-label="Filter by project"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="outline-button"
              style={{ padding: '7px 11px', fontSize: '11px' }}
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              title={`Sort by date: currently ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
            >
              Date {sortOrder === 'desc' ? '↓' : '↑'}
            </button>

            <button
              type="button"
              className="outline-button"
              style={{ padding: '7px 11px', fontSize: '11px' }}
              onClick={handleResetFilters}
              title="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>

        {error && <div className="error-banner" style={{ margin: '0 0 20px 0' }}>{error}</div>}

        {/* Table structured exactly as contractor-table */}
        <div className="contractor-table-wrap">
          {filteredTransactions.length ? (
            <table className="contractor-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Date</th>
                  <th style={{ width: '90px' }}>Type</th>
                  <th>Project</th>
                  <th>Party</th>
                  <th className="col-description">Description</th>
                  <th>Account</th>
                  <th style={{ width: '90px' }}>Mode</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Debit (Expense)</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Credit (Received)</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isDebit = tx.type === 'debit'
                  return (
                    <tr key={tx.reference_id || `${tx.type}-${tx.id}`}>
                      <td>{formatDate(tx.payment_date || tx.date)}</td>
                      <td>
                        <span className={`sheet-type-badge ${isDebit ? 'debit' : 'credit'}`}>
                          {isDebit ? 'Debit' : 'Credit'}
                        </span>
                      </td>
                      <td>
                        <strong>{tx.project_name || '—'}</strong>
                      </td>
                      <td>
                        {isDebit ? (
                          <span>{tx.contractor_name || '—'}</span>
                        ) : (
                          <span>Client Installment</span>
                        )}
                      </td>
                      <td className="cell-description" title={tx.description || ''}>
                        <span className="truncate-text">{tx.description || '—'}</span>
                      </td>
                      <td>{tx.firm_account_name || '—'}</td>
                      <td>{formatPaymentMode(tx.payment_mode)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {isDebit ? (
                          <span className="sheet-amount debit">{money(tx.amount)}</span>
                        ) : (
                          <span className="sheet-dash">—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {!isDebit ? (
                          <span className="sheet-amount credit">{money(tx.amount)}</span>
                        ) : (
                          <span className="sheet-dash">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="7" className="total-title">
                    Total ({filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'})
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="sheet-amount debit">{money(totalDebit)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="sheet-amount credit">{money(totalCredit)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="empty-state">
              {isLoading
                ? 'Loading sheet transactions…'
                : 'No transactions match your search or filters.'}
            </p>
          )}
        </div>
      </section>
    </>
  )
}

export default TransactionSheet
