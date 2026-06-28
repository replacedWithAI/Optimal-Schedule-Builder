from Scheduler.Downloading_and_processing_json_files.Course_json_string_retriever \
    import Course_json_retriever as CourseJsonRetrieveObj
from Scheduler.Downloading_and_processing_json_files.Extract_process_course_data \
    import Course_file_extractor as CourseFileExtractorObj
from Scheduler.CPSAT.CPSAT import Schedule_maker
from Scheduler.lib.Plotter import Plotter

def calculate_schedule(selected_courses: dict = {"Courses": ["CHEM 1100", "MATH 1013",
                                                       "MATH 1014", "EECS 1021",
                                                       "MATH 1028", "ENG 1102",
                                                        "MATH 2030", "MATH 2015"]}
                                                        ) -> dict:
    Course_json_retriever = CourseJsonRetrieveObj(selected_courses["Courses"])
    course_jsons = Course_json_retriever.get_course_jsons()
    # print(course_jsons)
    del Course_json_retriever
            
    Course_file_extractor = CourseFileExtractorObj(course_jsons)
    courses = (Course_file_extractor.get_list_of_courses_data())

    # print("Alright, now you can enter unavailable days and hours to schedule around." \
    # "\nEnter in the following format pls (Semester1 Mon 18:00 24:00)")

    unavailable_hours = ["Mon1", [0, 0]]
    Schedule_maker_obj = Schedule_maker(unavailable_hours, courses)
    all_best_courses = Schedule_maker_obj.all_best_courses
    print(all_best_courses)
    # Plotter_obj = Plotter(all_best_courses)

    return all_best_courses
    # print(all_chosen_courses)

if __name__ == "__main__":
    calculate_schedule()