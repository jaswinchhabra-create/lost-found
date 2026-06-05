import { el } from './dom.js'

export function setupPostUI(state) {
  const app = document.getElementById('app')

  const panel = el('div', { class: 'panel post-panel', id: 'post-panel' })
  const header = el('div', { class: 'panel-title', text: 'Create Post' })

  const body = el('div', { class: 'panel-body', style: 'display:flex;flex-direction:column;gap:12px;' })

  // Type + Tag row
  const row1 = el('div', { style: 'display:flex;gap:10px;' })

  const typeWrap = el('div', { style: 'flex:1;' })
  const typeLabel = el('div', { class: 'detail-label', text: 'Type' })
  const typeSelect = el('select', { class: 'form-input', required: 'true', id: 'post-type' })
  const optLost = el('option', { value: 'lost', text: '🔴 Lost' })
  const optFound = el('option', { value: 'found', text: '🟢 Found' })
  typeSelect.append(optLost, optFound)
  typeWrap.append(typeLabel, typeSelect)

  const tagWrap = el('div', { style: 'flex:1;' })
  const tagLabel = el('div', { class: 'detail-label', text: 'Location / Tag' })
  const tagInput = el('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'e.g. Library, Cafeteria',
    id: 'post-tag'
  })
  tagWrap.append(tagLabel, tagInput)

  row1.append(typeWrap, tagWrap)

  // Title
  const titleWrap = el('div')
  const titleLabel = el('div', { class: 'detail-label', text: 'Title' })
  const titleInput = el('input', {
    type: 'text',
    class: 'form-input',
    placeholder: 'e.g. Black leather wallet',
    required: 'true',
    id: 'post-title'
  })
  titleWrap.append(titleLabel, titleInput)

  // Description
  const descWrap = el('div')
  const descLabel = el('div', { class: 'detail-label', text: 'Description' })
  const descInput = el('textarea', {
    class: 'form-input',
    placeholder: 'Describe the item — brand, color, distinguishing features...',
    required: 'true',
    id: 'post-description',
    style: 'height:80px;'
  })
  descWrap.append(descLabel, descInput)

  // File drop zone
  const fileZone = el('div', { class: 'file-drop-zone', id: 'file-drop-zone' })
  const fileIcon = el('div', { class: 'file-drop-zone-icon', text: '📸' })
  const fileText = el('div', { class: 'file-drop-zone-text', text: 'Click or drag photos here' })
  const fileHint = el('div', { class: 'file-drop-zone-hint', text: 'Up to 5 images, max 8MB each' })
  const fileCount = el('div', { class: 'file-drop-zone-text', style: 'margin-top:6px;color:var(--accent-emerald-light);font-weight:700;display:none;', id: 'file-count' })
  const fileInput = el('input', {
    type: 'file',
    accept: 'image/*',
    multiple: 'true',
    required: 'true',
    style: 'display:none;',
    id: 'post-images'
  })
  fileZone.append(fileIcon, fileText, fileHint, fileCount, fileInput)

  fileZone.addEventListener('click', () => fileInput.click())
  fileZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    fileZone.classList.add('dragover')
  })
  fileZone.addEventListener('dragleave', () => fileZone.classList.remove('dragover'))
  fileZone.addEventListener('drop', (e) => {
    e.preventDefault()
    fileZone.classList.remove('dragover')
    if (e.dataTransfer?.files?.length) {
      fileInput.files = e.dataTransfer.files
      updateFileCount()
    }
  })

  fileInput.addEventListener('change', updateFileCount)

  function updateFileCount() {
    const count = fileInput.files?.length || 0
    if (count > 0) {
      fileCount.style.display = ''
      fileCount.textContent = `${count} photo${count > 1 ? 's' : ''} selected ✓`
    } else {
      fileCount.style.display = 'none'
    }
  }

  // Buttons
  const btnRow = el('div', { style: 'display:flex;gap:10px;' })
  const submitBtn = el('button', {
    type: 'button',
    class: 'btn btn-success',
    text: '📤 Upload Post',
    id: 'post-submit',
    style: 'flex:1;'
  })
  const refreshBtn = el('button', {
    type: 'button',
    class: 'btn btn-ghost',
    text: '🔄 Refresh',
    id: 'post-refresh',
    style: 'flex:1;'
  })
  btnRow.append(submitBtn, refreshBtn)

  const status = el('div', { class: 'status-msg', id: 'post-status' })

  body.append(row1, titleWrap, descWrap, fileZone, btnRow, status)
  panel.append(header, body)
  app.append(panel)

  function setDisabled(disabled) {
    submitBtn.disabled = disabled
    refreshBtn.disabled = disabled
    ;[typeSelect, tagInput, titleInput, descInput, fileInput].forEach((x) => (x.disabled = disabled))
  }

  async function createPost() {
    if (!state.token) return

    status.innerHTML = '<span class="spinner"></span> Uploading...'

    const files = Array.from(fileInput.files || [])
    if (files.length === 0) {
      status.innerHTML = ''
      status.textContent = 'Please select at least one photo.'
      return
    }

    setDisabled(true)

    const fd = new FormData()
    fd.append('type', typeSelect.value)
    fd.append('tag', tagInput.value.trim())
    fd.append('title', titleInput.value.trim())
    fd.append('description', descInput.value.trim())
    for (const f of files) fd.append('images', f)

    try {
      const res = await fetch(`${state.apiBase}/api/posts`, {
        method: 'POST',
        headers: state.authHeaders(),
        body: fd
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        status.innerHTML = ''
        status.textContent = err?.error || 'Upload failed'
        setDisabled(false)
        return
      }

      status.innerHTML = ''
      status.textContent = '✅ Posted successfully!'
      titleInput.value = ''
      descInput.value = ''
      tagInput.value = ''
      fileInput.value = ''
      fileCount.style.display = 'none'
      await state.refreshPosts()

      setTimeout(() => { status.textContent = '' }, 3000)
    } catch (err) {
      status.innerHTML = ''
      status.textContent = 'Network error — is the backend running?'
    }

    setDisabled(false)
  }

  submitBtn.addEventListener('click', createPost)
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true
    await state.refreshPosts()
    refreshBtn.disabled = false
  })

  function update() {
    const loggedIn = !!state.user
    panel.style.display = loggedIn ? '' : 'none'
    setDisabled(!loggedIn)
  }

  update()

  const destroy = () => panel.remove()
  return { destroyPost: destroy, postElements: { update } }
}
