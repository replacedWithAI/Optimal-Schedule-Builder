from dataclasses import dataclass
# from LabsOrTutorials import LabsOrTutorials
# from Lectures import Lectures
from Scheduler.lib.Data_types.Sections import Section
from typing import Any

@dataclass
class Course:
    faculty: str
    department: str
    course_code: str
    credits: str
    course_name: str
    prerequisites: list[str]
    sections: list[Section]
    sections_presence: list[Any]