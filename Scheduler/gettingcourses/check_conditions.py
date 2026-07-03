from bisect import bisect_right

__all__ =

# might want a "follow_course_constraints" for checking prerequisites

def follows_section_constraints():

def _isnt_usual_term(term: str) -> bool:
    unusual_term = "L" in term or term == "FS" or term == "WS"
    return not unusual_term


def _has_classes(section_classes: list = []) -> bool:
    has_section_classes = (len(section_classes) == 0)
    return has_section_classes


def follows_class_constraints():

def _isnt_lab_99(session_name: str) -> bool: # no one likes lab 99. Im sorry
    is_lab_99 = (("99") in session_name)
    return not is_lab_99

def _do_sessions_start(global_start_times: list = []) -> bool: # ran into empty case
    never_start = (global_start_times == [])
    return never_start

def _outside_personal_times(session_times: list[list, int], personal_times: dict) -> bool:
    curr_weekday_number = session_times[0][1] + session_times[0][2]*5
    curr_day_personal_times = personal_times[curr_weekday_number]
    session_start_time = session_times[0][0]
    session_end_time = session_times[1]

    latest_personal_time_idx = bisect_right(curr_day_personal_times, [session_end_time,
                                                                      float('inf')])

    for start, end in curr_day_personal_times[:latest_personal_time_idx]:
        if (start >= session_start_time): return True
    return False

def _add_unavailable_hours_constraint(self,
                                        unavailable_hours: dict[str, list[list[int, int]]],
                                        ) -> bool:


    for interval in intervals_by_days[unavailable_hours[0]]: # will need clean up
        unavailable_start = unavailable_hours[1][0]
        unavailable_end = unavailable_hours[1][1]

        interval_in_unavailable_time = (interval.start_expr() >= unavailable_start) \
                                        and (interval.start_expr() + interval.size_expr() \
                                        <= unavailable_end)
        if (interval_in_unavailable_time):
            model.add_bool_and(interval.presence_literals[0]) # set bool = 0
    return