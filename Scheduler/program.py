from gettingcourses import get_course_jsons
from gettingcourses import make_courses
from CPSAT import find_best_options
from lib.Plotter import Plotter

# assume the workspace folder is Scheduler

def calculate_schedule(payload: dict[str, dict]) -> dict:
    requested_course_names = payload["courses"]["possible"]
    course_jsons = get_course_jsons(requested_course_names)
    # print(course_jsons)
    
    courses = make_courses(course_jsons, payload)
    del course_jsons
    print(courses)

    all_best_courses = find_best_options(courses, payload)
    del courses
    Plotter_obj = Plotter(all_best_courses)

    return all_best_courses

if __name__ == "__main__":
    calculate_schedule()