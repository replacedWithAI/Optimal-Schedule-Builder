
from ortools.sat.python import cp_model
from typing import Any

from lib import Course
from lib import Section
from lib import ClassSession

__all__ = ["make_CPSAT_variables"]


# I am so sorry, there's so much nesting. Hopefully you learnt HTML?
def make_CPSAT_variables(courses, model) -> tuple:
    start_time_variables = _create_start_time_variables(courses)
    is_present_variables = _create_is_present_variables(courses, model)
    interval_variables = _create_interval_variables(start_time_variables,
                                                    is_present_variables,
                                                    courses,
                                                    model)
    del start_time_variables
    del is_present_variables
    
    intervals_by_day = _group_intervals_by_day(interval_variables, courses)

    return (interval_variables, intervals_by_day)


def _create_start_time_variables(courses: list[Course]) -> dict[str, Any]: 
    start_time_variables = {
        course.course_code: {
            section.section_letter: _classes_start_times(section.classes)
            for section in course.sections
        }
        for course in courses
    }
        
    return start_time_variables


def _classes_start_times(classes: list[Course]) -> dict[str, Any]:

    section_start_times = {
        curr_class.activity_name: {
            i: curr_class.global_start_times[i]
            for i in range(len(curr_class.start_times))
        }
        for curr_class in classes
    } 

    return section_start_times


def _create_is_present_variables(courses: list[Course], 
                                model: cp_model) -> dict[str, Any]:
    is_present_variables = {
        course.course_code: {
            section.section_letter: _classes_is_present(section,
                                                        course.course_code,
                                                        section.section_letter, 
                                                        model)
            for section in course.sections
        }
        for course in courses
    }

    return is_present_variables


def _classes_is_present(section: Section, 
                        course_code: str, \
                        section_letter: str, 
                        model: cp_model) -> dict[str, Any]:
    
    section.sections_presence = model.new_bool_var(f"{course_code}_section_" + \
                                                    f"{section_letter}_" + \
                                                    f"taken")
    classes = section.classes
    classes_presence = {}

    for i in range(len(classes)):
        curr_class = classes[i]
        curr_class_presence = {curr_class.activity_name: {}}

        space_index = curr_class.activity_name.find(' ')
        class_type = curr_class.activity_name[:space_index]

        if class_type in section.fixed_classes:
            CPSAT_bool = section.sections_presence
        else:
            CPSAT_bool = model.new_bool_var(f"{course_code}_section_" + \
                                            f"{section_letter}_" + \
                                            f"{curr_class.activity_name}" + \
                                            f"_taken")
        
        for j in range(len(curr_class.start_times)):
            curr_class_presence[curr_class.activity_name][j] = CPSAT_bool
        classes_presence.update(curr_class_presence)

    return classes_presence


def _create_interval_variables(start_time_variables: dict[str, Any],
                                is_present_variables: dict[str, Any],
                                courses: list[Course],
                                model: cp_model) -> dict[str, Any]:
    
    interval_variables = {
        course.course_code: {
            section.section_letter: _classes_intervals
                                    (start_time_variables[course.course_code]
                                                         [section.section_letter], 
                                    is_present_variables[course.course_code]
                                                        [section.section_letter],
                                    course.course_code,
                                    section.section_letter,
                                    section.classes,
                                    model)

            for section in course.sections
        }
        for course in courses
    }

    return interval_variables


def _classes_intervals(start_time_variables: list[Any], 
                        is_present_variables: list[Any], 
                        course_code: str, 
                        section_letter:str, 
                        classes: list[ClassSession], 
                        model: cp_model
                        ) ->  dict[str, dict[int, Any]]:
    
    curr_interval = {
        curr_class.activity_name: {
            i: model.new_optional_fixed_size_interval_var(
                        start = start_time_variables[curr_class.activity_name][i], \
                        size = curr_class.duration[i], \
                        is_present = is_present_variables[curr_class.activity_name][i], \
                        name = f"{course_code}_section_{section_letter}_" \
                                + f"{curr_class.activity_name}" \
                        )
            for i in range(len(curr_class.start_times))
        }
        for curr_class in classes
    }
    
    return curr_interval


def _group_intervals_by_day(interval_variables: dict[str, Any],
                            courses: list[Course]) -> list[dict[str, list]]:
            
    intervals_by_days = {"Mon1": [], "Tue1": [], "Wed1": [], "Thu1": [], "Fri1": [],
                        "Mon2": [], "Tue2": [], "Wed2": [], "Thu2": [], "Fri2": []}
    
    for course in courses:
        for section in course.sections:
            for curr_class in section.classes:
                for i in range(len(interval_variables[course.course_code]
                                                    [section.section_letter]
                                                    [curr_class.activity_name])):
                    
                    days_key = _get_curr_day(curr_class.start_times[i][1])
                    days_key += _get_current_term(curr_class.start_times[i][2])
                    intervals_by_days[days_key].append(interval_variables[course.course_code]
                                                            [section.section_letter]
                                                            [curr_class.activity_name]
                                                            [i])
    #print(intervals_by_days)
    return intervals_by_days 


def _get_curr_day(day: int) -> str:
    if (day == 0):
        return "Mon"
    elif (day == 1):
        return "Tue"
    elif (day == 2):
        return "Wed"
    elif (day == 3):
        return "Thu"
    elif (day == 4):
        return "Fri"
    else:
        print("Current day is unreadable: " + str(day))
        return "Mon"


def _get_current_term(term: int) -> str:
    if (term == 0):
        return "1"
    elif (term == 1):
        return "2"
    else:
        print("Current day is unreadable: " + str(term))
        return "1"
    
def __make_is_present_for_days(model: cp_model):
    days_present = []

    for d in range(10):
        days_present.append(model.new_bool_var(f"day_{d}_used"))
    return days_present
        