from typing import Any
from ortools.sat.python import cp_model

from lib import Course
from lib import Section
from lib import ClassSession

__all__ = ["make_scheduling_rules"]

class ConstraintEnforcer:
    def __init__(self, interval_variables: dict[dict[dict[int, Any]]], 
                 requested_courses: list[str], max_courses_term: int, model: cp_model):
        self.interval_variables = interval_variables
        self.requested_courses = requested_courses
        self.max_courses_term = max_courses_term
        self.model = model
        self.term1_sections = []
        self.term2_sections = []
        self.course_presences = []


    def enforce_scheduling_rules(self, courses: list[Course]):
        for course in courses:
            self.course_presences.append(course.course_presence)
            self.__add_section_constraints(course.sections, course.course_presence)
            self.__enforce_requested_courses(course)

        self.__enforce_courses_term()
        self.__enforce_no_overlap()


    def __add_section_constraints(self, sections: list[Section], course_presence: Any):
        sections_presences = []

        for section in sections:
            sections_presences.append(section.section_presence)
            self.__add_class_constraints(section.classes, section.section_presence)

            if section.term == [0]: 
                self.term1_sections.append(section.section_presence)
            elif section.term == [1]:
                self.term2_sections.append(section.section_presence)
            elif section.term == [0, 1]:
                self.term1_sections.append(section.section_presence)
                self.term2_sections.append(section.section_presence)

        self.__add_section_per_course_constraint(course_presence, sections_presences)


    def __add_class_constraints(self, classes: list[ClassSession], section_presence: Any):
        chooseable_classes = []

        for curr_class in classes:
            if curr_class.session_presences[0] != section_presence: 
                chooseable_classes.append(curr_class.session_presences[0])

        self.__add_one_lab_tutorial_per_section(section_presence, chooseable_classes)


    def __enforce_requested_courses(self, course: Course):
        if course.course_code in self.requested_courses:
            self.model.add(course.course_presence == 1)


    def __enforce_courses_term(self):
        if self.max_courses_term == 0: exit() # what are you doing bro
        self.model.add(sum(self.term1_sections) <= self.max_courses_term)
        self.model.add(sum(self.term2_sections) <= self.max_courses_term)


    def __add_section_per_course_constraint(self, course_presence: Any, 
                                            sections_available: list[Any]):
        self.model.add(sum(sections_available) == course_presence)

                
    def __add_one_lab_tutorial_per_section(self, section_presence: Any,
                                           chooseable_classes: list[Any]):
        if (chooseable_classes): self.model.add(sum(chooseable_classes) == section_presence)


    def __enforce_no_overlap(self):                    
        intervals = [
            interval
            for sections in self.interval_variables.values()
            for classes in sections.values()
            for session in classes.values()
            for interval in session.values()
        ]
        self.model.add_no_overlap(intervals)

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
            