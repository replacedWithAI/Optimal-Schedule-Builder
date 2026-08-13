"""
Google OAuth and JWT session management
1. Frontend redirects user to Google
2. Google redirects user with a code
3. Exchange user's code for an ID token, then verify it and check its domain
4. Issue a JWT token and make it an HttpOnly cookie
5. Every endpoint calls "require_auth" to read and verify the cookie
"""

import os
import httpx 
from datetime import datetime, timedelta, timezone
from typing import Annotated
import secrets

from fastapi import APIRouter, Cookie, Header, HTTPException, Response, Request
from fastapi import Depends               
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
JWT_SECRET = os.environ["JWT_SECRET"]
FRONTEND_URL = os.environ["FRONTEND_URL"]
WORKER_SECRET = os.environ["WORKER_SECRET"]

ALLOWED_DOMAINS = ["my.yorku.ca", "yorku.ca"]
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 8
SESSION_COOKIE = "session"


def require_worker(x_backend_secret: Annotated[str | None, Header()] = None) -> None:
    """Rejects requests that didn't come through the Cloudflare Worker proxy"""
    if not x_backend_secret or not secrets.compare_digest(x_backend_secret, WORKER_SECRET):
        raise HTTPException(status_code=403, detail="Direct access not allowed")


router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(require_worker)])


@router.get("/login")
def login(request: Request):
    """Make Google OAuth consent screen URL, then redirects the browser there"""
    redirect_uri = _get_redirect_uri(request)

    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        "&response_type=code"
        "&scope=openid email profile"
        "&access_type=offline"
        "&prompt=select_account"
    )

    return RedirectResponse(google_auth_url)


@router.get("/callback")
async def callback(code: str, request: Request, response: Response):
    """
    The 'main method'. Exchange an auth code for a Google ID token, verify it, 
    check the domain, issue a JWT cookie
    """

    redirect_uri = _get_redirect_uri(request)
    google_id_token = await _exchange_auth_code_for_id_token(code, redirect_uri)
    user_info = _verify_google_token(google_id_token)
    email = user_info["email"]
    _assert_school_email(email)

    jwt_token = _create_jwt(email=email, name=user_info.get("name", ""))

    frontend_response = RedirectResponse(url=FRONTEND_URL)
    frontend_response.set_cookie(
        key=SESSION_COOKIE,
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=JWT_EXPIRY_HOURS*3600,
        path="/"
    )

    return frontend_response


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"status": "logged out"}
    

def require_auth(session: Annotated[str | None, Cookie()] = None) -> dict:
    """Added to FastAPI functions. \n
    Used like async def my_route(user: dict = Depends(require_auth)): \n
    Returns a decoded JWT payload with email and name. Raises 401 code if cookie
    is missing or token is invalid"""

    if session is None:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    try: 
        payload = jwt.decode(session, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Session expired or invalid." \
                                                    "Log in again")


def _get_redirect_uri(request: Request) -> str:
    """ Builds and reutrns the callback URL """
    return f"{os.environ["PUBLIC_PROXY_URL"]}/auth/callback"


async def _exchange_auth_code_for_id_token(code: str, redirect_uri: str) -> str:
    """ POSTs the auth code to Google and gets the raw ID string token """

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL, data = {
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            }
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Couldn't get Google token: {resp.text}. Status: {resp.status_code}"
        )

    return resp.json()["id_token"]


def _verify_google_token(raw_token_id: str) -> dict:
    """Verifies token ID is real using Google public keys"""

    try: 
        info = id_token.verify_oauth2_token(
            raw_token_id,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        return info
    except ValueError as e:
        raise HTTPException(status_code=401, 
                            detail=f"Couldn't validate token: {e}")


def _assert_school_email(email: str):
    """Make sure email is in ALLOWED_DOMAINS. Reject if otherwise"""

    domain = email[email.find("@")+1:]
    if domain not in ALLOWED_DOMAINS:
        raise HTTPException(
            status_code=403,
            detail=f"Email domain isn't in Yorku. Got @{domain}"
        )


def _create_jwt(email: str, name: str) -> str:
    """Make a JWT token to store as a browser cookie"""

    now = datetime.now(timezone.utc)
    payload = {
        "sub": email,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS)
    }

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)