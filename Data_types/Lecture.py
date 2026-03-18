from dataclasses import dataclass
from Data_types.Other_class_sessions import Other_class_session

@dataclass
class Lecture:
    activity_name: str
    days: list[str]
    start_times: list[int]
    durations: list[int]
    campus: list[str]
    other_class_sessions: list[Other_class_session]