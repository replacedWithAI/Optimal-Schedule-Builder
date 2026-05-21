from Scheduler.Downloading_and_processing_json_files.Course_json_string_retriever \
    import Course_json_retriever
from Scheduler.Downloading_and_processing_json_files.Extract_process_course_data \
    import Course_file_extractor
from Scheduler.CPSAT.CPSAT import Schedule_maker
from Scheduler.Schedule_plotter.Plotter import Plotter

requested_courses = [input("Ok nice, now give your course names and type '-1' to leave")]
while (requested_courses[-1] != "-1"):
    requested_courses.append(input("List another or type '-1' to leave"))
del(requested_courses[-1])
print(requested_courses)

Course_json_retriever = Course_json_retriever(requested_courses)
course_jsons = Course_json_retriever.get_course_jsons()
print(course_jsons)
del Course_json_retriever
        
Course_file_extractor = Course_file_extractor(course_jsons)
courses = (Course_file_extractor.get_list_of_courses_data())

print("Alright, now you can enter unavailable days and hours to schedule around." \
"\nEnter in the following format pls (Semester1 Mon 18:00 24:00)")

unavailable_hours = ["Mon1", [0, 0]]
Schedule_maker_obj = Schedule_maker(unavailable_hours, courses)
all_chosen_courses = Schedule_maker_obj.all_chosen_courses
print(all_chosen_courses)

Plotter_obj = Plotter(all_chosen_courses)