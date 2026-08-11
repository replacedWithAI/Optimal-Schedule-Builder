import { useState } from "react";
import "./CourseList.css";

const TERM_OPTIONS = [
    {value: "", label: "Any term"},
	{value: "F", label: "Semester 1"},
	{value: "W", label: "Semester 2"},
	{value: "Y", label: "Both" }
];

/**
 * A panel to display all types of added courses, like possible courses, 
 * pinned courses
 */
export default function CourseList({possibleCourses, setPossibleCourses, 
                                    pinnedCourses, setPinnedCourses, 
                                    removeCourse}) {
    const [activeTab, setActiveTab] = useState("possible");

    const tabs = [
        {
            "id": "possible", 
            "label": "possible",
            "value": possibleCourses,
            "setter": setPossibleCourses,
            "empty": "Add courses from the panel on the left. They'll show up here."
        },
        {
            "id": "pinned", 
            "label": "pinned",
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
                            <span className="course-list-code">{course}</span>
                            {activeTab === "possible" 
                            && pinnedCourses.includes(course)
                            && (<span className="course-list-badge">Pinned</span>)}

                            <button
                                type="button"
                                className="remove-course-button"
                                onClick={() => removeCourse(course, activeSetter)}
                                aria-label={`Remove ${course}`}
                            >×</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
    
}