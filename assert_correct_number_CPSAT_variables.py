import Extract_course_jsons_and_data_types
from Scheduler.CPSAT.Make_CPSAT_variables import CPSAT_variable_maker
from ortools.sat.python import cp_model
from ortools.sat.python.cp_model_helper import IntVar

model = cp_model.CpModel()
main_obj = Extract_course_jsons_and_data_types
courses = main_obj.courses
course_jsons = main_obj.course_jsons
print(course_jsons)
CPSAT_variable_maker_obj = CPSAT_variable_maker(courses, model)
interval_variables = CPSAT_variable_maker_obj.interval_variables

total_num_start_time_variables = 0
total_num_is_present_variables = 0
total_num_interval_variables = 0

for course in courses:
    for section in course.sections:
        for curr_class in section.classes:
                         
            list_interval_variables = interval_variables[course.course_name] \
                                                        [section.section_letter] \
                                                        [curr_class.activity_name] \
                                                            
            #print(course.course_name)
            #print(section.section_letter)

            num_interval_variables = len(list_interval_variables)
            
            for i in range(num_interval_variables):
                interval_start_time = list_interval_variables[i].start_expr()
                interval_is_present = list_interval_variables[i].presence_literals()[0]

                total_num_start_time_variables += isinstance(interval_start_time, int)
                total_num_is_present_variables += isinstance(interval_is_present, 
                                                             IntVar)

            total_num_interval_variables += num_interval_variables

            num_variables_difference = abs(total_num_is_present_variables 
                                           - total_num_start_time_variables)

            if (num_variables_difference != 0):
                print("There is a difference of " + num_variables_difference \
                + "between CPSAT variables")
                print(f"Curr course: {course.course_name}")
                print(f"Curr section: {section.section_letter}")
                print(f"Curr class: {curr_class.activity_name}")
print(interval_variables)

print("Total number of is_present variables: " + str(total_num_is_present_variables))
print("Total number of start_time variables: " + str(total_num_start_time_variables))
print("Total number of interval variables: " + str(total_num_interval_variables))
                
            
