import { el } from './dom.js'

function formatTime(ts) {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

export function setupSidebarFeed(state) {
  const app = document.getElementById('app')

  const panel = el('div', { class: 'panel feed-panel', id: 'feed-panel' })
  const header = el('div', { class: 'panel-title', text: 'Recent Activity' })
  
  const scrollArea = el('div', { class: 'feed-scroll' })
  
  panel.append(header, scrollArea)
  app.append(panel)

  function update() {
    scrollArea.innerHTML = ''
    
    // Check if we have an active filter
    let posts = state.posts
    if (state.filter === 'lost') posts = posts.filter(p => p.type === 'lost')
    if (state.filter === 'found') posts = posts.filter(p => p.type === 'found')
    
    // Check search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase()
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      )
    }

    if (posts.length === 0) {
      scrollArea.append(el('div', { class: 'feed-empty', text: 'No matching posts.' }))
      return
    }

    posts.slice(0, 15).forEach(post => {
      const item = el('div', { class: 'feed-item' })
      const dot = el('div', { class: `feed-item-dot ${post.type || 'lost'}` })
      
      const content = el('div', { class: 'feed-item-content' })
      const title = el('div', { class: 'feed-item-title', text: post.title || 'Untitled' })
      
      const meta = el('div', { class: 'feed-item-meta' })
      const badge = el('span', { class: `feed-item-badge ${post.type || 'lost'}`, text: post.type?.toUpperCase() || 'POST' })
      const time = el('span', { text: formatTime(post.createdAt) })
      
      meta.append(badge, time)
      content.append(title, meta)
      
      item.append(dot, content)
      
      // When clicked, dispatch a custom event that three-board can listen to, or just open the modal directly.
      // Easiest is to simulate a click that three-board picks up or just expose a global openModal event.
      item.addEventListener('click', () => {
        const evt = new CustomEvent('open-post-modal', { detail: post })
        window.dispatchEvent(evt)
      })
      
      scrollArea.append(item)
    })
  }

  return { updateFeed: update }
}
