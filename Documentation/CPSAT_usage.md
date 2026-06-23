There's an entire book on CPSAT so I'll oversimplify  
[I followed the guide here; might be more followable](https://d-krupke.github.io/cpsat-primer/04B_advanced_modelling.html#scheduling-for-multiple-resources-with-optional-intervals)

What's CPSAT?
A linear programming, constraint programming solver, which I'll use for scheduling  
Derived from linear algebra. Basically, make linear relationships between variables
and it will solve that for you. Keyword: relationships  
Can use inequalities for maximizing/minimizing goals, and these "goals" can be defined as linear equations  
[MIT explains it better tbh lol](https://math.mit.edu/~gs/linearalgebra/ila5/linearalgebra5_10-4.pdf)

Disclaimer: The purpose of this file is to explain usage/basic definitions of the library, not
for explaining each helper class's purpose

# Functions/classes

## Add_courses_to_CPSAT / Make_CPSAT_variables 
Idea:  
This will define each class you take as an interval.  
Since classes start times are in units of semesters ~(semester 1 or 2)~, days ~(mon, tues, wed... fri)~, 
and hours ~(2 pm)~, I'll just convert all of these into minutes. By doing this conversion,
it's easier to tell if classes overlap. 

Also, some courses' class (i.e. lab, tutorial) timeslots are flexible
Therefore, each class interval need to be toggeable  

In the code,  
You see me using a bunch of loops and dictionaries when defining these variables  
These don't really matter; the interval variables only care about:  
- the start time numerical values  
- any CPSAT boolean variable  
The loops are only for assigning keys to these values. Could've just put them in a list

### CPSAT variable definitions

#### Start_time variables  
These are when the interval starts in the schedule  
Their data type is CPSAT_obj.new_int_var_from_domain  
They need CPSAT_obj.Domain.from_intervals(int) arguments, the int being the numerical start time

#### Is_present variables  
Lets an interval be present or not  
Their data type is CPSAT_obj.new_bool_var  
It's just a CPSAT boolean variable; no arguments or algorithms needed

#### Interval variable  
Each lecture, lab, tutorial is an interval variable. These variables have:  
- start_time variables  
- size variables, which is just the class duration (int)  
- is_present variables  
- name variables; what they're called (string)

## add_constraints / Add_CPSAT_constraints  
This adds rules for the scheduler to follow  
The rules I'll add are:  
- Intervals can't overlap; maybe I'll let people decide a degree of overlap  
- One section per course  
- One lab/tutorial per course, if applicable  
- Don't take classes in undesired times

Also groups interval variables in a seperate dictionary, where each weekday is the key  
This'll be used for solving for scheduling objectives

## Solve_CPSAT_objectives
Given an objective, the solver will find the optimal solution via math

### Solve_minimal_dead_times
Basically, solves for the minimum difference between the start and end time of
each day. 

First, create 3 linear expressions: day_start, day_end, school_day_length  
Define day_start as the time the first class starts  
Define day_end as the time the last class ends
These two equations will define "school_day_length", with a commute time penalty  
Then, the overall goal is to minimize the sum of all school_day_lengths across all
10 days of the semester

## Extract_solver_values / extract_solver_values
Gonna get the selected sections and classes by the solver
If I wanna let it toggle classes, I gotta add it in get_taken_courses

# Scheduling cavets

## Lab 99 isn't considered
Since people don't usually take it, it's ignored
Its duration isn't listed in VSB anyways; you can't schedule around it

## Block model isn't considered
It's probably easy to manually add it, but I'm lazy
It's kind of insane to take more than 5 courses a semester anyways, I'm sorry

You can try blocking off all of fall semester and using this for winter