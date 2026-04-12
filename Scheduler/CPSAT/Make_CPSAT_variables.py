from Scheduler.lib.Data_types.Course import Course
from Scheduler.lib.Data_types.Sections import Section
from Scheduler.lib.Data_types.Class_sessions import Class_session
from ortools.sat.python import cp_model
from typing import Any
# might want to put this in lib, but that's for a while later
class CPSAT_variable_maker: # I am so sorry, there's so much nesting. Hopefully you learnt HTML?
    def __init__(self, courses, model):
        start_time_variables = self.__create_start_time_variables(courses)
        is_present_variables = self.__create_is_present_variables(courses, model)
        self.interval_variables = self.__create_interval_variables(start_time_variables,
                                                                   is_present_variables,
                                                                   courses,
                                                                   model)
        
        self.intervals_by_day = self.__group_intervals_by_day(self.interval_variables, courses)
        self.days_present = self.__make_is_present_for_days(model)


    def __create_start_time_variables(self, courses: list[Course]
                                      ) -> dict[str, dict[str, dict[str, dict[int, Any]]]]: 
        start_time_variables = {
            course.course_name: {
                section.section_letter: self.__classes_start_times(section.classes)
                for section in course.sections
            }
            for course in courses
        }
            
        return start_time_variables
    

    def __classes_start_times(self, classes: list[Course]
                              ) -> dict[str, dict[str, dict[str, dict[int, Any]]]]:
        section_start_times = {
            curr_class.activity_name: {
                i: curr_class.global_start_times[i]
                for i in range(len(curr_class.start_times))
            }
            for curr_class in classes
        } 

        return section_start_times
    

    def __create_is_present_variables(self, 
                                      courses: list[Course], 
                                      model: cp_model
                                      ) -> dict[str, dict[str, dict[str, dict[int, Any]]]]:
        is_present_variables = {
            course.course_name: {
                section.section_letter: self.__classes_is_present(section.classes, \
                                                                 (course.department + " "
                                                                  + course.course_code), \
                                                                 section.section_letter, 
                                                                 model)
                for section in course.sections
            }
            for course in courses
        }

        return is_present_variables
    
    
    def __classes_is_present(self, 
                             classes: list[Class_session], 
                             course_name: str, \
                             section_letter: str, 
                             model: cp_model) -> dict[str, dict[int, Any]]:
        
        section_is_present = model.new_bool_var(f"{course_name}_section_" + \
                                                f"{section_letter}_" + \
                                                f"taken")
        section_presence = {}
        num_each_section_class_type = self.__get_num_section_classes_by_type(classes)

        for i in range(len(classes)):
            curr_class = classes[i]
            curr_class_presence = {curr_class.activity_name: {}}

            space_index = curr_class.activity_name.find(' ')
            curr_class_type = curr_class.activity_name[:space_index]
            num_curr_class_type = num_each_section_class_type[curr_class_type]

            if num_curr_class_type == 1:
                CPSAT_bool = section_is_present
            else:
                CPSAT_bool = model.new_bool_var(f"{course_name}_section_" + \
                                                f"{section_letter}_" + \
                                                f"{curr_class.activity_name}" + \
                                                f"_taken")
            
            for j in range(len(curr_class.start_times)):
                curr_class_presence[curr_class.activity_name][j] = CPSAT_bool
            section_presence.update(curr_class_presence)

        return section_presence
    

    def __get_num_section_classes_by_type(self,
                                            classes: list[Class_session]
                                            ) -> list[str]:
        section_classes = {}
        for curr_class in classes:
            
            space_index = curr_class.activity_name.find(" ")
            curr_class_type = curr_class.activity_name[:space_index] # lect, blen, tutr...
            section_classes.setdefault(curr_class_type, 0)
            section_classes[curr_class_type] += 1

        #print(f"section classes: {section_classes}")
        return section_classes


    def __create_interval_variables(self,
                                    start_time_variables: dict[str, dict[str, dict
                                                              [str, dict[int, Any]]]],
                                    is_present_variables: dict[str, dict[str, dict
                                                              [str, dict[int, Any]]]],
                                    courses: list[Course],
                                    model: cp_model
                                    ) -> dict[str, dict[str, dict[str, dict[int, Any]]]]:
        
        interval_variables = {
            course.course_name: {
                section.section_letter: self.__classes_intervals
                                        ( \
                                            start_time_variables[course.course_name]
                                                                [section.section_letter], \
                                            is_present_variables[course.course_name]
                                                                [section.section_letter],\
                                            (course.department + " " + course.course_code),\
                                            section.section_letter, \
                                            section.classes, \
                                            model
                                        )

                for section in course.sections
            }
            for course in courses
        }

        return interval_variables


    def __classes_intervals(self, 
                            start_time_variables: list[Any], 
                            is_present_variables: list[Any], 
                            course_name:str, 
                            section_letter:str, 
                            classes: list[Class_session], 
                            model: cp_model
                            ) ->  dict[str, dict[int, Any]]:
        
        curr_interval = {
            curr_class.activity_name: {
                i: model.new_optional_fixed_size_interval_var(
                            start = start_time_variables[curr_class.activity_name][i], \
                            size = curr_class.duration[i], \
                            is_present = is_present_variables[curr_class.activity_name][i], \
                            name = f"{course_name}_section_{section_letter}_" \
                                 + f"{curr_class.activity_name}" \
                            )
                for i in range(len(curr_class.start_times))
            }
            for curr_class in classes
        }
        
        return curr_interval
    

    def __group_intervals_by_day(self,
                                 interval_variables: dict[dict[dict[int, Any]]],
                                 courses: list[Course]
                                 ) -> list[dict[str, list]]:
                
        intervals_by_days = {"Mon1": [], "Tue1": [], "Wed1": [], "Thu1": [], "Fri1": [],
                             "Mon2": [], "Tue2": [], "Wed2": [], "Thu2": [], "Fri2": []}
        
        for course in courses:
            for section in course.sections:
                for curr_class in section.classes:
                    for i in range(len(interval_variables[course.course_name]
                                                        [section.section_letter]
                                                        [curr_class.activity_name])):
                        
                        days_key = self.__get_curr_day(curr_class.start_times[i][1])
                        days_key += self.__get_current_term(curr_class.start_times[i][2])
                        intervals_by_days [days_key].append(interval_variables[course.course_name]
                                                                [section.section_letter]
                                                                [curr_class.activity_name]
                                                                [i])
        #print(intervals_by_days)
        return intervals_by_days 


    def __get_curr_day(self, day: int) -> str:
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


    def __get_current_term(self, term: int) -> str:
        if (term == 0):
            return "1"
        elif (term == 1):
            return "2"
        else:
            print("Current day is unreadable: " + str(term))
            return "1"
        
    def __make_is_present_for_days(self, model: cp_model):
        days_present = []

        for d in range(10):
            days_present.append(model.new_bool_var(f"day_{d}_used"))
        return days_present
            