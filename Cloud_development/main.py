import sys
from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from program import calculate_schedule

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=["*"],
    allow_methods=["POST"],
    allow_headers=["*"]
)

@app.post("/api/run")
async def call_solver(selected_courses: dict) -> dict:
    try: 
        courses = selected_courses.get("courses") # revamp if people fix 
                                                  # courses/sections/labs

        best_courses = calculate_schedule(courses)

        return best_courses
    except Exception as exception:
        raise HTTPException(status_code=500, details=str(exception))


            