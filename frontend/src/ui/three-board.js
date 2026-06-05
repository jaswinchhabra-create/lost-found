import * as THREE from 'three'
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

export function setupThreeBoard(state) {
  const app = document.getElementById('app')

  // --- Canvas container ---
  const canvasWrap = el('div', { class: 'canvas-container', id: 'three-canvas' })
  app.append(canvasWrap)

  // --- Three.js Setup ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  canvasWrap.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x050814, 0.025)

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 10, 22)
  camera.lookAt(0, 0, 0)

  // --- Lighting ---
  const ambientLight = new THREE.AmbientLight(0x4466aa, 0.3)
  scene.add(ambientLight)

  const hemi = new THREE.HemisphereLight(0x88aaff, 0x223344, 0.6)
  scene.add(hemi)

  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
  mainLight.position.set(10, 25, 15)
  mainLight.castShadow = false
  scene.add(mainLight)

  const fillLight = new THREE.PointLight(0x6366f1, 0.4, 50)
  fillLight.position.set(-10, 8, -5)
  scene.add(fillLight)

  const accentLight = new THREE.PointLight(0x22c55e, 0.3, 50)
  accentLight.position.set(10, 5, 8)
  scene.add(accentLight)

  // --- Animated Grid ---
  const gridMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color(0x3b82f6) },
      uColor2: { value: new THREE.Color(0x0ea5e9) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;

      float grid(vec2 st, float res) {
        vec2 grid = abs(fract(st * res) - 0.5) / fwidth(st * res);
        return 1.0 - min(min(grid.x, grid.y), 1.0);
      }

      void main() {
        float g = grid(vUv + vec2(0.0, uTime * 0.02), 18.0);
        vec3 color = mix(uColor1, uColor2, vUv.x + sin(uTime * 0.3) * 0.1);
        float dist = length(vUv - 0.5);
        float alpha = g * 0.15 * (1.0 - smoothstep(0.2, 0.5, dist));
        gl_FragColor = vec4(color, alpha);
      }
    `,
    side: THREE.DoubleSide
  })

  const gridPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    gridMat
  )
  gridPlane.rotation.x = -Math.PI / 2
  gridPlane.position.y = -2.5
  scene.add(gridPlane)

  // --- Board Platform ---
  const platformGeo = new THREE.BoxGeometry(28, 0.3, 16)
  const platformMat = new THREE.MeshStandardMaterial({
    color: 0x0d1525,
    metalness: 0.4,
    roughness: 0.6,
    transparent: true,
    opacity: 0.8
  })
  const platform = new THREE.Mesh(platformGeo, platformMat)
  platform.position.y = -1.5
  scene.add(platform)

  // Edge glow
  const edgeGeo = new THREE.BoxGeometry(28.1, 0.05, 16.1)
  const edgeMat = new THREE.MeshBasicMaterial({
    color: 0x6366f1,
    transparent: true,
    opacity: 0.2
  })
  const edgeGlow = new THREE.Mesh(edgeGeo, edgeMat)
  edgeGlow.position.y = -1.34
  scene.add(edgeGlow)

  // --- Floating particles ---
  const particleCount = 80
  const particlesGeo = new THREE.BufferGeometry()
  const particlePositions = new Float32Array(particleCount * 3)
  const particleSizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 50
    particlePositions[i * 3 + 1] = Math.random() * 15 - 2
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 40
    particleSizes[i] = Math.random() * 3 + 1
  }

  particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
  particlesGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1))

  const particlesMat = new THREE.PointsMaterial({
    color: 0x6366f1,
    size: 0.08,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  })
  const particles = new THREE.Points(particlesGeo, particlesMat)
  scene.add(particles)

  // --- Posts Group ---
  const postsGroup = new THREE.Group()
  scene.add(postsGroup)

  // --- Raycaster ---
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // --- Tooltip ---
  const tooltip = el('div', { class: 'card-tooltip', id: 'card-tooltip' })
  const tooltipType = el('div', { class: 'card-tooltip-type' })
  const tooltipTitle = el('div', { class: 'card-tooltip-title' })
  const tooltipHint = el('div', { style: 'font-size:11px;color:var(--text-muted);margin-top:4px;', text: 'Click to view details' })
  tooltip.append(tooltipType, tooltipTitle, tooltipHint)
  app.append(tooltip)

  // --- Empty State ---
  const emptyState = el('div', { class: 'empty-state', id: 'empty-state' })
  const emptyIcon = el('div', { class: 'empty-state-icon', text: '🔍' })
  const emptyText = el('div', { class: 'empty-state-text', text: 'No posts yet' })
  const emptySub = el('div', { class: 'empty-state-sub', text: 'Sign in and create the first post!' })
  emptyState.append(emptyIcon, emptyText, emptySub)
  app.append(emptyState)

  // --- Instructions hint ---
  const hint = el('div', { class: 'instructions-hint', id: 'instructions-hint' })
  const hintIcon = el('span', { class: 'instructions-hint-icon', text: '🖱️' })
  const hintText = el('span', { text: 'Click on cards to view details' })
  hint.append(hintIcon, hintText)
  app.append(hint)

  // --- Modal ---
  const modalOverlay = el('div', { class: 'modal-overlay', id: 'post-modal-overlay' })
  const modal = el('div', { class: 'modal', id: 'post-modal' })

  const head = el('div', { class: 'modal-head' })
  const headLeft = el('div')
  const modalTitle = el('div', { class: 'modal-head-title', id: 'modal-title' })
  const modalMeta = el('div', { class: 'modal-head-meta', id: 'modal-meta' })
  headLeft.append(modalTitle, modalMeta)
  const closeBtn = el('button', { class: 'close-btn', text: '✕', type: 'button', id: 'modal-close' })
  head.append(headLeft, closeBtn)

  const modalBody = el('div', { class: 'modal-body' })
  const img = el('img', { class: 'modal-img', alt: 'Post image', id: 'modal-img' })

  const details = el('div', { class: 'modal-details' })
  const pill = el('span', { class: 'pill', id: 'modal-pill' })

  const descBlock = el('div')
  const descLabel = el('div', { class: 'detail-label', text: 'Description' })
  const desc = el('div', { class: 'detail-value', id: 'modal-desc' })
  descBlock.append(descLabel, desc)

  const tagBlock = el('div', { id: 'modal-tag-block' })
  const tagLabel = el('div', { class: 'detail-label', text: 'Location / Tag' })
  const tag = el('div', { class: 'detail-value', id: 'modal-tag' })
  tagBlock.append(tagLabel, tag)

  const authorBlock = el('div')
  const authorLabel = el('div', { class: 'detail-label', text: 'Posted by' })
  const author = el('div', { class: 'detail-value', id: 'modal-author' })
  authorBlock.append(authorLabel, author)

  details.append(pill, descBlock, tagBlock, authorBlock)
  modalBody.append(img, details)

  modal.append(head, modalBody)
  modalOverlay.append(modal)
  app.append(modalOverlay)

  function openModal(post) {
    modalTitle.textContent = post.title || 'Untitled'
    modalMeta.textContent = `${post.type?.toUpperCase() || 'POST'} • ${formatTime(post.createdAt)}`

    pill.textContent = post.type?.toUpperCase() || 'POST'
    pill.className = `pill pill-${post.type || 'lost'}`

    desc.textContent = post.description || ''

    if (post.tag) {
      tagBlock.style.display = ''
      tag.textContent = post.tag
    } else {
      tagBlock.style.display = 'none'
    }

    author.textContent = post.user?.username || 'Anonymous'

    const firstImage = (post.images && post.images[0]) || null
    if (firstImage?.url) {
      // Construct full URL for images
      const imgUrl = firstImage.url.startsWith('http') ? firstImage.url : `${state.apiBase}${firstImage.url}`
      img.src = imgUrl
      img.style.display = ''
    } else {
      img.style.display = 'none'
    }

    modalOverlay.style.display = 'flex'
  }

  function closeModal() {
    modalOverlay.style.display = 'none'
  }

  closeBtn.addEventListener('click', closeModal)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
  })

  // --- Card Building ---
  const cardMeshes = new Map()
  const cardGroups = new Map()
  let hoveredCard = null

  const textureLoader = new THREE.TextureLoader()

  function buildCard(post, i, totalLength = 1) {
    const cols = 5
    const spacingX = 4.6
    const spacingZ = 3.8
    const totalCols = Math.min(totalLength, cols)
    const totalRows = Math.ceil(totalLength / cols)

    const col = i % cols
    const row = Math.floor(i / cols)

    const x = (col - (totalCols - 1) / 2) * spacingX
    const z = (row - (totalRows - 1) / 2) * spacingZ

    const group = new THREE.Group()
    group.position.set(x, 0, z)

    const isFound = post.type === 'found'

    // Card Materials
    const baseMat = new THREE.MeshStandardMaterial({
      color: isFound ? 0x16a34a : 0x4338ca,
      metalness: 0.35,
      roughness: 0.4,
      emissive: isFound ? 0x0a5020 : 0x1e1b4b,
      emissiveIntensity: 0.15
    })

    let frontMat = baseMat
    const firstImage = (post.images && post.images[0]) || null
    if (firstImage?.url) {
      const imgUrl = firstImage.url.startsWith('http') ? firstImage.url : `${state.apiBase}${firstImage.url}`
      const map = textureLoader.load(imgUrl)
      map.colorSpace = THREE.SRGBColorSpace
      frontMat = new THREE.MeshStandardMaterial({
        map: map,
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.8,
        emissive: 0x000000
      })
    }

    // BoxGeometry faces: right, left, top, bottom, front, back
    const materials = [baseMat, baseMat, baseMat, baseMat, frontMat, baseMat]

    // Main card body
    const cardGeo = new THREE.BoxGeometry(3.8, 2.4, 0.12)
    const card = new THREE.Mesh(cardGeo, materials)
    card.position.y = 0
    card.userData = { post }
    group.add(card)

    // Card border glow
    const borderGeo = new THREE.BoxGeometry(3.9, 2.5, 0.04)
    const borderMat = new THREE.MeshBasicMaterial({
      color: isFound ? 0x22c55e : 0x6366f1,
      transparent: true,
      opacity: 0.12
    })
    const border = new THREE.Mesh(borderGeo, borderMat)
    border.position.y = 0
    border.position.z = -0.05
    group.add(border)

    // Floating indicator sphere
    const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16)
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isFound ? 0x22c55e : 0x818cf8,
      transparent: true,
      opacity: 0.7
    })
    const sphere = new THREE.Mesh(sphereGeo, sphereMat)
    sphere.position.set(0, 1.6, 0)
    sphere.userData = { isIndicator: true }
    group.add(sphere)

    // HTML Label
    const label = el('div', { class: 'card-label', id: `label-${post.id}` })
    const labelTitle = el('div', { class: 'card-label-title', text: post.title || 'Untitled' })
    const labelType = el('div', { class: `card-label-type ${post.type || 'lost'}`, text: post.type?.toUpperCase() || 'POST' })
    label.append(labelTitle, labelType)
    if (post.tag) {
      label.append(el('div', { class: 'card-label-tag', text: post.tag }))
    }
    app.append(label)
    
    group.userData.label = label

    postsGroup.add(group)
    cardMeshes.set(post.id, card)
    cardGroups.set(post.id, group)
  }

  function clearCards() {
    for (const [, group] of cardGroups.entries()) {
      if (group.userData.label) group.userData.label.remove()
      
      postsGroup.remove(group)
      group.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
          else child.material.dispose()
        }
      })
    }
    cardMeshes.clear()
    cardGroups.clear()
  }

  function renderCards() {
    clearCards()

    let posts = state.posts
    if (state.filter === 'lost') posts = posts.filter(p => p.type === 'lost')
    if (state.filter === 'found') posts = posts.filter(p => p.type === 'found')
    
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase()
      posts = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      )
    }

    posts = posts.slice(0, 30)
    posts.forEach((p, i) => buildCard(p, i, posts.length))

    // Show/hide empty state
    emptyState.style.display = posts.length === 0 ? '' : 'none'
    hint.style.display = posts.length > 0 ? '' : 'none'
  }

  state.onStateChange(() => {
    renderCards()
  })

  window.addEventListener('open-post-modal', (e) => {
    if (e.detail) openModal(e.detail)
  })

  // --- Interaction ---
  let lastPointerX = 0
  let lastPointerY = 0

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect()
    lastPointerX = e.clientX
    lastPointerY = e.clientY
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    // Tooltip raycast
    raycaster.setFromCamera(mouse, camera)
    const candidates = []
    for (const [, mesh] of cardMeshes.entries()) candidates.push(mesh)

    const hits = raycaster.intersectObjects(candidates, false)
    if (hits.length) {
      const hit = hits[0].object
      const post = hit.userData?.post
      if (post && hoveredCard !== post.id) {
        hoveredCard = post.id
        tooltipType.textContent = post.type?.toUpperCase() || 'POST'
        tooltipType.className = `card-tooltip-type ${post.type || ''}`
        tooltipTitle.textContent = post.title || 'Untitled'
        tooltip.classList.add('visible')
        renderer.domElement.style.cursor = 'pointer'
      }
      // Position tooltip
      tooltip.style.left = `${lastPointerX + 16}px`
      tooltip.style.top = `${lastPointerY - 10}px`
    } else {
      if (hoveredCard) {
        hoveredCard = null
        tooltip.classList.remove('visible')
        renderer.domElement.style.cursor = ''
      }
    }
  }

  function onClick(e) {
    // Don't process clicks on UI panels
    if (e.target.closest('.panel, .modal-overlay, .header-bar')) return

    raycaster.setFromCamera(mouse, camera)
    const candidates = []
    for (const [, mesh] of cardMeshes.entries()) candidates.push(mesh)

    const hits = raycaster.intersectObjects(candidates, false)
    if (!hits.length) return

    const hit = hits[0].object
    const post = hit.userData?.post
    if (post) openModal(post)
  }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('click', onClick)

  // --- Camera orbit ---
  let cameraAngle = 0
  const cameraRadius = 22
  const cameraHeight = 10
  const cameraSpeed = 0.04

  // --- Animation loop ---
  let t0 = performance.now()

  function animate() {
    const t = performance.now()
    const elapsed = t / 1000
    const dt = Math.min(0.05, (t - t0) / 1000)
    t0 = t

    // Update grid shader
    gridMat.uniforms.uTime.value = elapsed

    // Gentle camera orbit
    cameraAngle += dt * cameraSpeed
    camera.position.x = Math.sin(cameraAngle) * cameraRadius
    camera.position.z = Math.cos(cameraAngle) * cameraRadius
    camera.position.y = cameraHeight + Math.sin(elapsed * 0.3) * 0.5
    camera.lookAt(0, 0, 0)

    // Animate particles
    const positions = particles.geometry.attributes.position.array
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += Math.sin(elapsed + i) * 0.003
      // Subtle drift
      positions[i * 3] += Math.cos(elapsed * 0.5 + i * 0.7) * 0.001
    }
    particles.geometry.attributes.position.needsUpdate = true

    // Animate card groups — floating, gentle rotation
    for (const [, group] of cardGroups.entries()) {
      const idx = Array.from(cardGroups.values()).indexOf(group)
      const floatOffset = Math.sin(elapsed * 0.8 + idx * 1.2) * 0.15
      group.position.y = floatOffset

      // Subtle card tilt
      group.rotation.y = Math.sin(elapsed * 0.3 + idx * 0.8) * 0.05

      // Animate indicator sphere
      group.children.forEach(child => {
        if (child.userData?.isIndicator) {
          child.position.y = 1.6 + Math.sin(elapsed * 1.5 + idx) * 0.1
        }
      })

      // Update label position
      if (group.userData.label) {
        const vector = new THREE.Vector3()
        group.getWorldPosition(vector)
        // Position label below the card
        vector.y -= 1.6
        vector.project(camera)
        
        // Check if behind camera
        if (vector.z > 1) {
          group.userData.label.style.display = 'none'
        } else {
          group.userData.label.style.display = ''
          const x = (vector.x * 0.5 + 0.5) * window.innerWidth
          const y = (vector.y * -0.5 + 0.5) * window.innerHeight
          group.userData.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`
          
          // Fade out based on distance
          const dist = camera.position.distanceTo(group.position)
          const maxDist = 30
          group.userData.label.style.opacity = Math.max(0, 1 - (dist / maxDist))
        }
      }
    }

    // Edge glow pulse
    edgeMat.opacity = 0.15 + Math.sin(elapsed * 0.5) * 0.05

    // Hover effect
    for (const [id, card] of cardMeshes.entries()) {
      const isHovered = hoveredCard === id
      const targetEmissive = isHovered ? 0.4 : 0.15
      card.material.emissiveIntensity += (targetEmissive - card.material.emissiveIntensity) * 0.1
    }

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
  }

  animate()

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  renderCards()

  const destroy = () => {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    canvasWrap.remove()
    modalOverlay.remove()
    tooltip.remove()
    emptyState.remove()
    hint.remove()
  }

  return { destroyThree: destroy }
}
