import default_case

default_case.payload["courses"]["pinned sections classes terms"] = {
    "EECS 1021": {
        "sections classes": {
            "Y": []
        },
        "terms": ["W"]
    }
}

default_case.calculate_schedule(default_case.payload)