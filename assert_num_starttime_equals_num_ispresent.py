import main
from CPSAT.Make_CPSAT_variables import CPSAT_variable_maker

main_obj = main
courses = main_obj.Course_file_extractor.get_list_of_courses_data()
CPSAT_variable_maker_obj = CPSAT_variable_maker(courses)
start_time_variables = CPSAT_variable_maker_obj.start_time_variables
is_present_variables = CPSAT_variable_maker_obj.is_present_variables

print(start_time_variables)
print(is_present_variables)