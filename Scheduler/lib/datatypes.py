from dataclasses import dataclass
from typing import Any

@dataclass
class ClassSession:
    session_name: str
    start_times: list[list[int, int, int]] # [minute, day, semester]
    global_start_times: list[int]
    duration: list[int]
    global_end_times: list[int]
    campus: list[str]
    session_presences: list[Any]

@dataclass
class Section:
    term: list[int]
    section_letter: str
    professor: str
    classes: list[ClassSession]
    fixed_classes: list[str]
    section_presence: Any

@dataclass
class Course:
    faculty: str
    department: str
    course_number: str
    course_code: str
    credits: str
    course_name: str
    prerequisites: list[str]
    sections: list[Section]
    course_presence: Any

