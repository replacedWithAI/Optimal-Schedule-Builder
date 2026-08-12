import { useState } from "react";
import ToggleFieldList from "./ToggleFieldList.jsx";
import "./ConfigPanel.css";

const CAMPUSES = ["Keele", "Glendon", "Markham"];
const OBJECTIVES = ["minimal dead times", "best rated profs"];
const COURSE_OVERRIDE_FIELDS = [
        { key: "faculty", label: "Faculty" },
        { key: "dept", label: "Department" },
        { key: "code", label: "Course number" },
        { key: "credit", label: "Credits" },
        { key: "name", label: "Course name" },
        { key: "prereq", label: "Prerequisites" }
    ];

const SECTION_OVERRIDE_FIELDS = [
	{ key: "term", label: "Term" },
	{ key: "section", label: "Section letter" },
	{ key: "professor", label: "Professor" },
];

const CLASS_OVERRIDE_FIELDS = [{ key: "name", label: "Class name" }];

const SESSION_OVERRIDE_FIELDS = [
	{ key: "weekday", label: "Weekday (M/T/W/R/F)" },
	{ key: "time (24:00)", label: "Time" },
	{ key: "duration", label: "Duration (min)" },
	{ key: "campus", label: "Campus" }
];

/** A panel for setting all json strings found in payload_format.md */
export default function ConfigPanel({functionsAndUseStates}) {
	const {
		possibleCourses, setPossibleCourses,
		pinnedCourses, setPinnedCourses,
		pinnedCourseParts, setPinnedCourseParts,
        modifiedCourseData, setModifiedCourseData,

        pinnedCampuses, setPinnedCampuses,
        maxCoursesPerTerm, setMaxCoursesPerTerm,
        requiredNumReviews, setRequiredNumReviews,
        defaultRMPScore, setDefaultRMPScore,
 
		objectivePriority, setObjectivePriority,
        commuteTimes, setCommuteTimes,

		addCourses, removeCourse, 

        addModifiedCourseData, removeModifiedCourseData, updateModifiedCourseData,
        addChangedSection, removeChangedSection, updateSectionField,
        addChangedClass, removeChangedClass, updateChangedClass,
        addChangedSession, removeChangedClassSession, updateChangedClassSession,

        toggleCampus,
        moveObjective, addObjective, removeObjective
	} = functionsAndUseStates;

	const [isBasicMode, setBasicMode] = useState("Basic Mode");
	const [possibleCourseDraft, setPossibleCourseDraft] = useState("");
    const [pinnedCourseDraft, setPinnedCourseDraft] = useState("")


	const availableObjectives = OBJECTIVES.filter((objective) =>
		!objectivePriority.includes(objective));

	return (
		<div className="config-panel">
			<div className="config-scroll-panel">
				<label className="config-complexity-wrapper">
					<input 
						className="config-complexity-button"
						type="checkbox" 
						checked={isBasicMode === "Basic Mode"}
						onChange={() => {
							if (isBasicMode === "Basic Mode") 
								setBasicMode("Advanced Mode");
							else (setBasicMode("Basic Mode"));
						}}
					/>
						
					<span className="round-slider"></span>
					<span className="toggle-label">{isBasicMode}</span>
				</label>

				<section className="config-section">
					<p className="config-heading">Courses</p>
				
					<CourseInputSection
						inputType="possible"
						label="Enter courses"
						placeholder="e.g. Separated by newlines; EECS 1021"
						value={possibleCourseDraft}
						onChange={(e) => setPossibleCourseDraft(e.target.value)}
						onEnter={() => {
							addCourses(possibleCourses, setPossibleCourses, 
										possibleCourseDraft, setPossibleCourseDraft
							)
						}}
						count={possibleCourses?.length}
					/>

					<CourseInputSection
						inputType="pinned"
						label="Courses to guarantee a spot for"
						placeholder="e.g. Separated by newlines; MATH 2015"
						value={pinnedCourseDraft}
						onChange={(e) => setPinnedCourseDraft(e.target.value)}
						onEnter={() => {
							addCourses(pinnedCourses, setPinnedCourses, 
										pinnedCourseDraft, setPinnedCourseDraft
							)
						}}
						count={pinnedCourses?.length}
					/>

					<p className="config-hint">
						Pin specific sections, classes, or terms from the course
						list panel on the right →
					</p>

					<label className="config-label">Overrides for scraped course data</label>
					<p className="config-hint">
						For fixing a wrong lecture time or professor name pulled
						from the scraper. Type a course code, press enter, then
						click to edit it.
					</p>
					
					<ToggleFieldList
						entries={modifiedCourseData}
						fields={COURSE_OVERRIDE_FIELDS}
						onAdd={addModifiedCourseData}
						onRemove={removeModifiedCourseData}
						onFieldChange={updateModifiedCourseData}
						addPlaceholder="Course code, e.g. MATH 1014"
						nested={{
							label: "Schedule (sections)",
							addPlaceholder: "Section letter, e.g. A",
							getEntries: (course) => course.schedule,
							onAdd: addChangedSection,
							onRemove: removeChangedSection,
							onFieldChange: updateSectionField,
							fields: SECTION_OVERRIDE_FIELDS,
							nested: {
								label: "Classes",
								addPlaceholder: "Class name, e.g. LECT 01",
								getEntries: (section) => section.classes,
								onAdd: addChangedClass,
								onRemove: removeChangedClass,
								onFieldChange: updateChangedClass,
								fields: CLASS_OVERRIDE_FIELDS,
								nested: {
									label: "Sessions",
									addPlaceholder: "Weekday, e.g. M",
									getEntries: (curClass) => curClass.timeslot,
									onAdd: addChangedSession,
									onRemove: removeChangedClassSession,
									onFieldChange: updateChangedClassSession,
									fields: SESSION_OVERRIDE_FIELDS,
									nested: null
								}
							}
						}}
					/>

				</section>

				<div className="section-divider"/>

				<section className="config-section">
					<p className="config-heading">Preferences</p>

					<label className="config-label">Busy/personal times</label>
					<p className="config-hint">
						Drag on the calendar to block off times
					</p>

					<label className="config-label">Preferred campus</label>
					<div className="pill-group">
						{CAMPUSES.map((campus) => (
							<button
								type="button"
								key={campus}
								className={`pill 
											${pinnedCampuses
											.includes(campus) ?
											"pill-active" : ""}`}
								onClick={() => toggleCampus(campus)}
							>
								{campus}
							</button>
						))}
					</div>
					
					<PreferenceGoalIntegerInput
						id="max-courses-per-term-input"
						className="config-number"
						label="Max courses per term"
						type="number"
						value={maxCoursesPerTerm}
						onChange={setMaxCoursesPerTerm}
						min={1}
						max={8}
					/>

					<PreferenceGoalIntegerInput
						id="required-reviews-input"
						className="PreferenceGoalIntegerInput"
						label="Min reviews before trusting a rating"
						type="number"
						value={requiredNumReviews}
						onChange={setRequiredNumReviews}
						min={0}
					/>

					<PreferenceGoalIntegerInput
						id="default-RMP-input"
						className="config-slider"
						label="Default rating for unknown professors"
						type="range"
						value={defaultRMPScore}
						onChange={setDefaultRMPScore}
						min={0}
						max={5}
						step={0.1}
					/>
				</section>

				<div className="config-divider" />

				<section className="config-section">
					<p className="config-heading"></p>

					<label className="config-label">Objective priority</label>
					{objectivePriority.length === 0 &&
					<p className="config-hint">
						No objectives are added. Defaults to solving minimal
						dead times
					</p>
					}

					<ol className="objective-list">
						{objectivePriority.map((objective, index) => (
							<li className="objective-item" key={objective}>

								<span className="objective-rank">
									{index + 1}
								</span>

								<span className="objective-name">
									{objective}
								</span>

								<span className="objective-controls">

									<MoveObjectiveButton
										type="button"
										onClick={() => moveObjective(index, -1)}
										aria-label="Move up"
										label="↑"
										disabled={index === 0}
									/>

									<MoveObjectiveButton
										type="button"
										onClick={() => moveObjective(index, 1)}
										aria-label="Move down"
										label="↓"
										disabled={index === objectivePriority
											.length-1}
									/>

									<MoveObjectiveButton
										type="button"
										onClick={() => removeObjective(objective)}
										aria-label={`Remove ${objective}`}
										label="×"
									/>
								</span>
							</li>
						))}
					</ol>

					{availableObjectives.length > 0 && (
						<div className="add-objectives-list">
							{availableObjectives.map((objective) => (
								<button
									type="button"
									key={objective}
									className="add-objective-button"
									onClick={() => addObjective(objective)}
								>+ {objective}</button>
							))}
						</div>
					)}

					<PreferenceGoalIntegerInput
						id="commute-times-input"
						className="config-number"
						label="Commute times (in minutes)"
						type="number"
						value={commuteTimes}
						onChange={setCommuteTimes}
						min={0}
						max={1440}
					/>
				</section>
			</div>
		</div>
	);
}

    const CourseInputSection = ({inputType, label, placeholder, value, onChange, 
								onEnter, count}) => {
	return (
		<div>
			<label className="config-label" htmlFor={`${inputType}-input`}>
				{label}
			</label>
			<div className={"course-input-area"}>
				<textarea
					id={`${inputType}-input`}
					placeholder={placeholder}
					value={value}
					onChange={onChange}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							onEnter();
						}
					}}
				/>
			</div>
			<p className="config-label">{count} {inputType} courses added</p>
		</div>
	);
}


const PreferenceGoalIntegerInput = ({id, className, label, type, value, 
									onChange, min, max, step}) => {
	return (
		<div>
			<label className="config-label" htmlFor={id}>{label}</label>
			<input
				id={id}
				className={className}
				type={type}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				min={min}
				max={max}
				step={step}
			/>
		</div>
	);
}


const MoveObjectiveButton = ({type, onClick, ariaLabel, label, disabled}) => {
	return(
		<button
			type={type}
			onClick={onClick}
			aria-label={ariaLabel}
			disabled={disabled}
		>{label}</button>
	);
}