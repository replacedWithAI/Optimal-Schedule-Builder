import sys
from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from Scheduler.program import calculate_schedule

app = FastAPI()

limiter = Limiter(key_func = get_remote_address, default_limits=["3/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [
    "https://replacedwithai.github.io/Optimal-Schedule-Builder/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
app.add_middleware(SlowAPIMiddleware)

@app.get("/status")
async def connect() -> dict:
    return {"status": "connected"}


@app.post("/calculate")
def call_solver(payload: dict) -> dict:
    # courses = selected_courses.get("courses") # revamp if people fix 
                                                # courses/sections/labs

    best_courses = calculate_schedule(payload)

    return {"courses": best_courses}


            