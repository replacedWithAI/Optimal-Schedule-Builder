from typing import Any
from ortools.sat.python import cp_model

from lib import Course


__all__ = ["solve_scheduling_goals"]

def solve_scheduling_goals(courses: list[Course],
                           intervals_by_day: dict[str, list[Any]], 
                           course_presences: list[Any], payload: dict, 
                           model: cp_model) -> tuple:
    return _objective_priority(courses, intervals_by_day, course_presences, 
                               payload, model)


def _objective_priority(courses: list[Course],
                        intervals_by_day: dict[str, list[Any]], 
                        course_presences: list[Any], payload: dict, 
                        model: cp_model) -> tuple: 
    commute_times = payload["goals"]["commute times"]
    objective_priority = payload["goals"]["objective priority"]

    objectives = _propagate_objective_todo_list(courses,
                                                objective_priority,
                                                intervals_by_day,
                                                course_presences, commute_times, 
                                                model)

    solver = cp_model.CpSolver()

    for i, (objective, direction) in enumerate(objectives):
        if (direction == "minimise"):
            model.minimize(objective)
        elif (direction == "maximise"):
            model.maximize(objective)
        else:
            print(f"Error with direction: {direction} for objective {objective}")
            continue

        status = solver.solve(model)
        if status != cp_model.OPTIMAL and status != cp_model.FEASIBLE:
            print(f"Solver couldn't solve {objective}; status: {status}")
            continue

        not_last_objective = i < len(objectives) - 1
        if not_last_objective:
            best_value = solver.value(objective)
            model.add(objective == best_value)

    return status, solver


def _propagate_objective_todo_list(courses: list[Course],
                                   objective_priority: list[str],
                                   intervals_by_day: dict[str, list[Any]],
                                   course_presences: list[Any],
                                   commute_time: int, model: cp_model
                                   ) -> list[tuple]:
    objectives = []

    prof_ratings = _solve_best_professors(courses, model)
    total_dead_times = _solve_minimal_dead_times(intervals_by_day, commute_time,
                                                 model)

    objectives.append((sum(course_presences), "maximise"))

    if objective_priority == []:
        objective_priority.append((total_dead_times, "minimise"))
        return objective_priority

    for objective in objective_priority:
        if (objective == "least dead times"):
            objectives.append((total_dead_times, "minimise"))
        elif objective == "best rated profs":
            objectives.append((prof_ratings, "maximise"))
        else:
            print(f"Objective {objective} is unconsidered")

    return objectives


def _solve_minimal_dead_times(intervals_by_day: dict[str, list[Any]],
                              commute_time: int, model: cp_model):
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

    return (sum(all_daily_school_day_length))


def _solve_best_professors(courses: list[Course], model: cp_model):
    schedule_score = 0

    for course in courses:
        for section in course.sections:
            rating = int(round(section.RMP_score * 10))
            section_presence = section.section_presence
            schedule_score += rating * section_presence
    return schedule_score
