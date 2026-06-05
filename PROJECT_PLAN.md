# Project Plan: Lost & Found (Three.js + Backend)

## Information gathered
- Workspace folder was empty.
- User requested:
  - Fancy working app using **Three.js frontend**
  - **Backend** in other language/framework (chosen: **Node.js/Express + SQLite**)
  - **Login** required; user prefers “convenient of your choice”
  - **Photo uploads**; images should be **immediately visible** to everyone after upload

## Plan
### Step 1 — Create repo structure
- Create `frontend/` and `backend/`
- Add root `package.json` (optional) and separate scripts for each side

### Step 2 — Backend (Node/Express)
- Use SQLite for persistence (`lostfound.db`)
- Create tables:
  - `users`
  - `posts` (lost/found, title, description, category/location fields)
  - `images` (postId, filename, url path)
- Implement endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/posts` (public)
  - `GET /api/posts/:id` (public)
  - `POST /api/posts` (auth; create post + upload image(s))
  - `DELETE /api/posts/:id` (auth; owner-only)
  - `GET /uploads/...` to serve images
- Auth:
  - JWT in `Authorization: Bearer <token>`

### Step 3 — Frontend (Three.js)
- Build a simple 3D “community board” scene:
  - camera controls + floating cards
  - click a card to open details modal
- Auth pages:
  - login/register
- Upload UI:
  - lost/found select, form fields, image file picker
  - submit to backend via `fetch`
- Public feed:
  - fetch `/api/posts` and render 3D cards

### Step 4 — Wiring + basic hardening
- Input validation and sensible error messages
- Loading states and auth gating

### Step 5 — Run instructions
- Provide `npm install` and `npm start` steps for both frontend and backend

## Dependent files to edit
- Will add many new files (no existing codebase)

## Followup steps
- Run backend, then frontend
- Verify:
  - register/login works
  - image uploads work and are publicly visible
  - posts display in Three.js scene

<ask_followup_question>
Confirm whether you want the frontend to be served by a dev server (Vite) or served as static files from backend.
</ask_followup_question>

