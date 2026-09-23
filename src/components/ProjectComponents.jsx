import { useState } from 'react'
import Modal from './Modal'

export function ProjectList({ projects, selectedProjectId, onSelect, onCreate }) {
  return <div className="project-list">
    {projects.map((project) => <button key={project.id} className={`project-row ${project.id === selectedProjectId ? 'selected' : ''}`} onClick={() => onSelect(project.id)}>
      <span className="project-icon" style={{ background: project.color || '#e77b54' }}>{(project.name || 'P').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span>
      <span className="project-info"><strong>{project.name}</strong><small>{project.address || 'Address not set'}{project.estimated_cost !== '' ? ` · ${money(project.estimated_cost)}` : ''}</small></span>
      <span className="arrow">›</span>
    </button>)}
    <button type="button" className="add-project-row" onClick={onCreate}>+ Add another project</button>
  </div>
}

export function ProjectDirectory({ projects, onAdd, onEdit }) {
  const [search, setSearch] = useState('')
  const query = search.trim().toLowerCase()
  const filtered = query
    ? projects.filter((p) =>
        (p.name || '').toLowerCase().includes(query) ||
        (p.owner_name || '').toLowerCase().includes(query) ||
        (p.address || '').toLowerCase().includes(query)
      )
    : projects

  return (
    <section className="directory-page">
      <div className="directory-header">
        <div>
          <span className="eyebrow">Workspace</span>
          <h2>Projects <span className="count">{filtered.length}</span></h2>
          <p>Review project owners, schedules, addresses, and estimated costs.</p>
        </div>
        <div className="dir-actions">
          <input
            className="dir-search"
            type="search"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search projects"
          />
          <button type="button" className="primary-button" onClick={onAdd}>+ Add project</button>
        </div>
      </div>
      <div className="contractor-table-wrap">
        {filtered.length ? (
          <table className="contractor-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Estimated cost</th>
                <th>Start date</th>
                <th>Description</th>
                {onEdit && <th style={{ width: '60px', textAlign: 'center' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td><strong>{project.name}</strong></td>
                  <td>{project.owner_name || '—'}</td>
                  <td>{project.phone_number || '—'}</td>
                  <td>{project.address || '—'}</td>
                  <td>{project.estimated_cost === '' ? '—' : money(project.estimated_cost)}</td>
                  <td>{project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td>{project.description || '—'}</td>
                  {onEdit && (
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="row-edit-btn"
                        title="Edit project"
                        aria-label={`Edit ${project.name}`}
                        onClick={() => onEdit(project)}
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
        ) : <p className="empty-state">{query ? 'No projects match your search.' : 'No projects saved yet.'}</p>}
      </div>
    </section>
  )
}


export function ProjectForm({ form, setForm, onSubmit, close, isEdit = false }) {
  return <Modal title={isEdit ? "Edit project" : "New project"} eyebrow="Workspace" close={close} onSubmit={onSubmit}>
    <label>Project name *<input required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Oak Street build" /></label>
    <label>Owner name<input value={form.owner_name} onChange={(event) => setForm({ ...form, owner_name: event.target.value })} placeholder="e.g. Alex Smith" /></label>
    <label>
      Phone number
      <input
        type="tel"
        value={form.phone_number}
        onChange={(event) =>
          setForm({
            ...form,
            phone_number: event.target.value.replace(/\D/g, '').slice(0, 10),
          })
        }
        placeholder="e.g. 9876543210"
        maxLength={10}
        inputMode="numeric"
      />
    </label>
    <label>Address *<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="e.g. Bengaluru" /></label>
    <label>Estimated cost (optional)<input type="number" min="0" value={form.estimated_cost} onChange={(event) => setForm({ ...form, estimated_cost: event.target.value })} placeholder="e.g. 1000000" /></label>
    <label>Start date<input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /></label>
    <label>Description </label><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Project summary or scope" rows="3" style={{ width: '100%' }} />
    <button type="submit" className="primary-button full">{isEdit ? "Update project" : "Create project"}</button>
  </Modal>
}

function money(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
}
