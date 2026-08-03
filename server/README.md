# Hangouts Server

FastAPI backend server for the Hangouts application with local Supabase integration.

## Prerequisites

- [`uv`](https://docs.astral.sh/uv/) (Python package manager)
- [Docker](https://docs.docker.com/get-docker/) & [Supabase CLI](https://supabase.com/docs/guides/cli)

## Setup & Getting Started

### 1. Install Dependencies & Activate Environment

Sync dependencies defined in `pyproject.toml` and create the virtual environment:

```bash
uv sync
```

Activate the virtual environment:
- **Linux / macOS**:
  ```bash
  source .venv/bin/activate
  ```
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\activate
  ```

Create local environment variables file:
```bash
cp .env.example .env
```

### 2. SELinux Setup (Linux / Fedora / RHEL only)

If you are running on an SELinux-enforcing Linux host, run the setup script once before starting Supabase:

```bash
chmod +x scripts/fix_selinux_supabase.sh
./scripts/fix_selinux_supabase.sh
```

### 3. Start Local Supabase Stack

Start the local Supabase database, Studio, and Auth services:

```bash
supabase start
```

### 4. Run FastAPI Development Server

Start the FastAPI development server with auto-reload:

```bash
uv run uvicorn app.main:app --reload
```

Once running, access:
- **API Base**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Supabase Studio**: [http://127.0.0.1:54323](http://127.0.0.1:54323)
