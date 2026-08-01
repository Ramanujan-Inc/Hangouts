# Hangouts Server

FastAPI backend server for the Hangouts application.

## Prerequisites

Make sure you have [`uv`](https://docs.astral.sh/uv/) installed.

## Getting Started

### 1. Activate Virtual Environment

- **Linux / macOS**:
  ```bash
  source .venv/bin/activate
  ```
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\activate
  ```

### 2. Install Dependencies

Sync the dependencies defined in `pyproject.toml`:

```bash
uv sync
```

### 3. Run Development Server

Start the FastAPI development server with auto-reload:

```bash
uv run uvicorn main:app --reload
```

Once running, access:
- **API Base**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
