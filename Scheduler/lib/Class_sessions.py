from dataclasses import dataclass

@dataclass
class Class_session:
    activity_name: str
    start_times: list[list[int, int, int]] # [minute, day, semester]
    global_start_times: list[int]
    duration: list[int]
    global_end_times: list[int]
    campus: list[str]