import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ContractorDirectory, ContractorForm, ContractorList, NewContractorForm } from './components/ContractorComponents'
import { ExpenseList } from './components/ExpenseComponents'
import { PaymentForm, PaymentList } from './components/PaymentComponents'
import { ProjectDirectory, ProjectForm, ProjectList } from './components/ProjectComponents'
import Login from './components/Login'

const API_BASE = 'http://localhost:8080/api/v1'
const today = new Date().toISOString().slice(0, 10)

function normalizeProject(project) {
  return {
    id: project.id,
    name: project.name,
    owner_name: project.owner_name || '',
    phone_number: project.phone_number || '',
    address: project.address || '',
    estimated_cost: project.estimated_cost == null ? '' : Number(project.estimated_cost),
    location: project.address || 'Address not set',
    description: project.description || '',
    start_date: project.start_date || today,
    color: ['#e77b54', '#4ca68c', '#d2915d', '#5d9cc7'][project.id % 4] || '#e77b54',
  }
}

function normalizeContractorSummary(item) {
  return {
    contractor_id: item.contractor_id,
    contractor_name: item.contractor_name,
    contract_amount: Number(item.contract_amount || 0),
    total_paid: Number(item.total_paid || 0),
    balance: Number(item.balance || 0),
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

function normalizePayment(item, contractorId) {
  const dateValue = item.payment_date || item.date || today
  const mode = item.payment_mode || item.paymentMode || item.mode || item.PaymentMode || 'cash'
  return {
    id: item.id,
    contractorId: item.contractor_id ?? item.contractorId ?? contractorId,
    projectId: item.project_id ?? item.projectId,
    paymentType: item.payment_type || item.paymentType || 'contractor',
    amount: Number(item.amount || 0),
    note: item.notes || item.description || item.note || 'Payment received',
    description: item.description || item.notes || item.note || 'Payment received',
    date: String(dateValue).slice(0, 10),
    payment_date: String(dateValue).slice(0, 10),
    paymentMode: mode,
    payment_mode: mode,
  }
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}

function ContractorFilterCombo({ options, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const query = search.toLowerCase()
  const allOptions = ['all', ...options]
  const filtered = query
    ? allOptions.filter((name) => name.toLowerCase().includes(query))
    : allOptions
  const label = value === 'all' ? 'All contractors' : value

  function pick(name) {
    onChange(name)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="combo-wrap">
      <input
        className="combo-input combo-filter"
        placeholder={label}
        value={open ? search : label}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
        aria-label="Filter by contractor"
      />
      {open && (
        <ul className="combo-list">
          {filtered.length ? filtered.map((name) => (
            <li
              key={name}
              className={`combo-item${value === name ? ' selected' : ''}`}
              onMouseDown={() => pick(name)}
            >
              {name === 'all' ? 'All contractors' : name}
            </li>
          )) : <li className="combo-empty">No matches</li>}
        </ul>
      )}
    </div>
  )
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('costtrack-user'))
    } catch {
      return null
    }
  })
  const [projects, setProjects] = useState([])
  const [projectContractors, setProjectContractors] = useState([])
  const [contractors, setContractors] = useState([])
  const [activeView, setActiveView] = useState('overview')
  const [projectPayments, setProjectPayments] = useState([])
  const [contractorPayments, setContractorPayments] = useState([])
  const [totalSpend, setTotalSpend] = useState(0)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [selectedContractor, setSelectedContractor] = useState('all')
  const [projectSearch, setProjectSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [projectForm, setProjectForm] = useState({ name: '', owner_name: '', phone_number: '', address: '', estimated_cost: '', description: '', start_date: today })
  const [contractorForm, setContractorForm] = useState({ contractorId: '', amount: '', date: today, paymentMode: 'cash', description: '' })
  const [newContractorForm, setNewContractorForm] = useState({ name: '', firm_name: '', phone_number: '', firm_address: '', description: '' })
  const [expenseForm, setExpenseForm] = useState({ contractorId: '', amount: '', description: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: today, paymentMode: 'cash', note: '' })

  async function login(credentials) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error?.message || 'Unable to sign in')
      localStorage.setItem('costtrack-user', JSON.stringify(data))
      setUser(data)
      setError('')
    } catch (loginError) {
      setError(loginError.message)
    }
  }

  async function loadTotalSpend() {
    try {
      const response = await fetch(`${API_BASE}/payments/total-spend`)
      if (response.ok) {
        const data = await response.json()
        setTotalSpend(Number(data.total_spend || 0))
      }
    } catch {
      // ignore
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch(`${API_BASE}/projects`)
      if (!response.ok) throw new Error('Projects could not be loaded')
      const data = await response.json()
      const formatted = (data || []).map(normalizeProject)
      setProjects(formatted)
      if (!selectedProjectId && formatted[0]) {
        setSelectedProjectId(formatted[0].id)
      }
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadContractors() {
    try {
      const response = await fetch(`${API_BASE}/contractors`)
      if (!response.ok) throw new Error('Contractors could not be loaded')
      const data = await response.json()
      setContractors(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  async function loadProjectDetails(projectId) {
    if (!projectId) return

    try {
      const summaryResponse = await fetch(`${API_BASE}/projects/${projectId}/summary`)
      if (!summaryResponse.ok) throw new Error('Project details could not be loaded')
      const summary = await summaryResponse.json()
      const contractors = (summary.contractors || []).map(normalizeContractorSummary)
      setProjectContractors(contractors)

      const paymentsResponse = await fetch(`${API_BASE}/projects/${projectId}/payments`)
      if (!paymentsResponse.ok) throw new Error('Project payments could not be loaded')
      const payments = await paymentsResponse.json()
      setProjectPayments((payments || []).map(normalizePayment))

      const contractorPaymentResponses = await Promise.all(
        contractors.map(async (contractor) => {
          const response = await fetch(`${API_BASE}/projects/${projectId}/contractors/${contractor.contractor_id}/payments`)
          if (!response.ok) {
            throw new Error(`Payments for ${contractor.contractor_name} could not be loaded`)
          }
          const summary = await response.json()
          return (summary.payments || []).map((payment) => normalizePayment(payment, contractor.contractor_id))
        }),
      )
      setContractorPayments(contractorPaymentResponses.flat())
    } catch (detailError) {
      setError(detailError.message)
    }
  }

  useEffect(() => {
    if (!user) return
    loadProjects()
    loadContractors()
    loadTotalSpend()
  }, [user])

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetails(selectedProjectId)
      setSelectedContractor('all')
    }
  }, [selectedProjectId])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) || projects[0] || null
  const projectReceived = projectPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const selectedProjectSpend = contractorPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
  const totalProjectsRevenue = useMemo(
    () => projects.reduce((total, project) => total + Number(project.estimated_cost || 0), 0),
    [projects]
  )
  const projectBalance = 0
  const projectInitials = useMemo(() => selectedProject?.name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase() || '', [selectedProject])

  const contractorFilterOptions = useMemo(() => {
    const names = new Set()
    projectContractors.forEach((contractor) => {
      if (contractor.contractor_name) {
        names.add(contractor.contractor_name)
      }
    })
    contractors.forEach((contractor) => {
      if (contractor.name) {
        names.add(contractor.name)
      }
    })
    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [projectContractors, contractors])

  const filteredContractors = useMemo(() => {
    if (selectedContractor === 'all') {
      return projectContractors
    }
    return projectContractors.filter(
      (contractor) => contractor.contractor_name === selectedContractor
    )
  }, [projectContractors, selectedContractor])

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.owner_name || '').toLowerCase().includes(q)
    )
  }, [projects, projectSearch])

  async function fetchLatestPayments() {
    if (!selectedProject) return null
    const [ownerPaymentsResponse, contractorPaymentResponses] = await Promise.all([
      fetch(`${API_BASE}/projects/${selectedProject.id}/payments`),
      Promise.all(projectContractors.map(async (contractor) => {
        const response = await fetch(`${API_BASE}/projects/${selectedProject.id}/contractors/${contractor.contractor_id}/payments`)
        if (!response.ok) throw new Error(`Payments for ${contractor.contractor_name} could not be loaded`)
        const summary = await response.json()
        return (summary.payments || []).map((payment) => normalizePayment(payment, contractor.contractor_id))
      })),
    ])
    if (!ownerPaymentsResponse.ok) throw new Error('Owner payments could not be loaded')
    const latestOwnerPayments = (await ownerPaymentsResponse.json()).map(normalizePayment)
    const latestContractorPayments = contractorPaymentResponses.flat()
    setProjectPayments(latestOwnerPayments)
    setContractorPayments(latestContractorPayments)
    return { latestOwnerPayments, latestContractorPayments }
  }

  function openPrintWindow(html, title) {
    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      setError('Popup blocked. Please allow popups to export the project report.')
      return false
    }
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
    return true
  }

  function buildReportStyles() {
    return `
      body { font-family: Arial, sans-serif; margin: 0; background: #fff; color: #1f1f1f; }
      .report-page { max-width: 980px; margin: 0 auto; padding: 40px 32px 48px; }
      .header { border-bottom: 2px solid #e77b54; padding-bottom: 18px; margin-bottom: 24px; }
      .eyebrow { text-transform: uppercase; letter-spacing: 1.8px; color: #7d766d; font-size: 11px; }
      h1 { font-size: 28px; margin: 8px 0 6px; }
      .meta { color: #5f5a54; font-size: 13px; }
      .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 26px 0 30px; }
      .card { border: 1px solid #e8e0d8; border-radius: 8px; padding: 16px; background: #fffaf6; }
      .label { color: #756f68; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
      .value { font-size: 22px; font-weight: 700; margin-top: 8px; }
      .section { margin-top: 32px; }
      .section h2 { font-size: 20px; margin: 0 0 12px; border-bottom: 1px solid #e7e1d9; padding-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { padding: 11px 10px; border-bottom: 1px solid #efe9e3; text-align: left; vertical-align: top; }
      th { background: #f5f1ec; color: #524f4a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.9px; }
      td.amount { text-align: right; font-weight: 700; }
      tr.total-row td { background: #f9e5d9; font-weight: 700; border-top: 2px solid #e77b54; border-bottom: none; }
      tr.total-row td.amount { text-align: right; }
      .empty { color: #726d68; font-style: italic; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    `
  }

  function buildReportHeader(subtitle, formatDate) {
    return `
      <div class="header">
        <div class="eyebrow">${subtitle}</div>
        <h1>${selectedProject.name}</h1>
        <div class="meta">Owner: ${selectedProject.owner_name || 'Not set'} • ${selectedProject.address || 'Address not set'} • ${formatDate(selectedProject.start_date || today)}</div>
      </div>
    `
  }

  async function exportOwnerReport() {
    if (!selectedProject) return
    try {
      const result = await fetchLatestPayments()
      if (!result) return
      const { latestOwnerPayments } = result

      const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
      const formatDate = (value) => {
        if (!value) return '—'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
      }

      const incomingEntries = [...latestOwnerPayments]
        .sort((a, b) => new Date(b.date || b.payment_date || today) - new Date(a.date || a.payment_date || today))
        .map((payment) => ({
          date: payment.date || payment.payment_date || today,
          description: payment.description || payment.note || 'Payment received',
          mode: payment.paymentMode || payment.payment_mode || 'cash',
          amount: Number(payment.amount || 0),
        }))

      const incomingTotal = incomingEntries.reduce((total, entry) => total + Number(entry.amount || 0), 0)
      const estimatedCost = selectedProject.estimated_cost !== '' ? Number(selectedProject.estimated_cost || 0) : 0
      const balance = estimatedCost - incomingTotal

      const incomingRows = incomingEntries.length
        ? incomingEntries.map((entry) => `
            <tr>
              <td>${formatDate(entry.date)}</td>
              <td>${entry.description}</td>
              <td>${formatPaymentMode(entry.mode)}</td>
              <td class="amount">${formatCurrency(entry.amount)}</td>
            </tr>`).join('') + `
            <tr class="total-row">
              <td colspan="3">Total received</td>
              <td class="amount">${formatCurrency(incomingTotal)}</td>
            </tr>`
        : `<tr><td colspan="4" class="empty">No incoming payments recorded yet</td></tr>`

      const reportHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedProject.name} – Received Payments</title>
            <style>${buildReportStyles()}</style>
          </head>
          <body>
            <div class="report-page">
              ${buildReportHeader('Received payments report', formatDate)}
              <div class="summary-grid">
                <div class="card">
                  <div class="label">Estimated cost</div>
                  <div class="value">${estimatedCost === 0 ? 'Not Estimated' : formatCurrency(estimatedCost)}</div>
                </div>
                <div class="card">
                  <div class="label">Total received from owner</div>
                  <div class="value">${formatCurrency(incomingTotal)}</div>
                </div>
                <div class="card">
                  <div class="label">Balance due</div>
                  <div class="value">${estimatedCost === 0 ? 'Not Estimated' : formatCurrency(balance)}</div>
                </div>
              </div>
              <div class="section">
                <h2>Payments received for project</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Mode</th>
                      <th class="amount">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${incomingRows}
                  </tbody>
                </table>
              </div>
            </div>
          </body>
        </html>
      `
      openPrintWindow(reportHtml, `${selectedProject.name} – Received Payments`)
    } catch (exportError) {
      setError(exportError.message)
    }
  }

  async function exportContractorReport() {
    if (!selectedProject) return
    try {
      const result = await fetchLatestPayments()
      if (!result) return
      const { latestContractorPayments } = result

      const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
      const formatDate = (value) => {
        if (!value) return '—'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value
        return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
      }

      // Identify which contractor IDs belong to the selected filter
      const filteredContractorIds = selectedContractor === 'all'
        ? null
        : projectContractors
            .filter((c) => c.contractor_name === selectedContractor)
            .map((c) => c.contractor_id)

      const contractorEntries = [...latestContractorPayments]
        .filter((payment) => {
          if (!filteredContractorIds) return true
          return filteredContractorIds.includes(payment.contractorId)
        })
        .sort((a, b) => new Date(b.date || b.payment_date || today) - new Date(a.date || a.payment_date || today))
        .map((payment) => {
          const contractor = projectContractors.find((item) => item.contractor_id === payment.contractorId)
          return {
            date: payment.date || payment.payment_date || today,
            contractorName: contractor?.contractor_name || 'Unknown contractor',
            description: payment.description || payment.note || 'Contractor payment',
            mode: payment.paymentMode || payment.payment_mode || 'cash',
            amount: Number(payment.amount || 0),
          }
        })

      const outgoingTotal = contractorEntries.reduce((total, entry) => total + Number(entry.amount || 0), 0)

      // Count unique contractors in the filtered results
      const uniqueContractorNames = new Set(contractorEntries.map((e) => e.contractorName))
      const contractorCount = uniqueContractorNames.size

      const isFiltered = selectedContractor !== 'all'
      const reportSubtitle = isFiltered
        ? `Contractor payments report — ${selectedContractor}`
        : 'Contractor payments report'
      const pdfTitle = isFiltered
        ? `${selectedProject.name} – ${selectedContractor} Payments`
        : `${selectedProject.name} – Contractor Payments`

      // When a single contractor is selected, hide the Contractor column (it's redundant)
      const tableHead = isFiltered
        ? `<tr><th>Date</th><th>Description</th><th>Mode</th><th class="amount">Amount</th></tr>`
        : `<tr><th>Date</th><th>Contractor</th><th>Description</th><th>Mode</th><th class="amount">Amount</th></tr>`

      const contractorRows = contractorEntries.length
        ? contractorEntries.map((entry) => isFiltered ? `
            <tr>
              <td>${formatDate(entry.date)}</td>
              <td>${entry.description}</td>
              <td>${formatPaymentMode(entry.mode)}</td>
              <td class="amount">${formatCurrency(entry.amount)}</td>
            </tr>` : `
            <tr>
              <td>${formatDate(entry.date)}</td>
              <td>${entry.contractorName}</td>
              <td>${entry.description}</td>
              <td>${formatPaymentMode(entry.mode)}</td>
              <td class="amount">${formatCurrency(entry.amount)}</td>
            </tr>`).join('') + `
            <tr class="total-row">
              <td colspan="${isFiltered ? 3 : 4}">Total paid${isFiltered ? ` to ${selectedContractor}` : ' to contractors'}</td>
              <td class="amount">${formatCurrency(outgoingTotal)}</td>
            </tr>`
        : `<tr><td colspan="${isFiltered ? 4 : 5}" class="empty">No contractor payments recorded yet</td></tr>`

      const reportHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${pdfTitle}</title>
            <style>${buildReportStyles()}</style>
          </head>
          <body>
            <div class="report-page">
              ${buildReportHeader(reportSubtitle, formatDate)}
              <div class="summary-grid" style="grid-template-columns: repeat(2, minmax(0,1fr));">
                <div class="card">
                  <div class="label">${isFiltered ? 'Contractor' : 'Total contractors'}</div>
                  <div class="value">${isFiltered ? selectedContractor : contractorCount}</div>
                </div>
                <div class="card">
                  <div class="label">Total paid${isFiltered ? ` to ${selectedContractor}` : ' to contractors'}</div>
                  <div class="value">${formatCurrency(outgoingTotal)}</div>
                </div>
              </div>
              <div class="section">
                <h2>Payments made to contractor${isFiltered ? '' : 's'}</h2>
                <table>
                  <thead>${tableHead}</thead>
                  <tbody>${contractorRows}</tbody>
                </table>
              </div>
            </div>
          </body>
        </html>
      `
      openPrintWindow(reportHtml, pdfTitle)
    } catch (exportError) {
      setError(exportError.message)
    }
  }


  async function addProject(event) {
    event.preventDefault()
    if (!projectForm.name.trim() || !projectForm.address.trim()) return

    try {
      const payload = {
        name: projectForm.name.trim(),
        owner_name: projectForm.owner_name.trim(),
        phone_number: projectForm.phone_number.trim(),
        address: projectForm.address.trim(),
        ...(projectForm.estimated_cost !== '' ? { estimated_cost: Number(projectForm.estimated_cost) } : {}),
        description: projectForm.description.trim(),
        start_date: projectForm.start_date ? new Date(projectForm.start_date).toISOString() : new Date().toISOString(),
      }

      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Unable to create project' } }))
        throw new Error(errorBody.error?.message || 'Unable to create project')
      }

      const createdProject = await response.json()
      const normalized = normalizeProject(createdProject)
      setProjects((current) => [normalized, ...current])
      setSelectedProjectId(normalized.id)
      setProjectForm({ name: '', owner_name: '', phone_number: '', address: '', estimated_cost: '', description: '', start_date: today })
      setModal(null)
      setError('')
    } catch (createError) {
      setError(createError.message)
    }
  }

  async function addContractor(event) {
    event.preventDefault()
    if (!selectedProject || !contractorForm.contractorId || !contractorForm.amount || !contractorForm.description.trim()) return
    try {
      const response = await fetch(`${API_BASE}/projects/${selectedProject.id}/contractors/${contractorForm.contractorId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(contractorForm.amount || 0),
          payment_date: new Date(contractorForm.date).toISOString(),
          description: contractorForm.description.trim() || 'Contractor payment',
          payment_mode: contractorForm.paymentMode || 'cash',
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Unable to save contractor payment' } }))
        throw new Error(errorBody.error?.message || 'Unable to save contractor payment')
      }

      setContractorForm({ contractorId: '', amount: '', date: today, paymentMode: 'cash', description: '' })
      setModal(null)
      setError('')
      await loadProjectDetails(selectedProject.id)
      await loadTotalSpend()
    } catch (createError) {
      setError(createError.message)
    }
  }



  async function createContractor(event) {
    event.preventDefault()
    if (!newContractorForm.name.trim()) return

    try {
      const response = await fetch(`${API_BASE}/contractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContractorForm.name.trim(),
          firm_name: newContractorForm.firm_name.trim(),
          phone_number: newContractorForm.phone_number.trim(),
          firm_address: newContractorForm.firm_address.trim(),
          description: newContractorForm.description.trim(),
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Unable to create contractor' } }))
        throw new Error(errorBody.error?.message || 'Unable to create contractor')
      }

      setNewContractorForm({ name: '', firm_name: '', phone_number: '', firm_address: '', description: '' })
      await loadContractors()
      setModal(null)
      setError('')
      if (selectedProject) await loadProjectDetails(selectedProject.id)
    } catch (createError) {
      setError(createError.message)
    }
  }

  async function addPayment(event) {
    event.preventDefault()
    if (!selectedProject || !paymentForm.amount) return

    try {
      const payload = {
        amount: Number(paymentForm.amount || 0),
        payment_date: new Date(paymentForm.date).toISOString(),
        description: paymentForm.note.trim() || 'Payment received',
        payment_mode: paymentForm.paymentMode || 'cash',
        reference_number: '',
        notes: paymentForm.note.trim() || 'Payment received',
      }

      const response = await fetch(`${API_BASE}/projects/${selectedProject.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: { message: 'Unable to save payment' } }))
        throw new Error(errorBody.error?.message || 'Unable to save payment')
      }

      setPaymentForm({ amount: '', date: today, paymentMode: 'cash', note: '' })
      setModal(null)
      setError('')
      await loadProjectDetails(selectedProject.id)
    } catch (createError) {
      setError(createError.message)
    }
  }

  if (!user) return <Login onLogin={login} error={error} />

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">$</span><span>costrack</span></div>
      <div className="side-label">Workspace</div>
      <button type="button" className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}><span>◈</span>Overview</button>
      <button type="button" className={`nav-item ${activeView === 'projects' ? 'active' : ''}`} onClick={() => { setActiveView('projects'); setModal(null) }}><span>▦</span>Projects <b>+</b></button>
      <button type="button" className={`nav-item ${activeView === 'contractors' ? 'active' : ''}`} onClick={() => { setActiveView('contractors'); setModal(null) }}><span>♧</span>Contractors</button>
      <div className="sidebar-bottom">
        <div className="side-label">Your workspace</div>
        <div className="profile">
          <span className="avatar dark">AS</span>
          <span><strong>{user.name}</strong><small>{user.username}</small></span>
          <span className="dots">•••</span>
        </div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar">
        <div>
          <span className="eyebrow">Tuesday, September 1, 2026</span>
          <h1>Good morning, {user.name} <span>✦</span></h1>
        </div>
        <div className="top-actions">
          <button type="button" className="icon-button" aria-label="Notifications">♧<i /></button>
          <button type="button" className="avatar coral" aria-label="User profile">{user.name.slice(0, 2).toUpperCase()}</button>
          <button
            type="button"
            className="logout-button"
            onClick={() => {
              localStorage.removeItem('costtrack-user')
              setUser(null)
              setError('')
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {activeView === 'contractors' ? <ContractorDirectory contractors={contractors} onAdd={() => setModal('new-contractor')} /> : activeView === 'projects' ? <ProjectDirectory projects={projects} onAdd={() => setModal('project')} /> : <>
      <section className="summary-grid">
        <div className="summary-card warm">
          <span>Total spend in projects</span>
          <strong>{money(totalSpend)}</strong>
        </div>
        <div className="summary-card">
          <span>Total active projects</span>
          <strong>{projects.length}</strong>
          <small><em className="green">●</em> All projects on track</small>
        </div>
        <div className="summary-card">
          <span>Total projects revenue</span>
          <strong>{money(totalProjectsRevenue)}</strong>
          <small><em className="blue">●</em> Estimated project value</small>
        </div>
      </section>

      <div className="workspace-heading">
        <div>
          <span className="eyebrow">Project workspace</span>
          <h2>Projects <span className="count">{filteredProjects.length}</span></h2>
        </div>
        <div className="dir-actions">
          <input
            className="dir-search"
            type="search"
            placeholder="Search projects…"
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            aria-label="Search projects"
          />
          <button type="button" className="primary-button" onClick={() => setModal('project')}>+ New project</button>
        </div>
      </div>

      <section className="project-layout">
        <ProjectList projects={filteredProjects} selectedProjectId={selectedProject?.id} onSelect={setSelectedProjectId} onCreate={() => setModal('project')} />


        {selectedProject && <div className="detail-panel">
          <div className="detail-header">
            <div className="detail-title">
              <span className="large-project-icon" style={{ background: selectedProject.color }}>{projectInitials}</span>
              <div>
                <span className="eyebrow">Selected project</span>
                <h2>{selectedProject.name}</h2>
                <p>{selectedProject.location}</p>
              </div>
            </div>
            <button type="button" className="more-button">•••</button>
          </div>

          <div className="detail-stats">
            <div><span>Estimated cost</span><strong>{selectedProject.estimated_cost === '' ? 'Not Estimated' : money(selectedProject.estimated_cost)}</strong></div>
            <div><span>Received</span><strong>{money(projectReceived)}</strong></div>
            <div><span>Balance due</span><strong>{selectedProject.estimated_cost > 0 ? money(selectedProject.estimated_cost - projectReceived) : 'N/A'}</strong></div>
          </div>

          <div className="section-head">
            <div>
              <h3>Contractors &amp; Expenses <span className="count">{filteredContractors.length}</span></h3>
              <p>People assigned to this project</p>
            </div>
            <div className="section-actions">
              <ContractorFilterCombo
                options={contractorFilterOptions}
                value={selectedContractor}
                onChange={setSelectedContractor}
              />
              <button type="button" className="outline-button" onClick={exportContractorReport}>Export PDF</button>
              <button type="button" className="outline-button" onClick={() => setModal('contractor')}>+ Pay contractor</button>
            </div>
          </div>
          <ContractorList contractors={filteredContractors} />

          <div className="section-head expense-heading">
            <div>
              <h3>Received payments <span className="count">{projectPayments.length}</span></h3>
              <p>Installments received from the client</p>
            </div>
            <div className="section-actions">
              <button type="button" className="outline-button" onClick={exportOwnerReport}>Export PDF</button>
              <button type="button" className="outline-button" onClick={() => setModal('payment')}>+ Add payment</button>
            </div>
          </div>
          <PaymentList payments={projectPayments} />
        </div>}
      </section>
      </>}
    </main>

    {modal === 'project' && <ProjectForm form={projectForm} setForm={setProjectForm} onSubmit={addProject} close={() => setModal(null)} />}
    {modal === 'new-contractor' && <NewContractorForm form={newContractorForm} setForm={setNewContractorForm} onSubmit={createContractor} close={() => setModal(null)} />}
    {modal === 'contractor' && <ContractorForm projectName={selectedProject?.name} contractors={contractors} form={contractorForm} setForm={setContractorForm} onSubmit={addContractor} close={() => setModal(null)} />}
    {modal === 'expense' && <ExpenseForm projectName={selectedProject?.name} contractors={projectContractors} form={expenseForm} setForm={setExpenseForm} onSubmit={(event) => {
      event.preventDefault()
      if (!selectedProject || !expenseForm.contractorId || !expenseForm.amount) return
      setPaymentForm({
        contractorId: expenseForm.contractorId,
        amount: expenseForm.amount,
        date: today,
        paymentMode: 'cash',
        note: expenseForm.description,
      })
      setModal('payment')
      setExpenseForm({ contractorId: '', amount: '', description: '' })
    }} close={() => setModal(null)} />}
    {modal === 'payment' && <PaymentForm projectName={selectedProject?.name} form={paymentForm} setForm={setPaymentForm} onSubmit={addPayment} close={() => setModal(null)} />}

    {isLoading && <div className="loading-indicator">Loading projects...</div>}
  </div>
}

export default App
