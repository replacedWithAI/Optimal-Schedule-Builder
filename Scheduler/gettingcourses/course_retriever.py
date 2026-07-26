from typing import Any
from pathlib import Path
import json

__all__ = ["get_course_jsons"]

def get_course_jsons(requested_course_names: list[str], 
                     payload: dict) -> list[dict]:
    user_path = _get_files_folder()
    department_codes = _get_department_codes(requested_course_names)
    course_codes = _get_course_codes(requested_course_names)
    department_data = _open_department_jsons(user_path, department_codes)
    course_jsons = _download_course_json(department_data, 
                                                department_codes, 
                                                course_codes)
    course_jsons = _normalise_course_jsons(course_jsons)
    _overwrite_courses(course_jsons, payload)
    
    return course_jsons

    
def _get_files_folder():
    curr_file_directory = (__file__)
    curr_folder = Path(curr_file_directory).resolve().parent 
    course_info_folder = curr_folder / "output_courses_json 2026_01_15"
    return course_info_folder


def _get_department_codes(requested_course_names: list[str]) -> list[str]:
    department_codes = []
    for curr_course_name in requested_course_names:
        space_index = curr_course_name.find(' ')
        department_codes.append(curr_course_name[0:space_index])
    return department_codes


def _get_course_codes(requested_course_names: list[str]) -> list[str]:
    course_codes = []
    for curr_course_name in requested_course_names:
        space_index = curr_course_name.find(' ')
        course_codes.append(curr_course_name[space_index+1:])
    return course_codes


def _open_department_jsons(user_path: Path, 
                           department_codes: list[str]) -> list[dict[str, Any]]:
    department_data = []
    for department in department_codes:
        try: 
            path = Path(str(user_path) + '/' + department + ".json")
            with path.open() as department_json:
                current_department_data = json.load(department_json)
                department_data.append(current_department_data)
        except FileNotFoundError:
            print("Can't find the department file in your path")
            continue
    return department_data
    

def _download_course_json(department_data: list[dict[str, Any]], 
                                  department_codes: list[str], 
                                  course_codes: list[str]) -> list[dict[str, Any]]:
    course_jsons = []
    index = 0
    
    for department in department_data:
        courses = department.get("courses", "Not found")

        for course in courses:
            key = course.get("key","Not found")
            code = key.get("code", "Not found")
            department = key.get("dept", "Not found")
            if code == course_codes[index] \
            and department == department_codes[index]: # I feel like this is bugged 
                course_jsons.append(course)
                index += 1
                break

    return course_jsons


def _normalise_course_jsons(course_jsons: list[dict]) -> dict:
    return { # what in tarnation is this?
            f"{course_json["key"]["dept"]} {course_json["key"]["code"]}": {
                **course_json,
                "schedule": {

                    section["section"]: {
                        **section,
                        "classes": {

                            curr_class["name"]: {
                                **curr_class,
                                "timeslot": {
                                    session["weekday"]: session
                                    for session in curr_class["timeslot"]
                                }
                            }
                            for curr_class in section["classes"]
                        }

                    }
                    for section in course_json["schedule"]
                }
                
            }
            for course_json in course_jsons
        }


def _overwrite_courses(course_jsons: dict, payload: dict):
    changed_course_data = payload["courses"]["changed course data"]
    if changed_course_data == {}: return 

    courses_to_overwrite = changed_course_data.keys()

    for course in courses_to_overwrite:
        queue = [(course_jsons[course], changed_course_data[course])]

        while queue:
            original, new = queue.pop()
            for course, data in new.items():
                if (isinstance(data, dict) and data != {}):
                    queue.append((original[course], data))
                else:
                    original[course] = data



        
