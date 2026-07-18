from gettingcourses import get_course_jsons
from gettingcourses import make_courses
from CPSAT import find_best_options
from lib.Plotter import Plotter

# assume the workspace folder is Scheduler

def calculate_schedule(payload: dict[str, dict] = {"courses":{
                                                "required": ["CHEM 1100", "MATH 1013",
                                                "MATH 1014", "EECS 1021",
                                                "MATH 1028", "ENG 1102",
                                                "MATH 2030", "MATH 2015"]}}) -> dict:
    possible_courses = payload["courses"]["required"]
    

    course_jsons = get_course_jsons(possible_courses)
    # print(course_jsons)
    
    # personal_times = {0: [[12390, 12391]]}
    personal_times = {}
    pinned_sections_classes = {"EECS 1021": {
        'Y': ["LAB 05"]
    }}
    requested_courses = []
    commute_times = 721
    max_courses_term = 4

    # pinned_sections_classes = payload["courses"]["pinned sections classes"]
    # personal_times = payload["rules"]["personal times"]
    courses = make_courses(course_jsons, personal_times = personal_times, 
                           pinned_sections_classes = pinned_sections_classes)
    del course_jsons
    # print(courses)

    # requested_courses = payload["courses"]["requested courses"]
    # commute_times = payload["objectives"]["commute times"]
    # max_courses_term = payload["rules"]["max courses per term"]
    all_best_courses = find_best_options(courses, 
                                         requested_courses = requested_courses,
                                         max_courses_term = max_courses_term,
                                         commute_times = commute_times)
    del courses
    print(all_best_courses)
    Plotter_obj = Plotter(all_best_courses)

    return all_best_courses

if __name__ == "__main__":
    calculate_schedule()