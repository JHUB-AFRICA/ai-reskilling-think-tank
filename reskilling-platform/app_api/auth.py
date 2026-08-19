"""
auth.py

FastAPI dependency verifying Supabase-issued JWTs. It supports both
legacy HS256 projects (using SUPABASE_JWT_SECRET) and modern asymmetric
Supabase signing keys (ES256/RS256), whose public keys are obtained from
the project's JWKS endpoint.  No private signing material is ever sent
to the client.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException
from jwt.exceptions import PyJWKClientError

load_dotenv()

SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
JWT_AUDIENCE = "authenticated"  # Supabase's standard audience claim for access tokens
ASYMMETRIC_ALGORITHMS = frozenset({"ES256", "RS256"})
LOCAL_PREVIEW_TOKEN = "local-token"
LOCAL_PREVIEW_USER_ID = os.environ.get("LOCAL_PREVIEW_USER_ID", "local-preview-user")
LOCAL_PREVIEW_EMAIL = os.environ.get("LOCAL_PREVIEW_EMAIL", "local-preview@example.com")
# When DISABLE_LOCAL_PREVIEW=true (set automatically in docker-compose.yml),
# the local-token dev bypass is fully disabled -- any request carrying it
# will be rejected with a 401 instead of silently getting preview-user access.
# Never leave this unset in a production deployment.
_LOCAL_PREVIEW_ENABLED = os.environ.get("DISABLE_LOCAL_PREVIEW", "").lower() not in (
    "1",
    "true",
    "yes",
)


@dataclass
class CurrentUser:
    id: str
    email: str | None


@lru_cache(maxsize=1)
def _get_jwks_client(jwks_url: str) -> jwt.PyJWKClient:
    """Create one cached JWKS client; PyJWT refreshes keys when necessary."""
    return jwt.PyJWKClient(jwks_url)


def _verify_supabase_token(token: str) -> dict:
    """Verify a token against the explicitly supported Supabase algorithms."""
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")

    if algorithm == "HS256":
        if not SUPABASE_JWT_SECRET:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_JWT_SECRET is not configured for legacy HS256 tokens.",
            )
        return jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
        )

    if algorithm in ASYMMETRIC_ALGORITHMS:
        if not SUPABASE_URL:
            raise HTTPException(
                status_code=500,
                detail=(
                    "SUPABASE_URL is not configured for asymmetric JWT verification."
                ),
            )
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        signing_key = _get_jwks_client(jwks_url).get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[algorithm],
            audience=JWT_AUDIENCE,
        )

    raise HTTPException(
        status_code=401,
        detail=f"Unsupported JWT signing algorithm: {algorithm or 'missing'}.",
    )


def get_current_user(authorization: str = Header(...)) -> CurrentUser:
    """
    FastAPI dependency: pass as `user: CurrentUser = Depends(get_current_user)`
    on any endpoint that requires a logged-in user. Expects a standard
    `Authorization: Bearer <token>` header, as sent automatically by
    the Supabase JS client on the frontend.

    When the frontend is running in local preview mode it sends the
    synthetic `local-token` bearer token. In that mode, the server uses a
    development fallback user so the authenticated endpoints keep working
    even when no Supabase JWT secret is configured.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or malformed Authorization header."
        )

    token = authorization.removeprefix("Bearer ").strip()

    if token == LOCAL_PREVIEW_TOKEN:
        if not _LOCAL_PREVIEW_ENABLED:
            raise HTTPException(
                status_code=401,
                detail=(
                    "Local preview token is disabled in this deployment. "
                    "Sign in with a real Supabase account."
                ),
            )
        return CurrentUser(id=LOCAL_PREVIEW_USER_ID, email=LOCAL_PREVIEW_EMAIL)

    try:
        payload = _verify_supabase_token(token)
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token has expired.") from exc
    except PyJWKClientError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve the Supabase JWT verification key.",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token.") from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing 'sub' claim.")

    return CurrentUser(id=user_id, email=payload.get("email"))


# --------------------------------------------------------------------------
# Role-based access. Deliberately layered ON TOP of get_current_user
# rather than folded into it: role lookup requires a database call
# (db.get_user_profile), and most endpoints that just need "is this a
# real logged-in user" should never pay that cost or take on that
# dependency. Only endpoints that actually branch on role should use
# get_current_user_with_role / require_role below.
# --------------------------------------------------------------------------


@dataclass
class CurrentUserWithRole(CurrentUser):
    role: str
    full_name: str | None = None
    target_career: str | None = None
    experience_level: str | None = None


def get_current_user_with_role(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUserWithRole:
    from reskilling import db

    profile = db.get_user_profile(user.id)
    if profile is None:
        try:
            profile = db.upsert_profile_details(user_id=user.id, email=user.email)
        except Exception:
            pass

    return CurrentUserWithRole(
        id=user.id,
        email=user.email,
        role=profile.get("role", "job_seeker") if profile else "job_seeker",
        full_name=profile.get("full_name") if profile else None,
        target_career=profile.get("target_career") if profile else None,
        experience_level=profile.get("experience_level") if profile else None,
    )


def require_role(*allowed_roles: str):
    """
    Dependency factory: require_role("administrator") returns a
    dependency that raises 403 for any signed-in user whose role isn't
    in the allowed set. Usage: user: CurrentUserWithRole =
    Depends(require_role("administrator")).
    """

    def _check(
        user: CurrentUserWithRole = Depends(get_current_user_with_role),
    ) -> CurrentUserWithRole:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires one of: {', '.join(allowed_roles)}.",
            )
        return user

    return _check
