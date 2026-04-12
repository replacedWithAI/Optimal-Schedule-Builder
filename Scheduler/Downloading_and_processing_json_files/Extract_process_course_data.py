from typing import Any
from Scheduler.lib.Data_types.Course import Course
from Scheduler.lib.Data_types.Sections import Section
from Scheduler.lib.Data_types.Class_sessions import Class_session
from Scheduler.lib.Convert_time_to_number import start_time_in_minutes
from Scheduler.lib.Convert_time_to_number import time_in_ten_days_minutes
from Scheduler.lib.Convert_time_to_number import terms_in_this_section
from Scheduler.lib.Convert_time_to_number import convert_day_into_number


class Course_file_extractor:
    def __make_course_obj(self, course_jsons: list[dict[str, Any]]) -> list[Course]:
        courses = []
        
        for course_json in self.course_jsons:
            course_key = course_json.get("key")
            section_json = course_json.get("schedule")
            course_obj = Course( course_key.get("faculty"), course_key.get \
                                ("dept"), course_key.get("code"), \
                                course_key.get("credit"), \
                                course_json.get("name"), \
                                course_json.get("prereq"), \
                                self.__make_section_obj(section_json) ) 
            courses.append(course_obj)

        return courses
    

    def __make_section_obj(self, section_jsons: list[dict[str, Any]]) -> list[Section]:
        Sections = []

        for section_json in section_jsons:

            class_session_jsons = section_json.get("classes")
            term = terms_in_this_section( section_json.get("term") )
            section_classes = self.__make_class_obj(class_session_jsons, term)

            if (len(section_classes) == 0):
                continue

            section_obj = Section( term, \
                                   section_json.get("section"), \
                                   self.__get_section_professor(class_session_jsons), \
                                   section_classes )
            Sections.append(section_obj)

        return Sections
    

    def __get_section_professor(self, class_session_jsons: list[dict[str, Any]]) -> str:
        lecture_json = class_session_jsons[0] #RHS will be list[dict[str, Any]]
        if (lecture_json.get("professor") is None):
            return ""
        return lecture_json.get("professor")
    

    def __make_class_obj(self, \
                         class_session_jsons: list[dict[str, Any]], \
                         term: list[int])-> list[Class_session]: #feel like name should be less abstract
        list_class_sessions = []

        # each class session has its list of timeslots
        for class_session_json in class_session_jsons:
            session_name = class_session_json.get("name")
            if ("99") in session_name: # no one likes lab 99. Im sorry
                continue

            class_session_timeslot_jsons = class_session_json.get("timeslot")
            curr_class_type = self.__make_class_sessions( session_name, \
                                                          class_session_timeslot_jsons, \
                                                          term) #LECT, LAB, etc
            
            if (curr_class_type.global_start_times == []): # never starts; meh method
                continue
            
            list_class_sessions.append( curr_class_type )
        
        return list_class_sessions
    
        
    def __make_class_sessions(self, 
                              session_name: str, \
                              class_session_timeslot_jsons: list[dict[str, Any]],\
                              term: list[int]) -> Class_session:
        start_times = []
        global_start_times = []
        durations = []
        global_end_times = []
        campus = []
        for curr_term in term:
            for class_session_timeslot_json in class_session_timeslot_jsons:

                time = class_session_timeslot_json.get("time")
                # print(time)
                if (time == ""):
                    continue
                
                start_times.append( start_time_in_minutes(  time, \
                                                            class_session_timeslot_json.get("weekday"), \
                                                            curr_term) )
                
                global_start_times.append( time_in_ten_days_minutes(start_times[-1][0],
                                                                    start_times[-1][1],
                                                                    curr_term) )
                
                durations.append(int( class_session_timeslot_json.get("duration") ))

                global_end_times.append( global_start_times[-1] + durations[-1] )

                campus.append( class_session_timeslot_json.get("campus") )  

        return Class_session(session_name, start_times, global_start_times,
                             durations, global_end_times, campus)
    
    
    def get_list_of_courses_data(self) -> Course:
        return self.courses
    
    
    def __init__(self, course_jsons: list[dict[str, Any]]):
        self.course_jsons = course_jsons
        self.courses = self.__make_course_obj(course_jsons)
        del course_jsons