from gettingcourses import get_course_jsons
from gettingcourses import make_courses
from CPSAT.CPSAT import Schedule_maker
from lib.Plotter import Plotter

# assume the workspace folder is Scheduler

def calculate_schedule(selected_courses: list = ["CHEM 1100", "MATH 1013",
                                                "MATH 1014", "EECS 1021",
                                                "MATH 1028", "ENG 1102",
                                                "MATH 2030", "MATH 2015"]
                                                            ) -> dict:
    course_jsons = get_course_jsons(selected_courses)
    # print(course_jsons)
    
    # print("Alright, now you can enter unavailable days and hours to schedule around." \
    # "\nEnter in the following format pls (Semester1 Mon 18:00 24:00)")
    personal_times = {0: [[12390, 12391]]}

    courses = make_courses(course_jsons, personal_times)
    del course_jsons
    print(courses)

    Schedule_maker_obj = Schedule_maker(courses)
    all_best_courses = Schedule_maker_obj.all_best_courses
    print(all_best_courses)
    Plotter_obj = Plotter(all_best_courses)

    return all_best_courses
    # print(all_chosen_courses)

if __name__ == "__main__":
    calculate_schedule()