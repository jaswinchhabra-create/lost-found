import { el } from './dom.js'

export function setupHeader(state) {
  const app = document.getElementById('app')

  const header = el('header', { class: 'header-bar', id: 'header-bar' })

  // Logo
  const logoWrap = el('div', { class: 'header-logo' })
  const logoIcon = el('div', { class: 'header-logo-icon', text: '🔍' })
  const logoTextWrap = el('div')
  const logoText = el('div', { class: 'header-logo-text', text: 'Lost & Found' })
  const logoSub = el('div', { class: 'header-logo-sub', text: 'Community Board' })
  logoTextWrap.append(logoText, logoSub)
  logoWrap.append(logoIcon, logoTextWrap)

  // Stats
  const statsWrap = el('div', { class: 'header-stats', id: 'header-stats' })

  const lostStat = el('div', { class: 'stat-item' })
  const lostDot = el('span', { class: 'stat-dot lost' })
  const lostLabel = el('span', { text: '0 Lost', id: 'stat-lost' })
  lostStat.append(lostDot, lostLabel)

  const foundStat = el('div', { class: 'stat-item' })
  const foundDot = el('span', { class: 'stat-dot found' })
  const foundLabel = el('span', { text: '0 Found', id: 'stat-found' })
  foundStat.append(foundDot, foundLabel)

  statsWrap.append(lostStat, foundStat)

  header.append(logoWrap, statsWrap)
  app.append(header)

  function headerUpdate() {
    const lost = state.posts.filter(p => p.type === 'lost').length
    const found = state.posts.filter(p => p.type === 'found').length
    lostLabel.textContent = `${lost} Lost`
    foundLabel.textContent = `${found} Found`
  }

  headerUpdate()

  return { headerUpdate }
}
