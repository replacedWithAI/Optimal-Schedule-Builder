from typing import Any

from Scheduler.lib import Course
from Scheduler.lib import Section
from Scheduler.lib import ClassSession

__all__ = ["validate_class_sessions"]

def validate_class_sessions(course_jsons: list[dict[str, Any]]):
    courses = _make_courses(course_jsons)
    return courses

def _make_courses(course_jsons: list[dict[str, Any]]) -> list[Course]:
    courses = []
    
    for course_json in course_jsons:
        course_key = course_json.get("key")
        section_json = course_json.get("schedule")
        course = Course(faculty = course_key.get("faculty"), 
                            department = course_key.get ("dept"), 
                            course_number = course_key.get("code"), 
                            course_code = f"{course_json.get("dept")} {course_key.get("code")}", 
                            credits = course_key.get("credit"), 
                            course_name = course_json.get("name"),
                            prerequisites = course_json.get("prereq"), 
                            sections = _make_sections(section_json), 
                            sections_presence = []) 
        courses.append(course)

    return courses


def _make_sections(section_jsons: list[dict[str, Any]]) -> list[Section]:
    Sections = []

    for section_json in section_jsons:

        class_session_jsons = section_json.get("classes")
        term = _terms_in_this_section(section_json.get("term"))
        section_classes = _make_classes(class_session_jsons, term)

        uncommon_section = ('L' in term)
        if (uncommon_section): continue

        if (len(section_classes) == 0): continue

        section_obj = Section( term, \
                                section_letter = section_json.get("section"), \
                                professor = _get_section_professor(class_session_jsons), \
                                classes = section_classes )
        Sections.append(section_obj)

    return Sections


def _get_section_professor(class_session_jsons: list[dict[str, Any]]) -> str:
    lecture_json = class_session_jsons[0] # WIP
    if (lecture_json.get("professor") is None):
        return ""
    return lecture_json.get("professor")


def _make_classes(class_session_jsons: list[dict[str, Any]], \
                    term: list[int])-> list[ClassSession]: #feel like name should be less abstract
    list_class_sessions = []

    # each class session has its list of timeslots
    for class_session_json in class_session_jsons:
        session_name = class_session_json.get("name")
        if ("99") in session_name: # no one likes lab 99. Im sorry
            continue

        class_session_timeslot_jsons = class_session_json.get("timeslot")
        curr_class_type = _make_class_sessions( session_name, \
                                                        class_session_timeslot_jsons, \
                                                        term) #LECT, LAB, etc
        
        if (curr_class_type.global_start_times == []): # never starts; meh method
            continue
        
        list_class_sessions.append( curr_class_type )
    
    return list_class_sessions

    
def _make_class_sessions(session_name: str, \
                         class_session_timeslot_jsons: list[dict[str, Any]],\
                         term: list[int]) -> ClassSession:
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
            
            start_times.append(_start_time_in_minutes(time, \
                                                      class_session_timeslot_json.get("weekday"), \
                                                      curr_term) )
            
            global_start_times.append(_time_in_ten_days_minutes(start_times[-1][0],
                                                                start_times[-1][1],
                                                                curr_term) )
            
            durations.append(int( class_session_timeslot_json.get("duration") ))

            global_end_times.append( global_start_times[-1] + durations[-1] )

            campus.append( class_session_timeslot_json.get("campus") )  

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
        print("Day isn't any of these: " + str(weekday))
        return 0


def _time_in_ten_days_minutes(time: int, day: int, curr_term: int) -> int:
    # print(curr_term)
    # print(day)
    # print(time)
    return (curr_term * 7200) + (day * 1440) + time # max 14400


def _terms_in_this_section(term: str) -> list[int]:
    # print(term)
    if term == "F" or term == "S1":
        return [0]
    elif term == "W" or term == "S2":
        return [1]
    elif term == "Y" or term == "SU":
        return [0, 1]
    elif "L" in term:
        # print("Special term; block model, WL, or L1/L2")
        return [0]
    else:
        # print("No considered term")
        return [0]