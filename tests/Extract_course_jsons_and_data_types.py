from Scheduler.Downloading_and_processing_json_files.Download_files_from_file_system import get_files
from Scheduler.Downloading_and_processing_json_files.Course_json_string_retriever \
    import Course_json_retriever
from Scheduler.Downloading_and_processing_json_files.Extract_process_course_data \
    import Course_file_extractor

department_json_path = get_files()
print(department_json_path)

requested_courses = [input("Ok nice, now give your course names and type '-1' to leave")]
while (requested_courses[-1] != "-1"):
    requested_courses.append(input("List another or type '-1' to leave"))
del(requested_courses[-1])
print(requested_courses)

Course_json_retriever = Course_json_retriever(department_json_path, requested_courses)
course_jsons = Course_json_retriever.get_course_jsons()
print(course_jsons)
del Course_json_retriever
        
Course_file_extractor = Course_file_extractor(course_jsons)
courses = (Course_file_extractor.get_list_of_courses_data())

print(courses)
