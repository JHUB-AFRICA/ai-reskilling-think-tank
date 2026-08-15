"""
auth.py

FastAPI dependency verifying Supabase-issued JWTs. Supabase signs
access tokens with HS256 using the project's JWT secret (Project
Settings -> Data API -> JWT Secret) -- this dependency decodes and
verifies that signature locally, extracting the user id (`sub` claim)
and email, with no network call to Supabase itself. This keeps
authenticated request latency independent of Supabase's availability
for the verification step (though of course the database calls that
follow still depend on it).
"""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException

load_dotenv()

_raw_jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
# Supabase stores the JWT secret as a base64url-encoded string in the dashboard.
# PyJWT >= 2.x needs the raw bytes for HS256 verification, so we decode it here.
# If the value is already plain text (not valid base64) we fall back to the raw string.
try:
    # Supabase secrets may use standard or URL-safe base64; add padding if needed.
    _padded = _raw_jwt_secret + "==" * ((-len(_raw_jwt_secret)) % 4)
    SUPABASE_JWT_SECRET: bytes | str = base64.b64decode(_padded, altchars=b"-_")
except Exception:
    SUPABASE_JWT_SECRET = _raw_jwt_secret
JWT_AUDIENCE = "authenticated"  # Supabase's standard audience claim for access tokens
LOCAL_PREVIEW_TOKEN = "local-token"
LOCAL_PREVIEW_USER_ID = os.environ.get("LOCAL_PREVIEW_USER_ID", "local-preview-user")
LOCAL_PREVIEW_EMAIL = os.environ.get("LOCAL_PREVIEW_EMAIL", "local-preview@example.com")


@dataclass
class CurrentUser:
    id: str
    email: str | None


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
        return CurrentUser(id=LOCAL_PREVIEW_USER_ID, email=LOCAL_PREVIEW_EMAIL)

    if not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail=(
                "SUPABASE_JWT_SECRET is not configured on the server. "
                "Set it in .env (Project Settings -> Data API -> JWT Secret)."
            ),
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience=JWT_AUDIENCE,
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc

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


def get_current_user_with_role(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUserWithRole:
    from reskilling import db

    profile = db.get_user_profile(user.id)
    if profile is None:
        # The auth trigger (004_create_profiles_table.sql) should have
        # created this row at signup. A missing profile is a genuine,
        # reportable inconsistency, not something to paper over with a
        # silent default -- surfacing it as a clear 500 is more honest
        # than quietly assuming "job_seeker" and hiding a real bug.
        raise HTTPException(
            status_code=500,
            detail=(
                f"No profile found for user {user.id}. The auth trigger in "
                "004_create_profiles_table.sql may not have run for this account."
            ),
        )

    return CurrentUserWithRole(id=user.id, email=user.email, role=profile["role"])


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
