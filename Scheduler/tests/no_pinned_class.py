import default_case

default_case.payload["courses"]["pinned sections classes terms"] = {
    "EECS 1021": {
        "sections classes": {
            "Y": []
        },
        "terms": ["W"]
    }
}

all_best_courses = default_case.calculate_schedule(default_case.payload)
default_case.Plotter(all_best_courses)