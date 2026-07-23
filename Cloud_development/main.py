import sys
from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import json

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from Scheduler.program import calculate_schedule


def get_global_key(request: Request) -> str:
    return "global"

limiter = Limiter(key_func=get_global_key, default_limits="100/5minutes")
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://replacedwithai.github.io/Optimal-Schedule-Builder/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/status")
@limiter.limit("1/5seconds", key_func=get_remote_address)
async def connect() -> dict:
    return {"status": "connected"}


@app.post("/calculate")
@limiter.limit("1/5seconds", key_func=get_remote_address)
async def call_solver(request: Request, payload: dict) -> dict:
    # courses = selected_courses.get("courses") # revamp if people fix 
                                                # courses/sections/labs

    best_courses = calculate_schedule(payload)

    return {"courses": best_courses}


            