from ortools.sat.python import cp_model

from typing import Any
from lib import Course
from lib import Section
from lib import ClassSession

class Solver_values_extractor:
    def __init__(self, 
                 courses: list[Course], 
                 status: int, 
                 interval_variables: dict[dict[dict[int, Any]]],
                 model: cp_model, 
                 solver: cp_model):
        
        self.__get_solver_status(status, model, solver)
        self.all_chosen_courses = self.__get_chosen_courses(courses, interval_variables, 
                                                            solver)


    def __get_solver_status(self, status: int, model: cp_model, solver: cp_model): 
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return
        else: 
            print("No decent solution")
            exit()


    def __get_chosen_courses(self, 
                             courses: list[Course], 
                             interval_variables: dict[dict[dict[int, Any]]],
                             solver: cp_model):
        all_chosen_courses = []

        for course in courses: # needs to change if gonna toggle courses
            
            course_name = course.course_name
            course_code = course.department + ' ' + course.course_code
            
            # print(interval_variables[course_name])
            curr_course_classes = self.__get_chosen_sections_classes(
                                                                     course_code,
                                                                     course.sections,
                                                                     course.sections_presence, 
                                                                     interval_variables[course_name], 
                                                                     solver)
            all_chosen_courses.append(curr_course_classes)

        return all_chosen_courses
    
    
    def __get_chosen_sections_classes(self, 
                                     course_code: str,
                                     sections: list[Section], 
                                     sections_presence: list[Any],
                                     interval_variables: dict[dict[int, Any]],
                                     solver: cp_model) -> dict:
        
        chosen_classes = []
        for i in range(len(sections)):

            section_letter = sections[i].section_letter
            classes = sections[i].classes

            section_is_chosen = (solver.value(sections_presence[i]) == 1)

            if section_is_chosen:
                # print(section_letter)
                
                classes_intervals = interval_variables[section_letter]
                chosen_classes = self.__get_chosen_classes(classes, 
                                                           classes_intervals,
                                                           solver)
                break
        return {(course_code + ' ' + "Section " + section_letter): chosen_classes}


    def __get_chosen_classes(self, 
                             classes: list[ClassSession],
                             classes_intervals: dict[str, dict[int, Any]],
                             solver: cp_model) -> list[Any]:
        chosen_classes = []

        for curr_class in classes:
            class_is_present = classes_intervals[curr_class.activity_name][0] \
                                                        .presence_literals()[0]

            is_chosen_class = solver.value(class_is_present) == 1
            # print(is_chosen_class)
            if is_chosen_class:
                
                chosen_class = {curr_class.activity_name: {"start": [], "end": [], "size": []}}

                for i in range(len(curr_class.start_times)):
                    curr_interval = classes_intervals[curr_class.activity_name][i]
                    chosen_class[curr_class.activity_name]["start"].append(curr_interval.start_expr())
                    chosen_class[curr_class.activity_name]["size"].append(curr_interval.size_expr())
                    chosen_class[curr_class.activity_name]["end"].append(curr_interval.end_expr())

                chosen_classes.append(chosen_class)

        return chosen_classes
