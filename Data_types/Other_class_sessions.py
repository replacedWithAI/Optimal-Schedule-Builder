from dataclasses import dataclass

@dataclass
class Other_class_session:
    activity_name: list[str]
    days: list[str]
    start_times: list[int]
    duration: list[int]
    # Feel like campus isn't needed here; odds that lab/tutorial campus is 
    #   different than lecture?