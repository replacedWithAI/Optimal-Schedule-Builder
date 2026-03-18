There's an entire book on CPSAT so I'll oversimplify
[I followed the guide here; might be more followable](https://d-krupke.github.io/cpsat-primer/04B_advanced_modelling.html#scheduling-for-multiple-resources-with-optional-intervals)

# Add_courses_to_CPSAT
Each lecture, lab, tutorial is an interval variable. These variables have:
- start_time variables
- size variables, which is just the class duration (int)
- is_present variables
- name variables; what they're called (string)

# 1. Discrete variables for your "Human Logic" constraints
day_var = model.NewIntVar(0, 4, 'day_cs101')
time_of_day_var = model.NewIntVar(480, 1200, 'time_cs101') # e.g., 8am to 8pm
duration = 90

# 2. The Bridge Variable for the "Solver Logic"
global_start = model.NewIntVar(0, 7200, 'global_start_cs101')
global_end = model.NewIntVar(0, 7200, 'global_end_cs101')

# 3. Link them together
model.Add(global_start == day_var * 1440 + time_of_day_var)
model.Add(global_end == global_start + duration)

# 4. Create the actual interval
# (Use NewOptionalIntervalVar if this is one of your XOR choices)
interval = model.NewIntervalVar(global_start, duration, global_end, 'interval_cs101')

# 5. Add to the global clash check
model.AddNoOverlap([interval, other_interval_1, other_interval_2])

## Functions/classes

### Make_is_present_variables
Idea:
Each class (the whole thing) of each section has unique timeslots
Each class has timeslots on multiple days
Therefore, each class's timeslots need to be toggeable
However, classes share days (finite). Otherwise, they can happen independently each day
So, each timeslot must be its own bool variable
Keep in mind: is_present makes intervals toggleable. To decide how they'll be toggled, decide later

## Relevance/importance
You see me using a bunch of loops and dictionaries when defining these variables
These don't really matter; the interval variables only care:
- about the start time numerical values
- any CPSAT boolean variable

The loops are only for assigning keys to these values. Could've just put them in a list

### Start_time variables
Their values will only be a numerical start time

## Definitions

### Start_time variables
These are when the interval starts in the schedule
Their data type is CPSAT_obj.new_int_var_from_domain
They need CPSAT_obj.Domain.from_intervals(int) arguments, the int being the numerical start time

### Is_present variables
Lets an interval be present or not
Their data type is CPSAT_obj.new_bool_var
It's just a CPSAT boolean variable; no arguments or algorithms needed

### Interval
