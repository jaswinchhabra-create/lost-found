# Lost & Found Community Board (Three.js + Full-stack)

## What it does
- 3D community board UI using **Three.js**
- Register/Login (JWT)
- Upload photos when creating **Lost/Found** posts
- Uploaded images become visible immediately to everyone

## Project structure
- `frontend/` — Three.js frontend (Vite)
- `backend/` — Node/Express + SQLite backend

## Run locally
### Backend
```bat
cd backend
copy .env.example .env
npm install
npm run dev
```
Backend runs at: `http://localhost:4000`

### Frontend
```bat
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

## API (backend)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/posts`
- `POST /api/posts` (multipart form-data: `type`, `tag`, `title`, `description`, `images`)
- `DELETE /api/posts/:id`

## Uploads
Backend serves images from:
- `GET /uploads/<filename>`

