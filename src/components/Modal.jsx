export default function Modal({ title, eyebrow, close, onSubmit, children }) {
  return <div className="modal-backdrop">
    <form className="modal" onSubmit={onSubmit}>
      <button type="button" className="close" onClick={close}>×</button>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p className="modal-intro">Keep your project costs organized in one place.</p>
      {children}
    </form>
  </div>
}
