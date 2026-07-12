from typing import Any
from ortools.sat.python import cp_model
from lib import Course
from CPSAT.variable_maker import make_CPSAT_variables
from CPSAT.make_constraints import make_scheduling_rules
from CPSAT.Solve_CPSAT_objectives import solve_scheduling_goals
from CPSAT.Extract_solver_values import get_best_classes

def find_best_options(courses: list[Course], 
                      commute_times: int =  0):
    
    model = cp_model.CpModel()
    solver = cp_model.CpSolver()

    (interval_variables, intervals_by_day) = make_CPSAT_variables(courses, model)
    
    make_scheduling_rules(interval_variables, courses, model)
    
    solve_scheduling_goals(intervals_by_day, model, commute_times)
    status = solver.solve(model)
    
    del intervals_by_day
    
    all_best_courses = get_best_classes(courses, status, interval_variables,
                                        model, solver)
    del interval_variables

    return all_best_courses

