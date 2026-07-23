payload = {
    "courses": {                                            <!-- course info -->
        "possible courses" [{course codes}]                 <!-- courses to take -->
        "pinned sections classes" {                         
            {section letter}: [class/activity names]
            "Fixed term": [{term_letter}]
        }
        "requested courses": [{course codes}]
        "changed course data": {
            {course code}: {
                faculty: str
                department: str
                course_number: str
                course_code: str
                credits: str
                course_name: str
                prerequisites: [{course codes}]

                {section letter}: {
                    term: [{term number}]
                    section_letter: str
                    professor: str
                    fixed_classes: [{class names}]

                    {class name}: {
                        session_name: str
                        start_times: [[{minutes}, {weekday}, {semester int}]...] 
                        global_start_times: [{minutes}]
                        duration: [{minutes}]
                        global_end_times: [{minutes}]
                        campus: [str]
                    }
                }
            }
        }
    }

    "preferences" {                                         <!-- side missions -->
        "personal times": {
            {weekday number}: [[start time, end time]]
        }

        "max courses per term": int
    }

    "goals": {                                              <!-- main missions -->
        "objective priority": [{objective names}]
        "commute times": int
    }
}