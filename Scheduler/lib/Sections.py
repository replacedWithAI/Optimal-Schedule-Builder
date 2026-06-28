from dataclasses import dataclass
from Scheduler.lib.Class_sessions import Class_session

@dataclass
class Section:
    term: list[int]
    section_letter: str
    professor: str
    classes: list[Class_session]