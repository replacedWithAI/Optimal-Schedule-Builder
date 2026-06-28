import sys
from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, HTTPException
import json
from fastapi.middleware.cors import CORSMiddleware
from program import calculate_schedule

app = FastAPI()

origins = [

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/status")
async def connect() -> dict:
    return {"status": "connected"}


@app.post("/calculate")
def call_solver(selected_courses: dict) -> dict:
    # courses = selected_courses.get("courses") # revamp if people fix 
                                                # courses/sections/labs

    best_courses = calculate_schedule()

    return {"courses": best_courses}


            