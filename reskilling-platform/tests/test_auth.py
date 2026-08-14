"""
test_auth.py

Tests app_api/auth.py's JWT verification using a manually-signed test
token and a fake secret -- no real Supabase project or network access
required, since the whole point of verifying Supabase JWTs locally is
that it doesn't need one.

Run with: pytest tests/test_auth.py -v
"""

from __future__ import annotations

import time

import jwt
import pytest
from fastapi import HTTPException

import app_api.auth as auth_module
from app_api.auth import JWT_AUDIENCE, get_current_user

TEST_SECRET = "test-secret-for-unit-tests-only-32-bytes-min"


def make_token(
    sub: str = "user-123",
    email: str | None = "test@example.com",
    exp_delta: int = 3600,
    aud: str = JWT_AUDIENCE,
    secret: str = TEST_SECRET,
) -> str:
    payload = {"sub": sub, "aud": aud, "exp": int(time.time()) + exp_delta}
    if email is not None:
        payload["email"] = email
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def set_test_secret(monkeypatch):
    monkeypatch.setattr(auth_module, "SUPABASE_JWT_SECRET", TEST_SECRET)


class TestGetCurrentUser:
    def test_valid_token_returns_user(self):
        token = make_token()
        user = get_current_user(authorization=f"Bearer {token}")
        assert user.id == "user-123"
        assert user.email == "test@example.com"

    def test_token_without_email_claim_is_still_valid(self):
        token = make_token(email=None)
        user = get_current_user(authorization=f"Bearer {token}")
        assert user.id == "user-123"
        assert user.email is None

    def test_missing_bearer_prefix_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization="not-a-bearer-token")
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self):
        token = make_token(exp_delta=-10)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401

    def test_wrong_secret_raises_401(self):
        token = make_token(secret="wrong-secret-entirely-also-32-bytes-plus")
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401

    def test_wrong_audience_raises_401(self):
        token = make_token(aud="not-authenticated")
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401

    def test_missing_sub_claim_raises_401(self):
        payload = {"aud": JWT_AUDIENCE, "exp": int(time.time()) + 3600}
        token = jwt.encode(payload, TEST_SECRET, algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 401

    def test_missing_secret_config_raises_500(self, monkeypatch):
        monkeypatch.setattr(auth_module, "SUPABASE_JWT_SECRET", None)
        token = make_token()
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(authorization=f"Bearer {token}")
        assert exc_info.value.status_code == 500
