from typing import Any
from Data_types.Course import Course
from Data_types.Sections import Section
from Data_types.Lecture import Lecture
from Data_types.Other_class_sessions import Other_class_session
from Convert_time_to_number import time_to_index

class Course_file_extractor:
    def __make_course_obj(self, course_jsons: list[dict[str, Any]]) -> list[Course]:
        courses = []
        
        for course_json in self.course_jsons:
            course_key = course_json.get("key")
            section_json = course_json.get("schedule")
            course_obj = Course( course_key.get("faculty"), course_key.get("dept"), course_key.get("code"), course_key.get("credit"),
                       course_json.get("name"), course_json.get("prereq"), self.__make_section_obj(section_json) ) 
            courses.append(course_obj)

        return courses
    

    def __make_section_obj(self, section_jsons: list[dict[str, Any]]) -> list[Section]:
        Sections = []

        for section_json in section_jsons:
            class_session_jsons = section_json.get("classes")
            section_obj = Section( section_json.get("term"), section_json.get("section"), 
                                   self.__get_section_professor(class_session_jsons), 
                                   self.__make_lecture_obj(class_session_jsons) )
            Sections.append(section_obj)

        return Sections
    

    def __get_section_professor(self, class_session_jsons: list[dict[str, Any]]) -> str:
        lecture_json = class_session_jsons[0] #RHS will be list[dict[str, Any]]
        if (lecture_json.get("professor") is None):
            return ""
        return lecture_json.get("professor")
    
    
    def __make_lecture_obj(self, class_session_jsons: list[dict[str, Any]]) -> list[Lecture]:
        lecture_json = class_session_jsons[0] #RHS will be list[dict[str, Any]]
        lecture_weekdays = []
        lecture_start_times = []
        lecture_durations = []
        lecture_campus = []
        lecture_timeslots = lecture_json.get("timeslot")
        
        for lecture_timeslot in lecture_timeslots:
            lecture_weekdays.append( lecture_timeslot.get("weekday") )
            lecture_start_times.append( time_to_index(lecture_timeslot.get("time")) )
            lecture_durations.append(int( lecture_timeslot.get("duration") ))
            lecture_campus.append( lecture_timeslot.get("campus") )
        
        return Lecture( lecture_json.get("name"), lecture_weekdays, lecture_start_times, lecture_durations,
                        lecture_campus, self.__make_lab_tutorials(class_session_jsons) )
    

    def __make_lab_tutorials(self, class_session_jsons: list[dict[str, Any]]) -> list[Other_class_session]: #feel like name should be less abstract
        Other_class_session = []
        class_session_jsons = class_session_jsons[1:]

        for class_session_json in class_session_jsons:
            class_session_timeslot_jsons = class_session_json.get("timeslot")
            Other_class_session.append( self.__get_class_session_timeslots(class_session_timeslot_jsons) )
        
        return Other_class_session
    
        
    def __get_class_session_timeslots(self, class_session_timeslot_jsons: list[dict[str, Any]]) -> Other_class_session:
        session_names = []
        class_session_weekdays = []
        class_session_start_times = []
        class_session_durations = []

        for class_session_timeslot_json in class_session_timeslot_jsons:
            session_names.append( class_session_timeslot_json.get("name"))
            class_session_weekdays.append( class_session_timeslot_json.get("weekday") )
            class_session_start_times.append( time_to_index(class_session_timeslot_json.get("time")) )
            class_session_durations.append(int( class_session_timeslot_json.get("duration") ))
        
        return Other_class_session(session_names, class_session_weekdays, class_session_start_times, class_session_durations)
    
    
    def get_list_of_courses_data(self) -> Course:
        return self.courses
    
    
    def __init__(self, course_jsons: list[dict[str, Any]]):
        self.course_jsons = course_jsons
        self.courses = self.__make_course_obj(course_jsons)
        del course_jsons




    
