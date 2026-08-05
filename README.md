# Digest

**A smart cloud file system with AI built in.**

Digest is a multi-user file intelligence backend. Upload a document, and it's automatically summarized, indexed, and made searchable not just by filename, but by *meaning*. Ask for "the budget report from last week" and Digest finds it, even if you never named it that.

Built on FastAPI, Supabase (Auth, Postgres, Storage), and a locally-hosted LLM via Ollama no data ever leaves your infrastructure for AI processing.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Ollama](https://img.shields.io/badge/Ollama-local%20LLM-black)](https://ollama.com/)

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

Most file storage is dumb it knows a filename, a size, and an upload date, and nothing about what's actually inside the file. Digest changes that. Every file you upload is read by a local LLM, summarized, and stored alongside its content, so retrieval isn't limited to exact filename matches it's driven by understanding.

Every user's files are fully isolated. Auth, storage, and data access are all scoped per-user using Supabase Auth and enforced ownership checks on every route, so multi-tenancy is a first-class concern, not an afterthought.

## Features

- **Multi-user authentication** — secure signup/login via Supabase Auth (email + password), with JWT-based session verification on every protected route.
- **Per-user file isolation** — uploads are namespaced by user ID in storage and in the database; users can only ever see or act on their own files.
- **AI-powered summarization** — every uploaded document is automatically summarized on ingest using a locally-hosted LLM (`qwen2.5:7b` via Ollama).
- **Semantic lookup** — search your files by describing what you're looking for in natural language, not just by exact keyword match.
- **Full CRUD on files** — upload, list, fetch by ID, semantic lookup, and delete (with matching storage + database cleanup).
- **Local-first AI** — summarization and matching run entirely on your own machine through Ollama. No document content is sent to a third-party AI API.
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
                 │  └────────────────┘  │        (signup / login)
                 │  ┌────────────────┐  │
                 │  │     app.py      │  │──────► Supabase Postgres
                 │  │ (items, search, │  │        (items table, RLS)
                 │  │  lookup, upload,│  │
                 │  │  delete)        │  │──────► Supabase Storage
                 │  └────────────────┘  │        (per-user file paths)
                 │  ┌────────────────┐  │
                 │  │ dependencies.py │  │──────► Ollama
                 │  │ (JWT verify via │  │        qwen2.5:7b
                 │  │  JWKS, Ollama   │  │        (summarize + lookup)
                 │  │  health check)  │  │
                 │  └────────────────┘  │
                 └─────────────────────┘
```

Every request to a protected route passes through JWT verification (`dependencies.py`), which validates the Supabase-issued token against Supabase's public JWKS endpoint before the route logic runs. Routes that depend on the LLM additionally check that Ollama is reachable before proceeding, failing fast with a `503` if it isn't.

## Tech Stack

| Layer | Technology |
|---|---|
| API framework | [FastAPI](https://fastapi.tiangolo.com/) |
| Auth | [Supabase Auth](https://supabase.com/auth) (JWT, ES256 / JWKS) |
| Database | [Supabase Postgres](https://supabase.com/database) |
| File storage | [Supabase Storage](https://supabase.com/storage) |
| AI / LLM | [Ollama](https://ollama.com/) running `qwen2.5:7b` |
| Auth verification | [PyJWT](https://pyjwt.readthedocs.io/) with JWKS support |
| HTTP client | [httpx](https://www.python-httpx.org/) |
| Data validation | [Pydantic](https://docs.pydantic.dev/) |

## Project Structure

```
digest/
├── app.py                 # Main FastAPI app: items, search, lookup, upload, delete
├── dependencies.py        # JWT verification (JWKS/ES256), Ollama health-check decorator
├── routers/
│   ├── __init__.py
│   └── auth.py             # Signup / login routes
├── requirements.txt
├── .env.example
├── LICENSE
└── README.md
```

## Prerequisites

- **Python 3.11+**
- **A Supabase project** — [supabase.com](https://supabase.com), free tier is sufficient to start
  - A Storage bucket created for file uploads
  - A Postgres table for file metadata (see [Database Setup](#database-setup))
- **Ollama** — for local LLM-powered summarization and lookup

### Installing Ollama

macOS:
```bash
brew install ollama
```

Linux:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Windows: download the installer from [ollama.com/download](https://ollama.com/download)

Start the Ollama server:
```bash
ollama serve
```

Pull the model Digest uses:
```bash
ollama pull qwen2.5:7b
```

Verify it's running:
```bash
curl http://localhost:11434/api/tags
```

## Installation

```bash
# Clone the repository
git clone https://github.com/SaliqBashir/Digest.git
cd Digest

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Database Setup

In your Supabase project's SQL editor, create the `items` table:

```sql
create table items (
  item_id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  summary text,
  link text not null
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

Copy `.env.example` to `.env` and fill in your project's values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_JWT_KEY` | JWL auth key - used for user-facing auth actions (signup/login) |
| `SUPABASE_SECRET_KEY` | Service role key - used for backend data/storage operations. **Never expose this client-side.** |
| `SUPABASE_BUCKET` | Name of the Supabase Storage bucket used for file uploads |

All four keys are available in your Supabase dashboard under **Settings → API**.

> Digest verifies JWTs using Supabase's public JWKS endpoint (`{SUPABASE_URL}/auth/v1/.well-known/jwks.json`), so no JWT secret needs to be stored or configured separately.

## Running the Project

```bash
# Make sure Ollama is running first
ollama serve

# In a separate terminal, start the API
uvicorn app:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

Interactive API docs (Swagger UI) are auto-generated at:
```
http://127.0.0.1:8000/docs
```

## API Reference

All routes except `/auth/signup` and `/auth/login` require an `Authorization: Bearer <access_token>` header, obtained from `/auth/login`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create a new user account |
| `POST` | `/auth/login` | Log in, returns `access_token`, `refresh_token`, and `user_id` |

**Request body** (both):
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

### Files

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/get_items` | List all items belonging to the authenticated user |
| `GET` | `/get_item/{item_id}` | Fetch a single item by ID (must be owned by the requesting user) |
| `GET` | `/lookup?text=...` | Semantic search — finds the item whose content best matches the query, using the local LLM |
| `POST` | `/upload` | Upload a `.txt` file; auto-summarized and indexed |
| `DELETE` | `/delete/{item_id}` | Delete an item — removes both the storage object and its database row |

**Upload** expects `multipart/form-data` with a `file` field.

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

# 3. Upload a file
curl -X POST http://127.0.0.1:8000/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@/path/to/notes.txt"

# 4. List your files
curl http://127.0.0.1:8000/get_items \
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
