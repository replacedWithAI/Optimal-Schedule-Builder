from typing import Any

from lib import Course
from lib import Section
from lib import ClassSession

from gettingcourses.check_conditions import ConditionChecker

__all__ = ["make_courses"]

def make_courses(course_jsons: list[dict[str, Any]], payload: dict) -> list[Course]:
    courses = []
    validator = ConditionChecker(payload)
    
    for course_json in course_jsons.values():
        course_key = course_json["key"]
        section_json = course_json["schedule"]
        course_code = f"{course_key["dept"]} {course_key["code"]}"
        validator.course_code = course_code

        course = Course(faculty = course_key["faculty"], 
                        department = course_key["dept"], 
                        course_number = course_key["code"], 
                        course_code = course_code, 
                        credits = course_key["credit"], 
                        course_name = course_json["name"],
                        course_presence = None,
                        prerequisites = course_json["prereq"], 
                        sections = _make_sections(section_json, validator, payload))
        del course_json
        # print (course_jsons)
        courses.append(course)
        # print(course.course_code)

    return courses


def _make_sections(section_jsons: list[dict[str, Any]], 
                   validator: ConditionChecker, payload: dict) -> list[Section]:
    Sections = []

    for section_json in section_jsons.values():

        class_jsons = section_json.get("classes")
        term = _terms_in_this_section(section_json.get("term"))
        
        validator.section_letter = section_json["section"]
        should_prune = validator.is_unusual_term(term) \
                        or validator.isnt_fixed_section() \
                        or validator.isnt_fixed_terms(section_json.get("term"))
        if (should_prune): continue

        fixed_classes = _get_num_section_classes_by_type(class_jsons)
        validator.fixed_classes = fixed_classes

        section_classes = _make_classes(class_jsons, term, validator)
        if (validator.has_no_classes(section_classes)): continue

        professor = _get_section_professor(section_json, fixed_classes)
        score = section_json.get("score")
        num_reviews = section_json.get("num_reviews", 0)
        default_score = payload["preferences"]["default RMP score"]
        required_num_reviews = payload["preferences"]["required num reviews"]
        
        section_obj = Section(term = term,
                              section_letter = section_json["section"],
                              professor = professor,
                              RMP_score = _get_RMP_score(professor = professor, 
                                                         score = score,
                                                         num_reviews = num_reviews,
                                                         default_score = default_score,
                                                         required_num_reviews = 
                                                         required_num_reviews),
                              classes = section_classes,
                              fixed_classes = fixed_classes,
                              section_presence = None)
        Sections.append(section_obj)

    return Sections


def _make_classes(class_jsons: list[dict[str, Any]],
                  term: list[int],
                  validator: ConditionChecker)-> list[ClassSession]: 
    list_class_sessions = []
    
    # each class session has its list of timeslots
    for class_json in class_jsons.values():
        class_name = class_json["name"]

        should_prune = validator.is_lab_99(class_name) or \
                        validator.isnt_chosen_class(class_name)

        if (should_prune): continue

        class_session_jsons = class_json["timeslot"]
        curr_class = _make_class_sessions(class_name, class_session_jsons, 
                                          term, validator) #LECT, LAB, etc
        
        session_pruned = (validator.no_sessions_start(curr_class.global_start_times)) \
                         or (validator.outside_personal_times(curr_class))

        curr_class_type = class_name[:class_name.find(' ')]
        if (session_pruned):
            if (validator.is_fixed_class(curr_class_type)): return []
            continue
        
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
        for class_session_json in class_session_jsons.values():

            time = class_session_json["time"]
            # print(time)
            if (validator.session_doesnt_start(time)): continue
            
            start_times.append(_start_time_in_minutes(time, \
                                                    class_session_json["weekday"],
                                                    curr_term))

            durations.append(int( class_session_json["duration"] ))

            global_start_times.append(_time_in_ten_days_minutes(start_times[-1][0],
                                                                start_times[-1][1],
                                                                curr_term) )

            global_end_times.append( global_start_times[-1] + durations[-1] )

            campus.append(class_session_json["campus"])  

    return ClassSession(session_name=session_name, start_times=start_times, 
                        global_start_times=global_start_times,
                        duration=durations, global_end_times=global_end_times, 
                        campus=campus, session_presences=[])

# helper functions -------------------------------------------------------------

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


def _get_num_section_classes_by_type(classes_json: list[dict[str, Any]]) \
                                                            -> dict[str, int]:
    fixed_section_classes = {}
    for curr_class in classes_json.values():
        
        space_index = curr_class["name"].find(' ')
        curr_class_type = curr_class["name"][:space_index] # lect, blen, tutr...

        fixed_section_classes.setdefault(curr_class_type, 0)
        fixed_section_classes[curr_class_type] = \
                                fixed_section_classes.get(curr_class_type, 0) + 1

    #print(f"section classes: {section_classes}")
    return [curr_class for curr_class, count in fixed_section_classes.items() 
            if count == 1]


def _get_section_professor(section_json: list[dict[str, Any]], 
                           fixed_classes: list[str]) -> str:
    if (section_json.get("professor", None) is None):
        return ""
    return section_json["professor"]


def _get_RMP_score(professor: str, score: int, num_reviews: int,
                   default_score: int, required_num_reviews: int) -> int:
    if score is None or professor == "" or num_reviews < required_num_reviews:
        return default_score
    return score