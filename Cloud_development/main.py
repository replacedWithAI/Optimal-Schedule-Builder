import sys
from pathlib import Path

cloud_dev_dir = str(Path(__file__).resolve().parent)
scheduler_dir = str(Path(__file__).resolve().parent.parent) + "/Scheduler"

for path in (cloud_dev_dir, scheduler_dir):
    if path not in sys.path:
        sys.path.append(path)

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse

from program import calculate_schedule
from authenticate import require_auth, require_worker, router as auth_router


def get_global_key(request: Request) -> str:
    return "global"

limiter = Limiter(key_func=get_global_key, default_limits=["100/5minutes"])
app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://replacedwithai.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

async def error_handler(request: Request, exception: Exception) -> JSONResponse:
    if isinstance(exception, RateLimitExceeded):
        return JSONResponse({"error": f"Rate limit exceeded: {exception.detail}"},
                            status_code=429)
    return JSONResponse({"error": "Internal server error"}, status_code=500)

app.add_exception_handler(RateLimitExceeded, error_handler)
app.add_exception_handler(ValueError, error_handler)

limiter._error_handler = error_handler
app.include_router(auth_router)


@app.get("/me")
async def get_user_info(user: dict = Depends(require_auth), 
                        _: None = Depends(require_worker)) -> dict:
    """
    Returns logged-in user info.
    Used by frontend to check is session cookie is valid
    """

    return {"email": user["email"], "name": user["name"]}


@app.post("/calculate")
@limiter.limit("1/5seconds", key_func=get_remote_address)
async def call_solver(request: Request, 
                      payload: dict, 
                      user: dict = Depends(require_auth),
                      _: None = Depends(require_worker)) -> dict:
    """Calls program.py in Scheduler folder"""

    best_courses = calculate_schedule(payload)

    return {"courses": best_courses}


            