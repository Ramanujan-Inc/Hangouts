from typing import Optional
from supabase import create_client, Client
from app.core.config import settings

_supabase_client: Optional[Client] = None


def _init_client() -> Client:
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    # Neutralize Gotrue auth state listeners on the persistent backend client so that
    # any user logins/signups do not overwrite the service-role authorization header
    # or reset the postgrest connection pool.
    client._listen_to_auth_events = lambda *args, **kwargs: None
    if hasattr(client, "auth") and hasattr(client.auth, "_state_change_emitters"):
        client.auth._state_change_emitters.clear()
    return client


def get_supabase_client() -> Client:
    """Returns the shared persistent Supabase Client instance, maintaining HTTP connection pooling and keep-alive."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = _init_client()
    return _supabase_client


supabase: Client = get_supabase_client()


