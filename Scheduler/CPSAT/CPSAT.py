from typing import Any
from ortools.sat.python import cp_model
from Scheduler.lib.Data_types.Course import Course
from Scheduler.CPSAT.Make_CPSAT_variables import CPSAT_variable_maker
from Scheduler.CPSAT.Add_CPSAT_constraints import Constraint_adder
from Scheduler.CPSAT.Solve_CPSAT_objectives import Solve_best_schedule
from Scheduler.CPSAT.Extract_solver_values import Solver_values_extractor

class Schedule_maker:
    def __init__(self, 
                 unavailable_hours: list[str, list[int, int]],
                 courses: list[Course], 
                 commute_times: int =  0):
        
        model = cp_model.CpModel()
        solver = cp_model.CpSolver()

        (start_time_variables, is_present_variables,
         interval_variables, intervals_by_day,
         days_present) = self.__add_courses_to_CPSAT(courses, model)
        
        self.__add_constraints(unavailable_hours, intervals_by_day,
                               days_present, interval_variables,
                               courses, model)
        
        status = self.__solve_for_objectives(intervals_by_day, days_present,
                                             model, solver, commute_times)
        
        del start_time_variables
        del intervals_by_day
        del days_present
        
        self.all_chosen_courses = self.__extract_solver_values(courses, status,
                                                               interval_variables,
                                                               model, solver)
        del interval_variables
        del courses
    

    def __add_courses_to_CPSAT(self, courses: list[Course], model: cp_model
                               ) -> tuple:
        CPSAT_variables = CPSAT_variable_maker(courses, model)
        start_time_variables = CPSAT_variables.start_time_variables
        is_present_variables = CPSAT_variables.is_present_variables
        interval_variables = CPSAT_variables.interval_variables

        intervals_by_day = CPSAT_variables.intervals_by_day
        days_present = CPSAT_variables.days_present
        return (start_time_variables, is_present_variables, interval_variables, 
               intervals_by_day, days_present)
    

    def __add_constraints(self,
                          unavailable_hours: list[str, list[int, int]],
                          intervals_by_day: dict[str, list[Any]],
                          days_present: list[Any],
                          interval_variables: dict[dict[dict[int, Any]]],
                          courses: list[Course],
                          model: cp_model):
        
        Constraint_adder(unavailable_hours, intervals_by_day, days_present, 
                         interval_variables, courses, model)
        return
        

    def __solve_for_objectives(self,
                               intervals_by_day: dict[str, list[Any]],
                               days_present: list[Any],
                               model: cp_model,
                               solver: cp_model,
                               commute_times: int = 0) -> int:
        
        solver.parameters.log_search_progress = True  # Enable logging
        Solve_best_schedule(intervals_by_day, days_present, model, solver, commute_times)
        status = solver.solve(model)
        return status


    def __extract_solver_values(self, 
                                courses: list[Course],
                                status: int,
                                interval_variables: dict[str, dict[str, dict
                                                        [str, dict[int, Any]]]],
                                model: cp_model,
                                solver: cp_model):
        
        Solver_values_extractor_obj = Solver_values_extractor(courses, status,
                                                              interval_variables,
                                                              model, solver)
        all_chosen_courses = Solver_values_extractor_obj.all_chosen_courses
        return all_chosen_courses

