from typing import Any
from pathlib import Path
import json
class Course_json_retriever:
    def __init__(self, user_path: Path, requested_course_names: list[str]):
        department_codes = self.__get_department_codes(requested_course_names)
        course_codes = self.__get_course_codes(requested_course_names)
        department_data = self.__open_department_jsons(user_path, department_codes)
        self.course_jsons = self.__download_course_json_strings(department_data, 
                                                                department_codes, 
                                                                course_codes)
        
    def __get_department_codes(self, requested_course_names: list[str]) -> list[str]: # needs to methodology later
        department_codes = []
        for course_name in requested_course_names:
            department_codes.append(course_name[0:4])
        return department_codes


    def __get_course_codes(self, requested_course_names: list[str]) -> list[str]:
        course_codes = []
        for course_code in requested_course_names:
            course_codes.append(course_code[5:9])
        return course_codes


    def __open_department_jsons(self, user_path: Path, department_codes: list[str]) -> list[dict[str, Any]]:
        department_data = []
        for department in department_codes:
            try: 
                path = Path(str(user_path) + '/' + department + ".json")
                print(path)
                with path.open() as department_json:
                    current_department_data = json.load(department_json)
                    department_data.append(current_department_data)
            except FileNotFoundError:
                print("Can't find the department file in your path")
                continue
        return department_data
        

    def __download_course_json_strings(self, department_data: list[dict[str, Any]], 
                                       department_codes: list[str], 
                                       course_codes: list[str]) -> list[dict[str, Any]]:
        course_json_strings = []
        index = 0
        
        for department in department_data:
            courses = department.get("courses", "Not found")

            for course in courses:
                key = course.get("key","Not found")
                code = key.get("code", "Not found")
                department = key.get("dept", "Not found")
                if code == course_codes[index] and department == \
                   department_codes[index]: # I feel like this is bugged; saving test case in drive. It's the same code as C4 without a break
                    course_json_strings.append(course)
                    index += 1
                    break

        return course_json_strings


    def get_course_jsons(self):
        return self.course_jsons
