from dataclasses import dataclass
from typing import Any

@dataclass
class ClassSession:
    activity_name: str
    start_times: list[list[int, int, int]] # [minute, day, semester]
    global_start_times: list[int]
    duration: list[int]
    global_end_times: list[int]
    campus: list[str]

@dataclass
class Section:
    term: list[int]
    section_letter: str
    professor: str
    classes: list[ClassSession]

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
    sections_presence: list[Any]

