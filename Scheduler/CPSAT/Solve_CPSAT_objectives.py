from typing import Any
from ortools.sat.python import cp_model

__all__ = ["solve_scheduling_goals"]

def solve_scheduling_goals(intervals_by_day: dict[str, list[Any]], 
                           course_presences: list[Any], commute_time: int, 
                           model: cp_model):
    _objective_priority(intervals_by_day, course_presences, commute_time, model)


def _objective_priority(intervals_by_day: dict[str, list[Any]], 
                        course_presences: list[Any], commute_time: int, 
                        model: cp_model): #WIP
    _solve_minimal_dead_times(intervals_by_day, course_presences, commute_time, model)


def _solve_minimal_dead_times(intervals_by_day: dict[str, list[Any]],
                              course_presences: list[Any], commute_time: int, 
                              model: cp_model):
    all_daily_school_day_length = []

    for curr_day, intervals in intervals_by_day.items():
        if intervals == []:
            continue

        day_start = model.new_int_var(0, 1440, f"{curr_day}_start")
        day_end = model.new_int_var(0, 1440, f"{curr_day}_end")
        school_day_length = model.new_int_var(0, 1440 + commute_time*2, f"{curr_day}_length")

        is_day_active = model.new_int_var(0, 1, f"{curr_day}_active")
        day_presences = []

        for interval in intervals:
            interval_local_start = interval.start_expr() % 1440 
            interval_local_end = interval.end_expr() % 1440
            interval_present = interval.presence_literals()[0]

            day_presences.append(interval_present)

            model.add(day_start <= interval_local_start).only_enforce_if(interval_present)
            model.add(day_end >= interval_local_end).only_enforce_if(interval_present)
        
        model.add_max_equality(is_day_active, day_presences)
        model.add(school_day_length == (day_end-day_start + is_day_active*commute_time*2))
        all_daily_school_day_length.append(school_day_length)

    TAKE_COURSES_WEIGHT = 14400
    model.minimize(sum(all_daily_school_day_length) - TAKE_COURSES_WEIGHT*
                                                      sum(course_presences))