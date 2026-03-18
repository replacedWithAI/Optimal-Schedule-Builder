from pathlib import Path
# dire WIP
def get_files():
    department_json_path = Path(input("Yo give me your department file path"))

    while(not department_json_path.exists() or department_json_path.is_file()):
        if not department_json_path.exists():
            print("Path {department_json_path} does not exist")
            
        if department_json_path.is_file():
            print("This is a file, not a path. Give the folder that the file's in")
            
    return department_json_path
