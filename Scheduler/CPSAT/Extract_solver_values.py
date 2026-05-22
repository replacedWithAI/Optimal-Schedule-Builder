from ortools.sat.python import cp_model
from typing import Any
from Scheduler.lib.Data_types.Course import Course
from Scheduler.lib.Data_types.Sections import Section
from Scheduler.lib.Data_types.Class_sessions import Class_session

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
            # print(course_name)
            # print(interval_variables[course_name])
            curr_chosen_classes = self.__get_chosen_sections_classes(course.sections,
                                                                     course.sections_presence, 
                                                                     interval_variables[course_name], 
                                                                     solver)
            all_chosen_courses.append(curr_chosen_classes)

        return all_chosen_courses
    
    
    def __get_chosen_sections_classes(self, 
                                     sections: list[Section], 
                                     sections_presence: list[Any],
                                     interval_variables: dict[dict[int, Any]],
                                     solver: cp_model) -> list[Any]:
        for i in range(len(sections)):

            section_letter = sections[i].section_letter
            classes = sections[i].classes

            section_is_chosen = (solver.value(sections_presence[i]) == 1)

            chosen_classes = []
            if section_is_chosen:
                # print(section_letter)
                
                classes_intervals = interval_variables[section_letter]
                chosen_classes = self.__get_chosen_classes(classes, 
                                                           classes_intervals,
                                                           solver)
                break
        return chosen_classes


    def __get_chosen_classes(self, 
                             classes: list[Class_session],
                             classes_intervals: dict[str, dict[int, Any]],
                             solver: cp_model) -> list[Any]:
        chosen_classes = []

        for curr_class in classes:
            class_is_present = classes_intervals[curr_class.activity_name][0] \
                                                        .presence_literals()[0]

            is_chosen_class = solver.value(class_is_present) == 1
            # print(is_chosen_class)
            if is_chosen_class:

                for i in range(len(curr_class.start_times)):
                    chosen_classes.append(classes_intervals[curr_class.activity_name]
                                                           [i])

        return chosen_classes
