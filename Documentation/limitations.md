1. Schedule compute time is limited. Currently, the solver is given 20 seconds to compute the best schedule given constraints, preferences, and objectives. This is to make sure cloudflare verification token doesn't timeout in the backend,
   but also, with a schedule of only 12 possible courses, 1 busy time, and 1 objective, it takes the solver 2 minutes to compute the optimal schedule. Given that conditions can be several times more complicated, I'm not sure the program's
   feasible for 20+ people a month
 2. Best courses don't consider prerequisites
  - means you have to decide which courses are mandatory to take to progress
  - means you have to decide which courses you can take right now
  - means that the program can give you a course you won't have the prerequisites for
 3. Difficult for users to verify information
    - for start times/end times/duration of sessions, people will have to manually check them. Also, they have to knowingly enter in section letters, course names, etc without a dropdown menu
 4. Maintainers/developers have to manually enter in folders of course data every FW/SU term
 5. There's no real "minimize school days" objective". It's doable by setting commute times to max, but that's not truly isolated, as it solves for minimal school days, then the most compact schedule
 6. Can't conveniently schedule around personal events. If there's a weekly club event you'd like to consider in your most compact schedule, you'd have to:
  1. add a random course's section's module/class
  2. modify that course's start time + duration + day to be your personal event
  3. pin that module/class
  4. set the other fixed classes/modules, like lectures, to have duration 0
 7. Limited professor scraping. When using professor data:
  1. the data is static, such that course data is fixed to when the developer scraped yorku's course data. This means that data for sections, professors, and professor ratings at calculation time might be different
  2. a professor's score requires a 90% similarity from SequenceMatcher to have theirs assigned to them
 8. Need to verify that user-entered fields in modified course data are valid format. If it's invalid, there will be an error prompt to change it, but users can ignore it and enter it in anyways. This may result in "infeasible" statuses for
    schedules
