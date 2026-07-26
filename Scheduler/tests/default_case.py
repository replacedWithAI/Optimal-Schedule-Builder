import sys
from pathlib import Path

parent_dir = str(Path(__file__).resolve().parent.parent)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from program import calculate_schedule

payload = {
    "courses": {                                           
        "possible": ["CHEM 1100", "MATH 1013",
                    "MATH 1014", "EECS 1021",
                    "MATH 1028", "ENG 1102",
                    "MATH 2030", "MATH 2015"],  
        "pinned sections classes terms": {
            "EECS 1021": {
                "sections classes": {
                    "Y": ["LAB 05"]
                },
                "terms": ["W"]
            }
        },
        "pinned courses": ["CHEM 1100", "MATH 1013",
                            "MATH 1014", "EECS 1021",
                            "MATH 1028", "ENG 1102",
                            "MATH 2030", "MATH 2015"],
        "changed course data": {}
    },

    "preferences": {                                        
        "personal times": {
            0: [[12390, 12391]]
        },

        "pinned campuses": [],
        "max courses per term": 5,
        "required num reviews": 0,
        "default RMP score": 2
    },

    "goals": {                                             
        "objective priority": [],
        "commute times": 0
    }
}

if __name__ == "__main__":
    all_best_courses = calculate_schedule(payload)
    print(all_best_courses)