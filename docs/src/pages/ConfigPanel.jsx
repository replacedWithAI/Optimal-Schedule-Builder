import { useState } from "react";
import "./ConfigPanel.css";

const CAMPUSES = ["Keele", "Glendon", "Markham"];
const OBJECTIVES = ["minimal dead times", "best rated profs"];

/** A panel for setting all json strings found in payload_format.md */
export default function ConfigPanel() {
	const [isBasicMode, setBasicMode] = useState("Basic Mode");

    // courses------------------------------------------------------------------
    const [possibleCourses, setPossibleCourses] = useState({"possible courses": []});
    const [pinnedCourses, setPinnedCourseParts] = useState({"pinned courses": []});
	const [coursePlaceholder, setCoursePlaceholder] = useState("");
    // const [pinnedCourseParts, setPinnedCourseParts] = useState({"pinned sections \
    //                                                         classes terms": {}});
    // const [modifiedCourseData, setModifiedCourseData] = useState({"changed course \
    //                                                             data": {}});

    // preferences--------------------------------------------------------------
    const [personalTimes, setPersonalTimes] = useState({"personal times": {}});
    const [pinnedCampuses, setPinnedCampuses] = useState({"pinned campuses": []});
    const [maxCoursesPerTerm, setMaxCoursesPerTerm] = useState({"max courses per \
                                                                term": 8});
    const [requiredNumReviews, setRequiredNumReviews] = useState({"required num \
                                                                reviews": null});
    const [defaultRMPScore, setDefaultRMPScore] = useState({"default RMP score": 2.0});

    // goals--------------------------------------------------------------------
    const [objectivePriority, setObjectivePriority] = useState({"objective priority": 
																[]});
    const [commuteTimes, setCommuteTimes] = useState({"commute times": 0});

	const availableObjectives = OBJECTIVES.filter((objective) =>
		!objectivePriority["objective priority"].includes(objective));


	const addCourse = (course, placeholder, setCourse, setPlaceholder) => {
		const trimmed = placeholder.trim().toUpperCase();
		if (!trimmed || value.includes(trimmed)) {
			setPlaceholder('');
			return;
		}
		setValue([...list, trimmed]);
		setPlaceholder('');
	};
 

	const removeChip = (course, setCourse, placeholder) => {
		setCourse(list.filter((item) => item !== list));
	};
 

	const toggleCampus = (campus) => {
		setPinnedCampuses((prev) => {
				return (
					{"pinned campuses": (
					prev["pinned campuses"].includes(campus) ?
					prev["pinned campuses"].filter((c) => c !== campus) : 
					[...prev["pinned campuses"], campus]
					)}
				);
			}
		);
	};
 

	const moveObjective = (index, direction) => {
		const list = objectivePriority["objective priority"]
		const target = index + direction;
		if (target < 0 || target >= list.length) return;
		const next = [...list];
		[next[index], next[target]] = [next[target], next[index]];
		setObjectivePriority({"objective priority": next});
	};


	const addObjective = (objective) => {
		if (objectivePriority["objective priority"].includes(objective)) return;
		setObjectivePriority((prev) => ({"objective priority": 
								([...prev["objective priority"], objective])}
		));
	};
 

	const removeObjective = (objective) => {
		setObjectivePriority((prev) => ({"objective priority": 
			prev["objective priority"].filter((o) => o !== objective)}));
	};

	
	const CourseInputSection = ({inputType, label, placeholder, value, onChange, 
							   	 onEnter}) => {
		return (
			<div className="course-input-area">
				<label className="config-label" htmlFor={`${inputType}input`}>
					{label}
				</label>
				<div className={`${inputType}-input`}>
					<textarea
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
				<p className="config-label">{value?.length} {inputType} courses added</p>
			</div>
		);
	}


	const PreferenceGoalIntegerInput = ({id, label, type, value, onChange, min, 
										 max, step}) => {
		return (
			<div>
				<label className="config-label" htmlFor={id}>{label}</label>
				<input
					id={id}
					type="number"
					value={value}
					onChange={(e) => {
						onChange(Number(e.target.value));
					}}
					min={min}
					max={max}
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


	return (
		<aside className="config-panel">
			<div className="config-panel-scroll">
				<input 
					className="config-complexity-button"
					type="checkbox" checked
					onClick={(basicMode) => {
						if (basicMode === "Basic Mode") setBasicMode("Advanced Mode");
						else (setBasicMode("Basic Mode"));
					}}
				/>
					{isBasicMode}
					<span className="round-slider"></span>

				<section className="config-section">
					<p className="config-heading">Courses</p>
				
					<CourseInputSection
						inputType="possible"
						label="Enter courses"
						placeholder={coursePlaceholder}
						value={possibleCourses}
						onChange={(e) => setPossibleCourses(e.target.value)}
						onEnter={() => {
							addCourses(pinnedCourses, setPinnedCourses,
										coursePlaceholder, setCoursePlaceholder
							)
						}}
					/>

					<CourseInputSection
						inputType="pinned"
						label="Courses to guarantee a spot for"
						placeholder={coursePlaceholder}
						value={pinnedCourses}
						onChange={(e) => setPinnedCourses(e.target.value)}
						onEnter={() => {
							addCourses(pinnedCourses, setPinnedCourses,
										coursePlaceholder, setCoursePlaceholder
							)
						}}
					/>

					{/* rest of this section is WIP */}
					<label className="config-label">Section, class &amp; term pins</label>
					<p className="config-hint">
						Once a course is added above, its sections and terms can be locked in here.
					</p>
					<button
						type="button"
						className="config-secondary-btn"
						disabled={possibleCourses.length === 0}
					>
						Configure pins per course
					</button>

					<label className="config-label">Overrides for scraped course data</label>
					<p className="config-hint">
						For fixing a wrong lecture time or professor name pulled from the scraper.
					</p>
					<button type="button" className="config-secondary-btn">
						Open advanced overrides
					</button>

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
											${pinnedCampuses["pinned campuses"]
											.includes(campus) ?
											"pill-active" : ""}`}
								onClick={toggleCampus}
							>
								{campus}
							</button>
						))}
					</div>
					
					<PreferenceGoalIntegerInput
						id="max-courses-per-term-input"
						label="Max courses per term"
						type="number"
						value={maxCoursesPerTerm}
						onChange={setMaxCoursesPerTerm}
						min={1}
						max={8}
					/>

					<PreferenceGoalIntegerInput
						id="required-reviews-input"
						label="Min reviews before trusting a rating"
						type="number"
						value={requiredNumReviews}
						onChange={setRequiredNumReviews}
						min={0}
					/>

					<PreferenceGoalIntegerInput
						id="default-RMP-input"
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
					{objectivePriority["objective priority"].length === 0 &&
					<p className="config-hint">
						No objectives are added. Defaults to solving minimal
						dead times
					</p>
					}

					<ol className="objective-list">
						{objectivePriority["objective priority"].map((objective, index) => (
							<li className="objective-card" key={objective}>

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
											["objective priority"].length-1}
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
						label="Commute times (in minutes)"
						type="number"
						value={commuteTimes}
						onChange={setCommuteTimes}
						min={0}
						max={1440}
					/>
				</section>
			</div>
		</aside>
	);
}
