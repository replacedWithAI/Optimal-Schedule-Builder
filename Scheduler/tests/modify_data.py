import default_case

default_case.payload["courses"]["changed course data"] = {
    "EECS 1021": {
        "schedule": {
            "Y": {
                "section": "Y"
            }
        }
    }
}

default_case.payload["courses"]["pinned sections classes terms"] = {}
default_case.calculate_schedule(default_case.payload)
