from Data_types.Course import Course
from Data_types.Lecture import Lecture
from typing import Any
from ortools.sat.python import cp_model

class Start_time_variable_maker:
    def __init__(self, courses):
        self.start_time_variables = self.__create_start_time_variables(courses)


    def __create_start_time_variables(self, courses: list[Course]) -> dict[
                                                     dict[dict[dict, Any]]]:        
        start_time_variables = {
            course: {
                section: self.__classes_start_times(section.lectures, 
                                                    (course.department + " " 
                                                     + course.course_code), 
                                                    section.section_letter)
                for section in course.sections
            }
            for course in courses
        }
            
        return start_time_variables
    

    def __classes_start_times(self, lecture: Lecture, course_name: str, 
                              section_letter: str) -> list[Any]:
        model = cp_model.CpModel
        classes = []

        curr_class_start_time_variable = model.new_int_var_from_domain(
            cp_model.Domain_from_intervals(lecture.start_times),
            f"start_lecture_from_{course_name}_section_{section_letter}"
        )
        classes.append(curr_class_start_time_variable)

        for other_class in lecture.other_class_sessions:

            curr_class_start_time_variable = model.new_int_var_from_domain(
                    cp_model.Domain_from_intervals(other_class.start_times),
                    f"start_{other_class.activity_name}_from_" +
                    f"{course_name}_section_{section_letter}"
                )
            classes.append(curr_class_start_time_variable)

        return classes
