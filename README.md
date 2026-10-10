# Digest

**A smart cloud file system with AI built in.**

Digest is a multi-user file intelligence backend. Upload a document, and it's automatically summarized, indexed, and made searchable not just by filename, but by *meaning*. Ask for "the budget report from last week" and Digest finds it, even if you never named it that.

Built on FastAPI, Supabase (Auth, Postgres, Storage), and Google Gemini for AI-powered summarization and semantic search.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-Google%20AI-blue)](https://aistudio.google.com/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Most file storage is dumb it knows a filename, a size, and an upload date, and nothing about what's actually inside the file. Digest changes that. Every file you upload — text or image — is read by Gemini, described/summarized, and stored alongside its content, so retrieval isn't limited to exact filename matches it's driven by understanding.

Every user's files are fully isolated. Auth, storage, and data access are all scoped per-user using Supabase Auth and enforced ownership checks on every route, so multi-tenancy is a first-class concern, not an afterthought.

## Features

- **Multi-user authentication** — secure signup/login via Supabase Auth (email + password), with JWT-based session verification on every protected route.
- **Per-user file isolation** — uploads are namespaced by user ID in storage and in the database; users can only ever see or act on their own files.
- **AI-powered summarization** — every uploaded text document is automatically summarized on ingest using Gemini (`gemini-2.5-flash` by default, configurable).
- **Semantic lookup** — search your files by describing what you're looking for in natural language, not just by exact keyword match.
- **Full CRUD on files** — upload, list, fetch by ID, semantic lookup, and delete (with matching storage + database cleanup).
- **Image support** — upload images (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`); Gemini describes the scene/objects/visible text so images are searchable by meaning too.
- **Cloud AI via Gemini** — summarization, image description, and matching run through the Gemini API. Note: file content is sent to Google for inference (see [Prerequisites](#prerequisites)).
- **Modern JWT verification** — supports Supabase's asymmetric (ES256) JWT Signing Keys via JWKS, not just legacy shared-secret verification.

## Architecture

```
                     ┌──────────────┐
                     │              │
                     │    Client    │
                     │              │
                     └──────┬───────┘
                            │  HTTPS
                            ▼
                 ┌─────────────────────┐
                 │      FastAPI         │
                 │  ┌────────────────┐  │
                 │  │  routers/auth   │  │──────► Supabase Auth
                 │  └────────────────┘  │        (signup / login / password)
                 │  ┌────────────────┐  │
                 │  │     app.py      │  │──────► Supabase Postgres
                 │  │ (search, lookup, │  │        (items table, RLS)
                 │  │  lookup, upload,│  │
                 │  │  delete)        │  │──────► Supabase Storage
                 │  └────────────────┘  │        (per-user file paths)
                 │  ┌────────────────┐  │
                 │  │ dependencies.py │  │──────► Gemini
                 │  │ (JWT verify via │  │        gemini-2.5-flash
                 │  │  JWKS, Gemini  │  │        (summarize + lookup)
                 │  │  health check)  │  │
                 │  └────────────────┘  │
                 └─────────────────────┘
```

Every request to a protected route passes through JWT verification (`dependencies.py`), which validates the Supabase-issued token against Supabase's public JWKS endpoint before the route logic runs. Routes that depend on the LLM require `GEMINI_API_KEY` to be configured, failing fast with a `500`/`503` if it is missing or the Gemini API is unreachable/rate-limited.

## Tech Stack

| Layer | Technology |
|---|---|
| API framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Auth | [Supabase Auth](https://supabase.com/auth) (JWT, ES256 / JWKS) |
| Database | [Supabase Postgres](https://supabase.com/database) |
| File storage | [Supabase Storage](https://supabase.com/storage) |
| AI / LLM | [Google Gemini](https://aistudio.google.com/) (`gemini-2.5-flash` default, configurable via `GEMINI_MODEL`) |
| Auth verification | [PyJWT](https://pyjwt.readthedocs.io/) with JWKS support |
| HTTP client | [httpx](https://www.python-httpx.org/) |
| Data validation | [Pydantic](https://docs.pydantic.dev/) |

## Project Structure

```
digest/
├── backend/
│   ├── app.py               # Main FastAPI app: search, lookup, upload, delete
│   ├── dependencies.py      # JWT verification (JWKS/ES256), Gemini helpers
│   ├── routers/
│   │   └── auth.py          # Signup / login / password routes
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # DataGrid, UploadView, LoginPage, etc.
│   │   ├── services/api.ts  # Axios client + endpoints
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
├── LICENSE
└── README.md
```

## Prerequisites

- **Python 3.11+**
- **A Supabase project** — [supabase.com](https://supabase.com), free tier is sufficient to start
  - A Storage bucket created for file uploads
  - A Postgres table for file metadata (see [Database Setup](#database-setup))
- **A Gemini API key** — for summarization, image description, and lookup via Google Gemini (free tier is sufficient to start). Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### Getting a Gemini API key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and sign in with a Google account.
2. Click **Create API key** (use an existing Google Cloud project or let it create one).
3. Copy the key (starts with `AIza...`).
4. Put it in `backend/.env` as `GEMINI_API_KEY='...'`.
5. Optional: set `GEMINI_MODEL` (default `gemini-2.5-flash`). Alternatives: `gemini-2.5-flash`, `gemini-2.5-flash-lite`.

> **Privacy note:** unlike the previous local-only setup, file text/images and summaries are sent to the Gemini API for inference. Don't upload sensitive data you aren't comfortable sharing with Google. See [Google's AI Studio terms](https://ai.google.dev/terms).

## Installation

```bash
# Clone the repository
git clone https://github.com/SaliqBashir/Digest.git
cd Digest

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL to your backend URL
```

### Database Setup

In your Supabase project's SQL editor, create the `items` table:

```sql
create table items (
  item_id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  summary text,
  link text not null,
  filename text,
  file_size bigint
);

alter table items enable row level security;

create policy "Users can view own items"
on items for select
using (auth.uid() = user_id);

create policy "Users can insert own items"
on items for insert
with check (auth.uid() = user_id);

create policy "Users can delete own items"
on items for delete
using (auth.uid() = user_id);
```

> **Note:** Digest's backend currently uses the Supabase **service role key** for data access, which bypasses Row Level Security. The policies above are still recommended as a defense-in-depth measure and to support any future client-side/direct Supabase access.

In Supabase Storage, create a bucket (e.g. `digest`) for file uploads.

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your project's values:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_SECRET_KEY` | Yes | Service role key - used for backend data/storage operations. **Never expose this client-side.** |
| `SUPABASE_BUCKET` | Yes | Name of the Supabase Storage bucket used for file uploads |
| `GEMINI_API_KEY` | Yes | Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). **Never expose this client-side.** |
| `GEMINI_MODEL` | No | Gemini model name (default `gemini-2.5-flash`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default `http://localhost:5173,http://127.0.0.1:5173`) |
| `MAX_FILE_SIZE_MB` | No | Max text file size in MB (default `50`) |
| `MAX_IMAGE_SIZE_MB` | No | Max image size in MB (default `10`) |

All required keys are available in your Supabase dashboard under **Settings → API**.

Frontend uses `frontend/.env`:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |

> Digest verifies JWTs using Supabase's public JWKS endpoint (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`), so no JWT secret needs to be stored or configured separately.

## Running the Project

```bash
# Start the API (from backend/) — requires GEMINI_API_KEY in backend/.env
cd backend
uvicorn app:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

Interactive API docs (Swagger UI) are auto-generated at:
```
http://127.0.0.1:8000/docs
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production

```bash
# Backend: no --reload, set CORS to your domain, multiple workers
cd backend
CORS_ORIGINS='https://your-app.com' uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4

# Frontend: build static assets and serve dist/ behind your web server
cd frontend
VITE_API_URL='https://api.your-app.com' npm run build
```

Never commit `backend/.env` or `frontend/.env` (both gitignored) — set env vars on your host instead. Never expose `SUPABASE_SECRET_KEY` or `GEMINI_API_KEY` client-side.

## API Reference

All routes except `/auth/signup` and `/auth/login` require an `Authorization: Bearer <access_token>` header, obtained from `/auth/login`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create a new user account |
| `POST` | `/auth/login` | Log in, returns `access_token`, `refresh_token`, and `user_id` |
| `PUT` | `/auth/password` | Update password (requires `Authorization` header) |

**Request body** (signup/login):
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Request body** (password update):
```json
{
  "new_password": "newpassword123"
}
```

### Files

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/ping` | Uptime ping, always responds `OK` (for external cron/pingers) |
| `GET` | `/search?limit=50&offset=0` | List items belonging to the authenticated user (paginated, newest first) |
| `GET` | `/search/{item_id}` | Fetch a single item by ID (must be owned by the requesting user) |
| `GET` | `/lookup?text=...` | Semantic search — finds the item whose summary best matches the query, using Gemini |
| `POST` | `/upload` | Upload a document (`.txt`, `.md`, `.csv`, `.json`, `.log`, `.pdf`, `.docx`, `.pptx`, `.xlsx`) or image (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`); text extracted then summarized/described via Gemini and indexed |
| `DELETE` | `/delete/{item_id}` | Delete an item — removes both the storage object and its database row |

