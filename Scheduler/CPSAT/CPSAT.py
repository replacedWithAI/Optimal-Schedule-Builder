from typing import Any
from ortools.sat.python import cp_model
from lib import Course
from CPSAT.variable_maker import make_CPSAT_variables
from CPSAT.make_constraints import ConstraintEnforcer
from CPSAT.Solve_CPSAT_objectives import solve_scheduling_goals
from CPSAT.Extract_solver_values import get_best_classes

def find_best_options(courses: list[Course], payload: dict):
    
    model = cp_model.CpModel()
    solver = cp_model.CpSolver()

    (interval_variables, intervals_by_day) = make_CPSAT_variables(courses, model)
    
    enforcer = ConstraintEnforcer(interval_variables, payload, model)
    enforcer.enforce_scheduling_rules(courses)
    course_presences = enforcer.course_presences

    commute_times = payload["goals"]["commute times"]
    solve_scheduling_goals(intervals_by_day, course_presences, commute_times, model)
    status = solver.solve(model)

    del intervals_by_day
    
    all_best_courses = get_best_classes(courses, status, interval_variables,
                                        model, solver)
    del interval_variables

    return all_best_courses

