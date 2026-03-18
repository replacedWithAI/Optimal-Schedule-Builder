from typing import Any
from Data_types.Course import Course
from Data_types.Sections import Section
from Data_types.Lecture import Lecture
from ortools.sat.python import cp_model
from Make_CPSAT_variable_functions.Make_start_time_variables import 

class CPSAT_variable_maker: # I am so sorry, there's so much nesting. Hopefully you learnt HTML?
    def __create_interval_variables(self, start_time_variables, is_present_variables):
        return

    def __init__(self, courses):
        self.start_time_variables = self.__create_start_time_variables(courses)
        self.is_present_variables = self.__create_is_present_variables(courses)
        
