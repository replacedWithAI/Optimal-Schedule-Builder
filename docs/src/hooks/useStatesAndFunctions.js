import { useState } from "react";
import { produce } from "immer";

/**
 * Has useStates for every JSON string in Documentation/payload_format.md,
 * with a few more for errors/results from whatever the python program returns. 
 * This is caleld in MainPage.jsx as all components there read/write to each other.
 */
export default function functionsAndUseStates(){
    // courses------------------------------------------------------------------
    const [possibleCourses, setPossibleCourses] = useState([]);
    const [pinnedCourses, setPinnedCourses] = useState([]);
    const [pinnedCourseParts, setPinnedCourseParts] = useState({});
    const [modifiedCourseData, setModifiedCourseData] = useState({});

    // preferences--------------------------------------------------------------
    const [pinnedCampuses, setPinnedCampuses] = useState([]);
    const [maxCoursesPerTerm, setMaxCoursesPerTerm] = useState(5);
    const [requiredNumReviews, setRequiredNumReviews] = useState(0);
    const [defaultRMPScore, setDefaultRMPScore] = useState(2.0);
    const [personalTimes, setPersonalTimes] = useState({});

    // goals--------------------------------------------------------------------
    const [objectivePriority, setObjectivePriority] = useState([]);
    const [commuteTimes, setCommuteTimes] = useState(0);

    // schedule results---------------------------------------------------------
    const [scheduleResult, setScheduleResult] = useState(null);
	const [scheduleError, setScheduleError] = useState(null);

    const sanitizeInput = (input) => input?.trim().toUpperCase() || "";
    
    //adding courses in pinnedCourses and possibleCourses in ConfigPanel
	const addCourses = (course, setCourse, currentInput, setCurrentInput) => {
		const items = currentInput.toUpperCase().split(/\r?\n/);
		const currentArray = course;

		const validItems = items.map(item => item.trim())
								.filter(item => item && item.length >= 9 &&
										!currentArray.includes(item))
								.map(item => item.substring(0, 9));

		if (validItems.length === 0) {
			setCurrentInput('');
			return;
		}
		
		console.log(`Added courses: ${validItems}`);
		setCourse([...currentArray, ...validItems]);
		setCurrentInput('');
	};


    // removing courses in CourseList
    const removeCourse = (course, setCourseList) => {
        setCourseList((prev) => prev.filter((c) => c !== course));
    }

    //--------------------------------------------------------------------------
    //setting pinned terms, sections, classes

    const addPinnedTerm = (courseCode, rawTerm) => {
        const term = sanitizeInput(rawTerm);

        setPinnedCourseParts(produce((draft) => {
            if (!draft[courseCode]) draft[courseCode] = {"terms": [], "sections": {}};
            if (term && /^[A-Z]$/.test(term) && term.length === 1)
                draft[courseCode].terms.push(term);
        }));
    };


    const addPinnedSectionLetter = (courseCode, rawLetter) => {
        const letter = sanitizeInput(rawLetter);

        setPinnedCourseParts(produce((draft) => {
            if (!draft[courseCode]) draft[courseCode] = {"terms": [], "sections": {}};
            if (!draft[courseCode].sections) {
                draft[courseCode].sections = {};
            }
            if (letter && /^[A-Z]$/.test(letter) && letter.length === 1 && 
                !draft[courseCode].sections[letter]) {
                draft[courseCode].sections[letter] = {};
            }
        }));
    };


    const addPinnedClassName = (courseCode, letter, rawName) => {
        const name = sanitizeInput(rawName);
        const spaceIdx = name.indexOf(" ")
        const classType = name.substring(0, spaceIdx);
        const classNumber = name.substring(spaceIdx+1);

        setPinnedCourseParts(produce((draft) => {
            const section = draft[courseCode]?.sections?.[letter] ?? false;
            if (name && section &&
                 /^[A-Z]+$/.test(classType) && /^\d+$/.test(classNumber) 
                && classType.length >= 3 && classType.length <= 4 && 
                classNumber.length === 2 && 1 + classType.length +
                classNumber.length === name.length)
                draft[courseCode].sections[letter][name] = {};
        }));
    };


    const removePinnedCoursePart = (courseCode, coursePart, coursePartKey) => {
        const keys = Array.isArray(coursePartKey) ? coursePartKey : 
                                [coursePartKey]
        setPinnedCourseParts(produce((draft) => {
            let currObject = draft;
            for (let i = 0; i < keys.length; i++) {
                if (currObject == null) break; // weirdly, also considers undef
                currObject = currObject[keys[i]];
            }

            if (Array.isArray(currObject)) {
                const index = currObject.indexOf(coursePart)
                if (index > -1)
                    currObject.splice(index, 1);
            }
        }));
    };

    // logic for modifying course data----------------------------------------------

    const EMPTY_COURSE_OVERRIDE = {
        faculty: '',
        dept: '',
        code: '',
        credit: '',
        name: '',
        prereq: '',
        schedule: {}
    };


    const emptySectionOverride = (letter) => ({
        term: '',
        section: letter,
        professor: '',
        classes: {}
    });


    const emptyClassOverride = (className) => ({
        name: className,
        timeslot: {}
    });


    const emptySessionOverride = (weekday) => ({
        weekday: weekday,
        time: "",
        duration: "",
        campus: ""
    });

    const skipModificiation = (key, exists) => !key || exists;

    const addModifiedCourseData = (path, rawCode) => {
        const code = sanitizeInput(rawCode);
        if (!code || modifiedCourseData[code]) {
            console.log(`${code} is already entered, or it's invalid`);
            return;
        }
        setModifiedCourseData(produce((draft) => {
            draft[code] = {...EMPTY_COURSE_OVERRIDE};
        }));
    };


    const removeModifiedCourseData = (path, code) => {
        setModifiedCourseData(produce((draft) => {
            delete draft[code];
        }));
    };


    const updateModifiedCourseData = (path, code, fieldKey, value) => {
        setModifiedCourseData(produce((draft) => {
            if (draft[code]) draft[code][fieldKey] = value;
        }));
    };


    const addChangedSection = ([code], rawLetter) => {
        const letter = sanitizeInput(rawLetter);
        if (!letter || modifiedCourseData?.[code]?.schedule?.[letter]) return;
        setModifiedCourseData(produce((draft) => {
            draft[code].schedule[letter] = emptySectionOverride(letter);
        }));
    };


    const removeChangedSection = ([code], letter) => {
        setModifiedCourseData(produce((draft) => {
            if (draft[code]?.schedule) delete draft[code].schedule[letter];
        }));
    };


    const updateSectionField = ([code], letter, fieldKey, value) => {
        setModifiedCourseData(
            produce((draft) => {
                draft[code].schedule[letter][fieldKey] = value;
        }));
    };


    const addChangedClass = ([code, letter,], rawClassName) => {
        const className = sanitizeInput(rawClassName);
        if (!className || 
            modifiedCourseData[code]?.schedule?.[letter]?.classes?.[className]) return;
        setModifiedCourseData(produce((draft) => {
            draft[code].schedule[letter].classes[className] = emptyClassOverride(className)
        }));
    };


    const removeChangedClass = ([code, letter], className) => {
        setModifiedCourseData(produce((draft) => {
            if (draft[code]?.schedule?.[letter]?.classes) 
                delete draft[code].schedule[letter].classes[className];
        }));
    };


    const updateChangedClass = ([code, letter], className, fieldKey, value) => {
        setModifiedCourseData(produce((draft) => {
            draft[code].schedule[letter].classes[className][fieldKey] = value;
        }));
    };


    const addChangedSession = ([code, letter, className], rawWeekday) => {
        const weekday = sanitizeInput(rawWeekday);
        const currClass = modifiedCourseData[code]?.schedule?.[letter]?.classes?.[className];
        if (!weekday || currClass?.timeslot?.[weekday]) return;
        setModifiedCourseData(produce((draft) => {
            draft[code].schedule[letter].classes[className].timeslot[weekday] 
                = emptySessionOverride(weekday);
        }));
    };


    const removeChangedClassSession = ([code, letter, className], weekday) => {
        setModifiedCourseData(produce((draft) => {
            delete draft[code].schedule[letter].classes[className].timeslot[weekday];
        }));
    };


    const updateChangedClassSession = ([code, letter, className], weekday, 
                                        fieldKey, value) => {
        setModifiedCourseData(produce((draft) => {
            draft[code].schedule[letter].classes[className].timeslot[weekday]
                [fieldKey] = value;
        }));
    }


    // setting a preferred campus---------------------------------------------------
	const toggleCampus = (campus) => {
		setPinnedCampuses((prev) => {
			return (
				prev.includes(campus) ?
				prev.filter((c) => c !== campus) : [...prev, campus]
			);
		});
	};

    // logic for adding/moving objectives in ConfigPanel------------------------

	const moveObjective = (index, direction) => {
		const list = objectivePriority
		const target = index + direction;
		if (target < 0 || target >= list.length) return;
		const next = [...list];
		[next[index], next[target]] = [next[target], next[index]];
		setObjectivePriority(next);
	};


	const addObjective = (objective) => {
		if (objectivePriority.includes(objective)) return;
		setObjectivePriority((prev) => ([...prev, objective]));
	};


	const removeObjective = (objective) => {
		setObjectivePriority((prev) => (prev.filter((o) => o !== objective)));
	};

    // Formatting useState vars to send to backend------------------------------

    const buildPinnedSectionsClassesTerms = () => {
        produce(({}, draft) => {
            for (const [courseCode, data] of Object.entries(pinnedCourseParts)) {
                if (data.terms.length === 0 && data.sections.length === 0) continue
                draft[courseCode] = {};

                draft[courseCode]["terms"] = data.terms || [];

                if (data.sections.length)
                    for (const [sectionLetter, classObj] of Object.
                                                    entries(data.sections)) {
                    draft[courseCode]["section classes"] = Object.keys(classObj) || [];
                }
            }
        });
    };


    const cleanEmptyNodes = (object) => {
        if (typeof object !== "object" || object === null) return object;

        const result = Array.isArray(object) ? [] : {};
        for (const [key, value] of Object.entries(object)) {
            if (value === "" || value === null || value === undefined) continue;

            if (key === "prereq" && typeof value === "string") {
                const prereqs = val.split(",").map((s) => s.trim()).filter(Boolean);
                if (prereqs.length > 0) {
                    cleaned[key] = prereqs;
                    continue;
                }
            }

            if (typeof value === "object") {
                const nestedCleanedObject = cleanEmptyNodes(value);
                if (Object.keys(nestedCleanedObject).length > 0)
                    result[key] = nestedCleanedObject
            } else res[key] = value;
        }

        return result;
    }


    const buildPayload = () => ({
        "courses": {
            "possible courses": possibleCourses,
            "pinned section classes terms": buildPinnedSectionsClassesTerms,
            "pinned courses": pinnedCourses,
            "changed course data": cleanEmptyNodes(modifiedCourseData)
		},

		preferences: {
			"personal times": personalTimes,
			"pin campus": pinnedCampuses,
			"max courses per term": maxCoursesPerTerm,
			"required num reviews": requiredNumReviews,
			"default RMP score": defaultRMPScore
		},

		goals: {
			"objective priority": objectivePriority,
			"commute times": commuteTimes

        }
    });

    return {
        possibleCourses, setPossibleCourses,
        pinnedCourses, setPinnedCourses,
        pinnedCourseParts, setPinnedCourseParts,
        modifiedCourseData, setModifiedCourseData,

        pinnedCampuses, setPinnedCampuses,
        maxCoursesPerTerm, setMaxCoursesPerTerm,
        requiredNumReviews, setRequiredNumReviews,
        defaultRMPScore, setDefaultRMPScore,
        personalTimes, setPersonalTimes,

        objectivePriority, setObjectivePriority,
        commuteTimes, setCommuteTimes,

        scheduleResult, setScheduleResult,
        scheduleError, setScheduleError,

        addCourses, removeCourse,
        addPinnedTerm, addPinnedSectionLetter, addPinnedClassName,
        removePinnedCoursePart,

        addModifiedCourseData, removeModifiedCourseData, updateModifiedCourseData,
        addChangedSection, removeChangedSection, updateSectionField,
        addChangedClass, removeChangedClass, updateChangedClass,
        addChangedSession, removeChangedClassSession, updateChangedClassSession,

        toggleCampus,
        moveObjective, addObjective, removeObjective,

        buildPayload
    };
}