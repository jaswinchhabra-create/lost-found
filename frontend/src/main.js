import './style.css'
import { AppState, loadState, saveState } from './ui/state.js'
import { setupHeader } from './ui/header.js'
import { setupAuthUI } from './ui/auth-ui.js'
import { setupThreeBoard } from './ui/three-board.js'
import { setupPostUI } from './ui/post-ui.js'

import { setupSidebarFeed } from './ui/sidebar-feed.js'
import { setupFilters } from './ui/filters.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function initApp() {
  const state = new AppState(API_BASE)
  loadState(state)

  const { headerUpdate } = setupHeader(state)
  const { updateFilters } = setupFilters(state)
  const { updateFeed } = setupSidebarFeed(state)
  const { destroyAuth, authElements } = setupAuthUI(state)
  const { destroyPost, postElements } = setupPostUI(state)
  const { destroyThree } = setupThreeBoard(state)

  state.onStateChange(() => {
    headerUpdate()
    updateFilters()
    updateFeed()
    authElements.update()
    postElements.update()
  })

  await state.refreshPosts()

  window.addEventListener('beforeunload', () => {
    destroyAuth?.()
    destroyPost?.()
    destroyThree?.()
    saveState(state)
  })
}

initApp()
