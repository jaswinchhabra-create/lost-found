# Lost & Found Backend (Express + SQLite)

## Setup
1. Create `.env` file (copy from `.env.example`):
   - `PORT=4000`
   - `JWT_SECRET=change_this_super_secret`
   - `CORS_ORIGIN=http://localhost:5173`

2. Install:
   - `npm install`

3. Run dev:
   - `npm run dev`

Backend runs at `http://localhost:4000`.

## API
- `POST /api/auth/register` body: `{ username, email, password }`
- `POST /api/auth/login` body: `{ usernameOrEmail, password }` OR `{ username, email, password }`
- `GET /api/posts`
- `POST /api/posts` (auth, multipart/form-data): `type` (lost|found), `tag`, `title`, `description`, `images` (one or more)
- `DELETE /api/posts/:id` (auth, owner-only)

## Uploads
Images are served from:
- `GET /uploads/<filename>`

They are stored in `backend/uploads/`.

