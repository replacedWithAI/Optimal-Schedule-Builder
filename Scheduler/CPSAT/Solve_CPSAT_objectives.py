from typing import Any
from ortools.sat.python import cp_model
class Solve_best_schedule:
    def __init__(self, 
                 intervals_by_day: dict[str, list[Any]], 
                 model: cp_model, 
                 commute_time: int = 0):
    
        self.__objective_priority(intervals_by_day, model, 
                                  commute_time)


    def __objective_priority(self, 
                             intervals_by_day: dict[str, list[Any]], 
                             model: cp_model, 
                             commute_time: int = 0): #WIP
        self.__solve_minimal_dead_times(intervals_by_day, 
                                        model, commute_time)
    

    def __solve_minimal_dead_times(self,
                                   intervals_by_day: dict[str, list[Any]],
                                   model: cp_model,
                                   commute_time: int = 0):
        curr_day_index = 0
        all_daily_school_day_length = []

        for curr_day, intervals in intervals_by_day.items():
            if intervals == []:
                continue

            day_start = model.new_int_var(0, 1440, f"{curr_day}_start")
            day_end = model.new_int_var(0, 1440, f"{curr_day}_end")
            school_day_length = model.new_int_var(0, 1440, f"{curr_day}_length")

            for interval in intervals:
                interval_local_start = interval.start_expr() % 1440 
                interval_local_end = interval.end_expr() % 1440
                interval_present = interval.presence_literals()[0]

                model.add(day_start <= interval_local_start).only_enforce_if(interval_present)
                model.add(day_end >= interval_local_end).only_enforce_if(interval_present)
            
            model.add(school_day_length == (day_end-day_start + commute_time*2))
            
            curr_day_index += 1
            all_daily_school_day_length.append(school_day_length)

        model.minimize(sum(all_daily_school_day_length))
        return