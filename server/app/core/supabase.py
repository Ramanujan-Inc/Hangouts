from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Returns a singleton instance of the Supabase Client using SUPABASE_KEY with keep-alive connection reuse."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client


supabase: Client = get_supabase_client()

