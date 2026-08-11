```
payload = {
    "courses": {                                 <!-- course info -->
        "possible courses" [<course codes: str>] <!-- courses to take -->
        "pinned sections classes terms": {       <!-- 
                                                    pinning specific parts of 
                                                    a course, but not the course 
                                                    itself 
                                                 -->                  
            <section letter>: [class/activity names: str]
            "terms": []
        }
        "pinned courses": [<course codes: str>]  <!--pinning only courses -->
        "changed course data": {
            <course code>: {
                faculty: str
                dept: str
                code: str                        <!-- the course number -->
                credit: str
                name: str
                prereq: [<course codes>]
                
                "schedule": {
                    <section letter>: {
                        term: [<term: int>]
                        section: str             <!-- section letter -->
                        professor: str

                        classes: {
                            <class name>: {
                                "timeslot": {
                                    <weekday: str>: {
                                        time: str
                                        duration: str
                                        campus: str
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    "preferences" {                                         <!-- side missions -->
        "personal times": {
            <weekday number>: [[start time, end time]]
        }

        "pin campus": [{campus: str}]
        "max courses per term": int
        "required num reviews": int
        "default RMP score": float
    }

    "goals": {                                              <!-- main missions -->
        "objective priority": list[str] = [{objective names}]
        "commute times": int
    }
}
```