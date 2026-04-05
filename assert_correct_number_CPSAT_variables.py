import Extract_course_jsons_and_data_types
from Scheduler.CPSAT.Make_CPSAT_variables import CPSAT_variable_maker
from ortools.sat.python import cp_model

model = cp_model.CpModel()
main_obj = Extract_course_jsons_and_data_types
courses = main_obj.courses
course_jsons = main_obj.course_jsons
print(course_jsons)
CPSAT_variable_maker_obj = CPSAT_variable_maker(courses, model)

start_time_variables = CPSAT_variable_maker_obj.start_time_variables
is_present_variables = CPSAT_variable_maker_obj.is_present_variables
interval_variables = CPSAT_variable_maker_obj.interval_variables

total_num_start_time_variables = 0
total_num_is_present_variables = 0
total_num_interval_variables = 0

for course in courses:
    for section in course.sections:
        for curr_class in section.classes:
            list_start_time_variables = start_time_variables[course.course_name] \
                                                            [section.section_letter] \
                                                            [curr_class.activity_name] \
                                                            
            list_is_present_variables = is_present_variables[course.course_name] \
                                                            [section.section_letter] \
                                                            [curr_class.activity_name] \
                                                            
            list_interval_variables = interval_variables[course.course_name] \
                                                        [section.section_letter] \
                                                        [curr_class.activity_name] \
                                                        
            #print(course.course_name)
            #print(section.section_letter)

            num_start_time_variables = len(list_start_time_variables)
            num_is_present_variables = len(list_is_present_variables)
            num_interval_variables = len(list_interval_variables)

            total_num_start_time_variables += num_start_time_variables
            total_num_is_present_variables += num_is_present_variables
            total_num_interval_variables += num_interval_variables

            num_variables_difference = abs(num_start_time_variables - num_is_present_variables)

            if (num_variables_difference != 0):
                print("There is a difference of " + num_variables_difference \
                + "between CPSAT variables")

                loop_index = 0
                for i in range(max(num_start_time_variables, num_is_present_variables)):
                    # print(list_start_time_variables[i])
                    # print(list_is_present_variables)
                    loop_index += 1

                #print(loop_index)
                print(num_is_present_variables)
                print(num_start_time_variables)
                if (num_is_present_variables) != loop_index:
                    print("num of is_present variables is bigger than start_time; \
                    it's this many more:" + str(num_is_present_variables - loop_index))

                if (num_start_time_variables) != loop_index:
                    print("num of start_time variables is bigger than is_present; \
                    it's this many more:" + str(num_start_time_variables - loop_index))

print(start_time_variables)
print(is_present_variables)
print(interval_variables)

print("Total number of is_present variables: " + str(total_num_is_present_variables))
print("Total number of start_time variables: " + str(total_num_start_time_variables))
print("Total number of interval variables: " + str(total_num_interval_variables))
                
            
