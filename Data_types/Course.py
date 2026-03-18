from dataclasses import dataclass
# from LabsOrTutorials import LabsOrTutorials
# from Lectures import Lectures
from Data_types.Sections import Section

@dataclass
class Course:
    faculty: str
    department: str
    course_code: str
    credits: str
    course_name: str
    prerequisites: list[str]
    sections: list[Section]