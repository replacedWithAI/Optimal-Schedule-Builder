import default_case

default_case.payload["courses"]["changed course data"] = {
    "EECS 1021": {
        "schedule": {
            "Y": {
                "section": "W1"
            }
        }
    }
}

all_best_courses = default_case.calculate_schedule(default_case.payload)
default_case.Plotter(all_best_courses)
