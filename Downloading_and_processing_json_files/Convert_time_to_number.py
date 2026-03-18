def time_to_index(start_time: str) -> int: # sum all units of time into one numerical value
    hour = start_time[:2]
    minutes = start_time[3:]
    return hour*60 + minutes # max: 1440