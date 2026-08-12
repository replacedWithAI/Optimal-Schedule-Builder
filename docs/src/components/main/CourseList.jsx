import { useState } from "react";
import PinCoursePartsButton from "./PinCoursePartsButton.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import "./CourseList.css";

const TERM_OPTIONS = [
    {value: "", label: "Terms"},
	{value: "F", label: "Semester 1"},
	{value: "W", label: "Semester 2"},
	{value: "Y", label: "Both" }
];

/**
 * A panel to display all types of added courses, like possible courses, 
 * pinned courses
 */
export default function CourseList({functionsAndUseStates}) {
    const {
        possibleCourses, setPossibleCourses,
        pinnedCourses, setPinnedCourses,
        pinnedCourseParts,
        
        removeCourse, addPinnedCoursePart, removePinnedCoursePart,
    } = functionsAndUseStates;

    const [activeTab, setActiveTab] = useState("all");

    const tabs = [
        {
            "id": "all", 
            "label": "All",
            "value": possibleCourses,
            "setter": setPossibleCourses,
            "empty": "Add courses from the panel on the left. They'll show up here."
        },
        {
            "id": "pinned", 
            "label": "Pinned",
            "value": pinnedCourses,
            "setter": setPinnedCourses,
            "empty": "No pinned courses yet"
        }
    ];

    const activeTabObj = tabs.find((tab) => tab.id === activeTab);
    const activeList = activeTabObj.value;
    const activeSetter = activeTabObj.setter;
    const activeEmptyMessage = activeTabObj.empty;
    
    return (
        <div className="course-list-panel">
            <div className="course-tabs">
                {tabs.map((tab) => (
                    <button
                        type="button"
                        key={tab.id}
                        className={`course-list-tab ${activeTab===tab.id ?
                                    "course-list-tab-active" : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className="course-list-tab-count">
                            {tab.value.length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="course-list-wrapper">
                {activeList.length === 0 &&
                (<p className="course-list-empty">{activeEmptyMessage}</p>)}

                <ul className="course-list">
                    {activeList.map((course) => (
                        <li className="course-list-row" key={course}>
                            <div className="course-list-row-main">
                                <span className="course-list-code">{course}</span>
                                {activeTab === "all" 
                                && pinnedCourses.includes(course)
                                && (<span className="course-list-badge">Pinned</span>)}

                                <button
                                    type="button"
                                    className="remove-course-button"
                                    onClick={() => removeCourse(course, activeSetter)}
                                    aria-label={`Remove ${course}`}
                                >x</button>
                            </div>

                            {activeTab === "all" && (
                                <div className="course-parts-pin-controls">
                                    <MultiSelectDropdown
                                        className="course-pin-term-select"
                                        placeholder="Any term"
                                        options={TERM_OPTIONS.filter(
                                            (option) => option.value !== ""
                                        )}
                                        selected={pinnedCourseParts[course]?.terms ?? []}
                                        onToggle={(value) => {
                                            const selectedTerms = pinnedCourseParts
                                                [course]?.terms ?? [];
                                            if (selectedTerms.includes(value)) {
                                                removePinnedCoursePart(course, 
                                                    value, "terms");
                                            } else {
                                                addPinnedCoursePart(course, value,
                                                    "terms");
                                            }
                                        }}
                                    />

                                    <PinCoursePartsButton
                                        label="Sections"
                                        placeholder="e.g. A"
                                        tags={pinnedCourseParts?.[course]
                                                ?.sectionLetters ?? []}
                                        onAdd={(letter) => addPinnedCoursePart(
                                            course,
                                            letter,
                                            "sectionLetters",
                                            (coursePartKey, sanitizedCoursePart) => (
                                                /^[A-Z]$/.test(sanitizedCoursePart)
                                                && sanitizedCoursePart.length === 1
                                            )
                                        )}
                                        onRemove={(letter) => removePinnedCoursePart(
                                            course, letter, "sectionLetters"
                                        )}
                                    />

                                    <PinCoursePartsButton
                                        label="Classes"
                                        placeholder="e.g. LECT 01"
                                        tags={pinnedCourseParts?.[course]
                                            ?.classNames ?? []}
                                        onAdd={(name) => addPinnedCoursePart(
                                            course,
                                            name,
                                            "classNames",
                                            (coursePartKey, sanitizedCoursePart) => {
                                                const spaceIdx = sanitizedCoursePart
                                                    .indexOf(" ")
                                                const classType = sanitizedCoursePart
                                                    .substring(0, spaceIdx);
                                                const classNumber = sanitizedCoursePart
                                                    .substring(spaceIdx+1);

                                                return (/^[A-Z]+$/.test(classType)
                                                && /^\d+$/.test(classNumber) &&
                                                classType.length >= 3 && 
                                                classType.length <= 4 && 
                                                classNumber.length === 2 &&
                                                1 + classType.length +
                                                classNumber.length === 
                                                sanitizedCoursePart.length)
                                        })}
                                        onRemove={(name) => removePinnedCoursePart(
                                            course, name, "classNames"
                                        )}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
}