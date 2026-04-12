from Scheduler.lib.Data_types.Course import Course
from Scheduler.lib.Data_types.Class_sessions import Class_session
from typing import Any
from ortools.sat.python import cp_model

class Constraint_adder:
    def __init__(self,
                 unavailable_hours: list[str, list[int, int]],
                 intervals_by_day: dict[str, list[Any]],
                 days_present: list[Any],
                 interval_variables: dict[dict[dict[int, Any]]], 
                 courses: list[Course], 
                 model: cp_model):
        
        self.__add_no_overlap_constraint(interval_variables, courses, model)
        self.__add_section_per_course_constraint(interval_variables, courses, model)
        self.__add_unavailable_hours_constraint(unavailable_hours, intervals_by_day, model)
        self.__track_used_days(days_present, intervals_by_day, model)

    def __add_section_per_course_constraint(self, 
                                            interval_variables: dict[str, dict[str, dict
                                                                    [str, dict[int, Any]]]], 
                                            courses: list[Course], 
                                            model: cp_model):
        for course in courses:
            course_name = course.course_name
            sections_available = []

            for section in course.sections:

                section_letter = section.section_letter
                classes = section.classes
 
                for curr_class in classes:
                    curr_class_is_present_var = interval_variables[course_name] \
                                                                  [section_letter] \
                                                                  [curr_class.activity_name] \
                                                                  [0].presence_literals()[0]
                    
                    is_present_var_name = curr_class_is_present_var.Name()
                    fixed_to_section_class = (f"{section_letter}_taken" in 
                                              is_present_var_name)
                    
                    if fixed_to_section_class:
                        section_is_present_var = curr_class_is_present_var
                        break

                sections_available.append(section_is_present_var)
                
                self.__add_one_lab_tutorial_per_section(interval_variables,
                                                        section_is_present_var, 
                                                        course_name, 
                                                        section_letter, 
                                                        classes, 
                                                        model)
                                                        
            #print(sections_available)
            model.add(sum(sections_available) == 1)
        return
                
        
    def __add_one_lab_tutorial_per_section(self,
                                           interval_variables: dict[str, dict[str, dict
                                                                   [str, dict[int, Any]]]], 
                                           curr_section_presence: Any, 
                                           course_name: str, 
                                           section_letter: str, 
                                           classes: list[Class_session], 
                                           model: cp_model):
        chooseable_classes = [[]]
        unique_chooseable_class_idx = 0 # suppose can choose from 5 labs, 3 tutorials
        prev_unique_chooseable_class_type = ""

        for i in range(len(classes)):
            
            curr_class_name = classes[i].activity_name
            curr_class_interval = interval_variables[course_name] \
                                           [section_letter] \
                                           [curr_class_name] \
                                           [0]
            curr_is_present_variable = curr_class_interval.presence_literals()[0]
                
            is_chooseable_class = (curr_section_presence != curr_is_present_variable)
            if (is_chooseable_class):
                chooseable_classes[unique_chooseable_class_idx].append(
                                                    curr_is_present_variable)
                
                space_index =  curr_class_name.find(' ')
                curr_class_type = curr_class_name[:space_index]
                prev_unique_chooseable_class_type = curr_class_type
                
                curr_chooseable_class_type_is_unique = (curr_class_type != 
                                                   prev_unique_chooseable_class_type)
                if (curr_chooseable_class_type_is_unique):
                    unique_chooseable_class_idx += 1
                    chooseable_classes.append([])

        print(chooseable_classes)
        for unique_chooseable_class in chooseable_classes:
            if unique_chooseable_class != []:
                model.add(sum(unique_chooseable_class) == curr_section_presence)
        return
    

    def __add_no_overlap_constraint(self, 
                                    interval_variables: dict[str, dict[str, dict
                                                            [str, dict[int, Any]]]], 
                                    courses: list[Course], 
                                    model: cp_model):
        list_of_intervals = [] # yes. your ram is crying. I know
        
        for course in courses: # bro wth is this? yeah I know. We iterate through everything
            for section in course.sections:
                for curr_class in section.classes:
                    for i in range(len(curr_class.start_times)):
                        curr_interval = interval_variables[course.course_name] \
                                                          [section.section_letter] \
                                                          [curr_class.activity_name] \
                                                          [i]
                        list_of_intervals.append(curr_interval)
                        
        model.add_no_overlap(list_of_intervals)
        return # lets never do that again
    

    def __add_unavailable_hours_constraint(self,
                                           unavailable_hours: list[str, list[int, int]],
                                           intervals_by_days: dict[Any],
                                           model: cp_model
                                           ):


        for interval in intervals_by_days[unavailable_hours[0]]: # will need clean up
            unavailable_start = unavailable_hours[1][0]
            unavailable_end = unavailable_hours[1][1]

            interval_in_unavailable_time = (interval.start_expr() >= unavailable_start) \
                                            and (interval.start_expr() + interval.size_expr() \
                                            <= unavailable_end)
            if (interval_in_unavailable_time):
                model.add_bool_and(interval.presence_literals[0]) # set bool = 0
        return


    def __track_used_days(self, 
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
        
                