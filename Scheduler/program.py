from gettingcourses import get_course_jsons
from gettingcourses import make_courses
from CPSAT import find_best_options
from lib.Plotter import Plotter

# assume the workspace folder is Scheduler

def calculate_schedule(possible_courses: list = ["CHEM 1100", "MATH 1013",
                                                "MATH 1014", "EECS 1021",
                                                "MATH 1028", "ENG 1102",
                                                "MATH 2030", "MATH 2015"]
                                                            ) -> dict:
    course_jsons = get_course_jsons(possible_courses)
    # print(course_jsons)
    
    # print("Alright, now you can enter unavailable days and hours to schedule around." \
    # "\nEnter in the following format pls (Semester1 Mon 18:00 24:00)")
    # personal_times = {0: [[12390, 12391]]}
    # personal_times = {0: [[690, 691]]}

    fixed_courses = []
    chosen_sections_classes = {"EECS 1021": {
        'Y': ["LAB 05"]
    }}
    
    # maybe I should make MakeCoursesQuery
    courses = make_courses(course_jsons, personal_times = {}, 
                           chosen_sections_classes = chosen_sections_classes)
    del course_jsons
    # print(courses)

    all_best_courses = find_best_options(courses)
    del courses
    print(all_best_courses)
    Plotter_obj = Plotter(all_best_courses)

    return all_best_courses

if __name__ == "__main__":
    calculate_schedule()