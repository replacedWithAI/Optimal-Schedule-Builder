import { useState } from "react";
import PinCoursePartsButton from "./PinCoursePartsButton.jsx";
import MultiSelectDropdown from "./MultiSelectDropdown.jsx";
import ToggleFieldList from "./ToggleFieldList.jsx";
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
        touched, onTouch, onUntouch,
        
        validSection, validClass,
        removeCourse, 
        addPinnedTerm, addPinnedSectionLetter, addPinnedClassName,
        removePinnedCoursePart,
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
                                                addPinnedTerm(course, value);
                                            }
                                        }}
                                    />

                                    <PinCoursePartsButton
                                        label="Sections & classes"
                                        badge={Object.keys(pinnedCourseParts?.[course]
                                                ?.sections ?? {}).length}
                                    >
                                        <ToggleFieldList
                                            entries={pinnedCourseParts?.[course]
                                                     ?.sections ?? {}}
                                            fields={[]}
                                            onAdd={(path, letter) => 
                                                addPinnedSectionLetter(course, 
                                                                       letter)}
                                            onRemove={(path, letter) => 
                                                removePinnedCoursePart(course, 
                                                                       letter, 
                                                                       ["sections"])}
                                            onFieldChange={() =>{}}
                                            addPlaceholder={"Section letter, e.g. A"}
                                            touched={touched}
                                            onTouch={onTouch}
                                            onUntouch={onUntouch}
                                            nested={{
                                                label: "Classes",
                                                addPlaceholder: "Class name, e.g."
                                                                 +" LECT 01",
                                                getEntries: (section) => section 
                                                                         ?? {},
                                                onAdd: (path, className) => 
                                                    addPinnedClassName(course, 
                                                                       path[0], 
                                                                       className),
                                                onRemove: (sectionLetter, className) => 
                                                    removePinnedCoursePart(course,
                                                                          className,
                                                                          ["sections", 
                                                                           sectionLetter]),
                                                onFieldChange: () => {},
                                                fields: [],
                                                nested: null
                                            }}
                                        />
                                    </PinCoursePartsButton>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
}