**Upload** expects `multipart/form-data` with a `file` field. Docs/text max 50MB (`MAX_FILE_SIZE_MB`), images max 10MB (`MAX_IMAGE_SIZE_MB`). Plain text must be UTF-8; office docs are parsed server-side (scanned PDFs without a text layer are rejected); images are validated by magic bytes.

**Example — full flow with curl:**

```bash
# 1. Sign up
curl -X POST http://127.0.0.1:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword"}'

# 2. Log in
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "yourpassword"}'
# → copy the access_token from the response

# 3. Upload a file (text or image)
curl -X POST http://127.0.0.1:8000/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/notes.txt"
# curl -X POST http://127.0.0.1:8000/upload \
#   -H "Authorization: Bearer <access_token>" \
#   -F "file=@/path/to/photo.jpg"

# 4. List your files
curl "http://127.0.0.1:8000/search?limit=50&offset=0" \
  -H "Authorization: Bearer <access_token>"

# 5. Semantic search
curl "http://127.0.0.1:8000/lookup?text=meeting notes about budget" \
  -H "Authorization: Bearer <access_token>"

# 6. Delete a file
curl -X DELETE http://127.0.0.1:8000/delete/1 \
  -H "Authorization: Bearer <access_token>"
```

## Authentication Flow

1. A user signs up or logs in via `/auth/signup` / `/auth/login`. These routes proxy to Supabase Auth, which issues a JWT (`access_token`) signed with Supabase's private signing key.
2. The client includes this token as `Authorization: Bearer <access_token>` on every subsequent request.
3. `dependencies.py` verifies the token's signature locally against Supabase's public JWKS — no round trip to Supabase is needed to validate a request.
4. The verified `sub` claim (the user's UUID) is extracted and used to scope every database query and storage path, ensuring users can only ever access their own data.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch and open a pull request

## License

This project is licensed under the [MIT License](LICENSE).
