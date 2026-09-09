import { useState } from 'react'

export default function Login({ onLogin, error }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function submit(event) {
    event.preventDefault()
    onLogin({ username, password })
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand login-brand"><span className="brand-mark">$</span><span>costrack</span></div>
        <span className="eyebrow">Workspace login</span>
        <h1>Welcome back</h1>
        <p className="login-intro">Sign in to manage your projects and payments.</p>
        {error && <div className="error-banner">{error}</div>}
        <label>
          Username
          <input required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          Password
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        <button type="submit" className="primary-button full">Sign in</button>
      </form>
    </main>
  )
}
