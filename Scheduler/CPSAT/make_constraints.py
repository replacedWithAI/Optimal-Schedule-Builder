from typing import Any
from ortools.sat.python import cp_model

from lib import Course
from lib import ClassSession

__all__ = ["make_scheduling_rules"]

def make_scheduling_rules(interval_variables: dict[dict[dict[int, Any]]], 
                            courses: list[Course], 
                            model: cp_model):
    _add_no_overlap_constraint(interval_variables, courses, model)
    _add_section_per_course_constraint(interval_variables, courses, model)


def _add_section_per_course_constraint(interval_variables: dict[str, Any], 
                                        courses: list[Course], 
                                        model: cp_model):
    for course in courses:
        course_code = course.course_code
        sections_available = []

        for section in course.sections:

            section_letter = section.section_letter
            classes = section.classes

            curr_section_presence = section.sections_presence
            sections_available.append(curr_section_presence)
            
            _add_one_lab_tutorial_per_section(interval_variables,
                                                curr_section_presence, 
                                                course_code, 
                                                section_letter, 
                                                classes, 
                                                model)
                                                    
        #print(sections_available)
        model.add(sum(sections_available) == 1)
    return
            
    
def _add_one_lab_tutorial_per_section(interval_variables: dict[str, Any], 
                                        curr_section_presence: Any, 
                                        course_code: str, 
                                        section_letter: str, 
                                        classes: list[ClassSession], 
                                        model: cp_model):
    chooseable_classes = []

    for curr_class in classes:
        
        curr_class_name = curr_class.activity_name
        session_interval = interval_variables[course_code] \
                                            [section_letter] \
                                            [curr_class_name] \
                                            [0]
        session_presence = session_interval.presence_literals()[0]
            
        is_chooseable_class = (session_presence != curr_section_presence)
        if (is_chooseable_class):
            chooseable_classes.append(session_presence)

        # print(chooseable_classes)
    if (chooseable_classes): model.add(sum(chooseable_classes) == curr_section_presence)


def _add_no_overlap_constraint(interval_variables: dict[str, Any], 
                                courses: list[Course], 
                                model: cp_model):
    intervals = [] # yes. your ram is crying. I know
    
    for course in courses: # yeah I know. We iterate through everything
        for section in course.sections:
            for curr_class in section.classes:
                for i in range(len(curr_class.start_times)):
                    curr_interval = interval_variables[course.course_code] \
                                                        [section.section_letter] \
                                                        [curr_class.activity_name] \
                                                        [i]
                    intervals.append(curr_interval)
                    
    model.add_no_overlap(intervals)
    return # lets never do that again


'''
Originally made this for a "minimze school days schedule", but I can do that with
commute_times = 676767676767676767676767
def __track_used_days(
                        days_present: list[Any], 
                        intervals_by_days: dict[str, list[Any]],
                        model: cp_model):
    curr_day = -1

    for intervals in intervals_by_days.values():
        curr_day += 1
        if intervals == []:
            continue

        curr_day_intervals = []

        for interval in intervals:
            interval_is_present = interval.presence_literals()[0]
            curr_day_intervals.append(interval_is_present)
        model.add_max_equality(days_present[curr_day], curr_day_intervals)

    return
'''
            