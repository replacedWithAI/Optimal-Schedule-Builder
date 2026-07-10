from bisect import bisect_right
from bisect import bisect_left
from lib import ClassSession

class ConditionChecker:
    def __init__(self, personal_times: dict):
        self.personal_times = personal_times

    def is_usual_term(self, term: str) -> bool:
        unusual_term = ("L" in term) or (term == "FS") or (term == "WS")
        return unusual_term


    def has_no_classes(self, section_classes: list = []) -> bool:
        has_section_classes = (len(section_classes) == 0)
        return has_section_classes


    def is_lab_99(self, session_name: str) -> bool: # no one likes lab 99. Im sorry
        is_lab_99 = (("99") in session_name)
        return is_lab_99


    def no_sessions_start(self, global_start_times: list = []) -> bool: # ran into empty case
        never_start = (global_start_times == [])
        return never_start


    def session_doesnt_start(self, time: str) -> bool:
        return time == ""


    def outside_personal_times(self, curr_class: ClassSession) -> bool:
        for i in range(len(curr_class.start_times)):
            start_time = curr_class.start_times[i]

            curr_weekday_number = start_time[1] + start_time[2]*5
            if (not (curr_weekday_number in self.personal_times)): continue

            curr_day_personal_times = self.personal_times[curr_weekday_number]
            session_start_time = start_time[0]
            session_end_time = start_time[0] + curr_class.duration[i]

            right_index = bisect_right(curr_day_personal_times, [session_end_time, float('inf')])
            left_index = bisect_left(curr_day_personal_times, [session_start_time, float('inf')])

            is_outside = left_index >= right_index
            if (is_outside): return True

        return False
