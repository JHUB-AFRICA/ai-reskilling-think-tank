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

import os
from dataclasses import dataclass

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException

load_dotenv()

_raw_jwt_secret = os.environ.get("SUPABASE_JWT_SECRET", "").strip()
# Supabase signs JWTs using the raw JWT secret string (as shown in Project Settings
# ? Data API ? JWT Secret) -- NOT the base64-decoded bytes of that string.
# PyJWT 2.x must receive the same raw string that Supabase used for signing,
# otherwise it cannot verify the signature and raises InvalidAlgorithmError.
SUPABASE_JWT_SECRET: str = _raw_jwt_secret
JWT_AUDIENCE = "authenticated"  # Supabase's standard audience claim for access tokens
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
        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get("alg")
        except Exception:
            alg = "unknown"
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}. alg in token: {alg}") from exc

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

    return CurrentUserWithRole(
        id=user.id,
        email=user.email,
        role=profile["role"],
        full_name=profile.get("full_name"),
        target_career=profile.get("target_career"),
        experience_level=profile.get("experience_level"),
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
