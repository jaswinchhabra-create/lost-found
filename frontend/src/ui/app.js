import { AppState, loadState, saveState } from './state.js'
import { setupAuthUI } from './auth-ui.js'
import { setupThreeBoard } from './three-board.js'
import { setupPostUI } from './post-ui.js'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function initApp() {
  const state = new AppState(API_BASE)
  loadState(state)

  const { destroyAuth, authElements } = setupAuthUI(state)
  const { destroyPost, postElements } = setupPostUI(state)
  const { destroyThree } = setupThreeBoard(state)

  state.onStateChange(() => {
    authElements.update()
    postElements.update()
  })

  await state.refreshPosts()

  // Clean up on navigation (not strictly needed)
  window.addEventListener('beforeunload', () => {
    destroyAuth?.()
    destroyPost?.()
    destroyThree?.()
    saveState(state)
  })
}

