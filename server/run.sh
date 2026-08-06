#!/usr/bin/env bash
exec uv run uvicorn app.main:app --reload
