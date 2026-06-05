import { el } from './dom.js'

export function setupFilters(state) {
  const app = document.getElementById('app')

  // Search bar to go inside the header
  const headerCenter = el('div', { class: 'header-center' })
  const searchWrap = el('div', { class: 'search-bar' })
  const searchIcon = el('div', { class: 'search-bar-icon', text: '🔍' })
  const searchInput = el('input', { 
    type: 'text', 
    class: 'search-bar-input', 
    placeholder: 'Search items, tags, locations...' 
  })
  searchWrap.append(searchIcon, searchInput)
  headerCenter.append(searchWrap)
  
  // Need to append this to the header bar. Let's do it by finding it in the DOM, 
  // or we can just append it near the stats.
  setTimeout(() => {
    const headerBar = document.getElementById('header-bar')
    const statsWrap = document.getElementById('header-stats')
    if (headerBar && statsWrap) {
      headerBar.insertBefore(headerCenter, statsWrap)
    }
  }, 100)

  // Filter Chips below header
  const chipsWrap = el('div', { class: 'filter-chips' })
  const chipAll = el('button', { class: 'filter-chip active', text: 'All Posts' })
  const chipLost = el('button', { class: 'filter-chip chip-lost', text: '🔴 Lost' })
  const chipFound = el('button', { class: 'filter-chip chip-found', text: '🟢 Found' })
  
  chipsWrap.append(chipAll, chipLost, chipFound)
  app.append(chipsWrap)

  function updateActiveChip() {
    chipAll.classList.toggle('active', !state.filter)
    chipLost.classList.toggle('active', state.filter === 'lost')
    chipFound.classList.toggle('active', state.filter === 'found')
  }

  chipAll.addEventListener('click', () => { state.filter = null; state.emit() })
  chipLost.addEventListener('click', () => { state.filter = 'lost'; state.emit() })
  chipFound.addEventListener('click', () => { state.filter = 'found'; state.emit() })

  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value
    state.emit()
  })

  function update() {
    updateActiveChip()
  }

  return { updateFilters: update }
}
