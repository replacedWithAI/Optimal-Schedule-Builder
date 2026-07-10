from typing import Any

from lib import Course
from lib import Section
from lib import ClassSession

from gettingcourses.check_conditions import ConditionChecker

__all__ = ["make_courses"]

def make_courses(course_jsons: list[dict[str, Any]], 
                  personal_times: dict = {}) -> list[Course]:
    courses = []
    validator = ConditionChecker(personal_times)
    
    for course_json in course_jsons:
        course_key = course_json.get("key")
        section_json = course_json.get("schedule")
        course = Course(faculty = course_key.get("faculty"), 
                        department = course_key.get ("dept"), 
                        course_number = course_key.get("code"), 
                        course_code = 
                        f"{course_json.get("dept")} {course_key.get("code")}", 
                        credits = course_key.get("credit"), 
                        course_name = course_json.get("name"),
                        prerequisites = course_json.get("prereq"), 
                        sections = _make_sections(section_json, validator), 
                        sections_presence = []) 
        courses.append(course)
    course_json = None

    return courses


def _make_sections(section_jsons: list[dict[str, Any]], 
                   validator: ConditionChecker) -> list[Section]:
    Sections = []

    for section_json in section_jsons:

        class_jsons = section_json.get("classes")

        term = _terms_in_this_section(section_json.get("term"))
        if (validator.is_usual_term(term)): continue

        section_classes = _make_classes(class_jsons, term, validator)
        if (validator.has_no_classes(section_classes)): continue

        section_obj = Section(term = term,
                              section_letter = section_json.get("section"),
                              professor = _get_section_professor(class_jsons),
                              classes = section_classes)
        Sections.append(section_obj)

    return Sections


def _get_section_professor(class_session_jsons: list[dict[str, Any]]) -> str:
    lecture_json = class_session_jsons[0] # WIP
    if (lecture_json.get("professor") is None):
        return ""
    return lecture_json.get("professor")


def _make_classes(class_jsons: list[dict[str, Any]],
                term: list[int],
                validator: ConditionChecker)-> list[ClassSession]: 
    list_class_sessions = []
    
    # each class session has its list of timeslots
    for class_json in class_jsons:
        session_name = class_json.get("name")
        if (validator.is_lab_99(session_name)): continue # no one likes lab 99. Im sorry 

        class_session_jsons = class_json.get("timeslot")
        curr_class = _make_class_sessions(session_name, class_session_jsons, 
                                          term, validator) #LECT, LAB, etc
        
        if (validator.no_sessions_start(curr_class.global_start_times)): continue
        
        list_class_sessions.append(curr_class)
    
    return list_class_sessions

    
def _make_class_sessions(session_name: str, \
                         class_session_jsons: list[dict[str, Any]],\
                         term: list[int],
                         validator: ConditionChecker) -> ClassSession:
    start_times = []
    global_start_times = []
    durations = []
    global_end_times = []
    campus = []

    for curr_term in term:
        for class_session_json in class_session_jsons:

            time = class_session_json.get("time")
            # print(time)
            if (validator.session_doesnt_start(time)): continue
            
            start_times.append(_start_time_in_minutes(time, \
                                                      class_session_json.get("weekday"),
                                                      curr_term))
            
            durations.append(int( class_session_json.get("duration") ))

            if (validator.outside_personal_times([start_times[-1], 
                                                start_times[-1][0] + durations[-1],
                                                ])): continue
            
            global_start_times.append(_time_in_ten_days_minutes(start_times[-1][0],
                                                                start_times[-1][1],
                                                                curr_term) )

            global_end_times.append( global_start_times[-1] + durations[-1] )

            campus.append( class_session_json.get("campus") )  

    return ClassSession(session_name, start_times, global_start_times,
                            durations, global_end_times, campus)

 # time reletive to the num minutes in a day
def _start_time_in_minutes(start_time: str, weekday: str, curr_term: int) -> list[int]:
    if (len(start_time) == 5):
        hour = int(start_time[:2])
        minutes = int(start_time[3:])
    elif (len(start_time) == 4):
        hour = int(start_time[:1])
        minutes = int(start_time[2:])
    else: 
        print("Start time is wrong: " + start_time)
        hour = 0
        minutes = 0

    start_time = hour*60 + minutes # max: 1440
    weekday_number = _convert_day_into_number(weekday)
    return [start_time, weekday_number, curr_term]


def _convert_day_into_number(weekday: str) -> int:
    if weekday == "M":
        return 0
    elif weekday == "T":
        return 1
    elif weekday == "W":
        return 2
    elif weekday == "R":
        return 3
    elif weekday == "F": 
        return 4
    else:
        print(f"Day isn't any of these: {str(weekday)}")
        return 0


def _time_in_ten_days_minutes(time: int, day: int, curr_term: int) -> int:
    # print(curr_term)
    # print(day)
    # print(time)
    return (curr_term * 7200) + (day * 1440) + time # max 14400


def _terms_in_this_section(term: str) -> list[int]: # ok I'm not hardcoding all this
    # print(term)
    if "L" in term or term == "FS" or term == "WS": # bit obsolete; see check_cond
        # print("Special term; block model, WL, or L1/L2")
        return [0]
    elif ("W" in term) or term == "S2" or term == "B1" or term == "B4":
        return [1]
    elif term == "Y" or term == "SU" or term == "FW" or term == "B3":
        return [0, 1]
    elif ("F" in term) or term == "S1"  or term == "B2":
        return [0]
    else:
        # print("No considered term")
        return [0]