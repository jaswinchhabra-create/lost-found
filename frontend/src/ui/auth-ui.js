import { el } from './dom.js'

export function setupAuthUI(state) {
  const app = document.getElementById('app')

  const panel = el('div', { class: 'panel auth-panel', id: 'auth-panel' })

  const title = el('div', { class: 'panel-title', text: 'Account' })
  const body = el('div', { class: 'panel-body' })

  // --- Login / Register Form ---
  const form = el('form', { id: 'auth-form', autocomplete: 'off' })

  const modeTabs = el('div', { style: 'display:flex;gap:8px;margin-bottom:16px;' })
  const loginBtn = el('button', { type: 'button', class: 'tab active', text: 'Sign In', id: 'tab-login' })
  const registerBtn = el('button', { type: 'button', class: 'tab', text: 'Sign Up', id: 'tab-register' })
  modeTabs.append(loginBtn, registerBtn)

  const usernameRow = el('div', { style: 'margin-bottom:12px;' })
  const usernameLabel = el('div', { class: 'detail-label', text: 'Username' })
  const username = el('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'Enter username',
    required: 'true',
    id: 'auth-username'
  })
  usernameRow.append(usernameLabel, username)

  const emailRow = el('div', { style: 'margin-bottom:12px;' })
  const emailLabel = el('div', { class: 'detail-label', text: 'Email' })
  const email = el('input', {
    type: 'email',
    class: 'form-input',
    placeholder: 'you@example.com',
    required: 'true',
    id: 'auth-email'
  })
  emailRow.append(emailLabel, email)

  const passRow = el('div', { style: 'margin-bottom:16px;' })
  const passLabel = el('div', { class: 'detail-label', text: 'Password' })
  const password = el('input', {
    type: 'password',
    class: 'form-input',
    placeholder: '••••••••',
    required: 'true',
    id: 'auth-password'
  })
  passRow.append(passLabel, password)

  const submitBtn = el('button', {
    type: 'submit',
    class: 'btn btn-primary',
    text: 'Sign In',
    id: 'auth-submit',
    style: 'width:100%;'
  })

  const status = el('div', { class: 'status-msg', id: 'auth-status', style: 'margin-top:12px;' })

  form.append(modeTabs, usernameRow, emailRow, passRow, submitBtn, status)

  // --- Logged In View ---
  const userBox = el('div', { style: 'display:none;', id: 'auth-user-box' })

  const userBadge = el('div', { class: 'user-badge' })
  const avatar = el('div', { class: 'user-avatar', id: 'user-avatar' })
  const userInfo = el('div', { class: 'user-info' })
  const userName = el('div', { class: 'user-name', id: 'user-name' })
  const userEmail = el('div', { class: 'user-email', id: 'user-email' })
  userInfo.append(userName, userEmail)
  userBadge.append(avatar, userInfo)

  const logoutBtn = el('button', {
    type: 'button',
    class: 'btn btn-danger',
    text: 'Sign Out',
    id: 'auth-logout',
    style: 'width:100%;margin-top:14px;'
  })
  userBox.append(userBadge, logoutBtn)

  body.append(form, userBox)
  panel.append(title, body)
  app.append(panel)

  let mode = 'login'

  function setMode(next) {
    mode = next
    const isLogin = mode === 'login'
    loginBtn.classList.toggle('active', isLogin)
    registerBtn.classList.toggle('active', !isLogin)
    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account'
    status.textContent = ''
    status.innerHTML = ''
  }

  loginBtn.addEventListener('click', () => setMode('login'))
  registerBtn.addEventListener('click', () => setMode('register'))

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    status.innerHTML = '<span class="spinner"></span> Working...'
    submitBtn.disabled = true

    const payload = {
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value
    }

    const loginPayload = {
      usernameOrEmail: payload.email || payload.username,
      password: payload.password
    }

    const url = mode === 'login'
      ? `${state.apiBase}/api/auth/login`
      : `${state.apiBase}/api/auth/register`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? loginPayload : payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        status.innerHTML = ''
        status.textContent = err?.error || 'Authentication failed'
        submitBtn.disabled = false
        return
      }

      const data = await res.json()
      state.setAuth({ token: data.token, user: data.user })
      status.innerHTML = ''
      status.textContent = ''
    } catch (err) {
      status.innerHTML = ''
      status.textContent = 'Network error — is the backend running?'
    }

    submitBtn.disabled = false
  })

  logoutBtn.addEventListener('click', () => {
    state.clearAuth()
  })

  function update() {
    const loggedIn = !!state.user
    form.style.display = loggedIn ? 'none' : ''
    userBox.style.display = loggedIn ? '' : 'none'

    if (state.user) {
      userName.textContent = state.user.username || ''
      userEmail.textContent = state.user.email || ''
      avatar.textContent = (state.user.username || '?')[0].toUpperCase()
    }
  }

  update()

  const destroy = () => panel.remove()
  return { destroyAuth: destroy, authElements: { update } }
}
