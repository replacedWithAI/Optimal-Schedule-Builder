from ortools.sat.python import cp_model

from typing import Any
from lib import Course
from lib import Section
from lib import ClassSession

__all__ = ["get_best_classes"]

def get_best_classes(courses: list[Course], 
                     status: int, 
                     interval_variables: dict[dict[dict[int, Any]]],
                     model: cp_model, 
                     solver: cp_model):
    
    _get_solver_status(status, model, solver)
    del status
    return _get_chosen_courses(courses, interval_variables, solver)


def _get_solver_status(status: int, model: cp_model, solver: cp_model): 
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return
    else: 
        print("No possible solution")
        exit()


def _get_chosen_courses(courses: list[Course], 
                        interval_variables: dict[dict[dict[int, Any]]],
                        solver: cp_model):
    all_chosen_courses = []

    for course in courses: # needs to change if gonna toggle courses
        
        course_code = course.course_code
        
        # print(interval_variables[course_code])
        curr_course_classes = _get_chosen_sections_classes(course_code,
                                                            course.sections,
                                                            interval_variables[course_code], 
                                                            solver)
        all_chosen_courses.append(curr_course_classes)

    return all_chosen_courses


def _get_chosen_sections_classes(course_code: str,
                                 sections: list[Section], 
                                 interval_variables: dict[dict[int, Any]],
                                 solver: cp_model) -> dict:
    
    chosen_classes = []
    for section in sections:

        section_letter = section.section_letter
        classes = section.classes

        section_is_chosen = (solver.value(section.sections_presence) == 1)

        if section_is_chosen:
            
            classes_intervals = interval_variables[section_letter]
            chosen_classes = _get_chosen_classes(classes, 
                                                 classes_intervals,
                                                 section.fixed_classes,
                                                 solver)
            break
    return {f"{course_code} Section {section_letter}": chosen_classes}


def _get_chosen_classes(classes: list[ClassSession],
                        classes_intervals: dict[str, dict[int, Any]],
                        fixed_classes: list[str],
                        solver: cp_model) -> list[Any]:
    chosen_classes = []

    for curr_class in classes:
        class_name = curr_class.activity_name
        chosen_classes_empty = not fixed_classes
        if (fixed_classes): return chosen_classes
        if (class_name not in fixed_classes): continue
            
        class_presence = classes_intervals[class_name][0].presence_literals[0]
        if (solver.value(class_presence) == 1):
        
            chosen_class = {curr_class.activity_name: {"start": [], "end": [], "size": []}}

            for i in range(len(curr_class.start_times)):
                curr_interval = classes_intervals[curr_class.activity_name][i]
                chosen_class[curr_class.activity_name]["start"].append(curr_interval.start_expr())
                chosen_class[curr_class.activity_name]["size"].append(curr_interval.size_expr())
                chosen_class[curr_class.activity_name]["end"].append(curr_interval.end_expr())

            chosen_classes.append(chosen_class)
        fixed_classes.pop(fixed_classes.index(class_name))

    return chosen_classes
