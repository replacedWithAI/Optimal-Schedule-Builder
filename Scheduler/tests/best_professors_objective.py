import default_case

default_case.payload["goals"]["objective priority"] = ["best rated profs", 
                                                       "minimal dead times"]

result = default_case.calculate_schedule(default_case.payload)
all_best_courses = result["courses"]
default_case.Plotter(all_best_courses)
