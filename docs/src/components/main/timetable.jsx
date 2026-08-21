import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { authHeader } from '../../api/authToken.js';
import './timetable.css';

export default function FetchSchedule( {functionsAndUseStates} ) {
	const {setPersonalTimes, scheduleError, 
		setScheduleError, buildPayload} = functionsAndUseStates;

	const [events, setEvents] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const busyTimes = useRef({});

	const plotSchedule = async () => {
		
		setIsLoading(true);
		setScheduleError(null);
		try {

			payload = buildPayload()
			console.log(payload)
			const apiURL = new URL(`${import.meta.env.VITE_API_URL}/calculate`);

			const response = await fetch(apiURL, {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					...authHeader()
				},
				body: JSON.stringify( payload )	
			});

			if (!response.ok) {
				console.error(`API access error; status ${response.status}`);
				setScheduleError(`Request failed; status ${response.status}`)
				return;
			}

			const {courses, logs} = await response.json();
			const newEvents = processCourseTimes(courses) || [];
			console.log(logs);
			setEvents((prevEvents) => [...prevEvents, ...newEvents]);

			if (newEvents === []) setScheduleError("Couldn't make a possible schedule");
		} catch (error) {
			console.log(`Error: ${error}`);
			setScheduleError(error.message ?? String(error));
		} finally {
			setIsLoading(false);
		}
	};

	const processCourseTimes = (content) => {
		const processedCourseTimes = [];
		const baseDate = "2018-01-11";
		const courses = content["courses"];
		const COLOURS = ["#E27D7D", "#E2957D", "#E2AD7D", "#E2C57D",
						 "#D8E27D", "#C0E27D", "#A8E27D", "#7DE29D",
						 "#7DE2E2", "#7DC0E2", "#7DA8E2", "#8C7DE2",
						 "#A87DE2", "#C07DE2", "#D87DE2", "#E27DC0"
		];
		let colourIndex = 0;

		courses.forEach((course) => {
			const [courseCode, classes] = Object.entries(course)[0]; // size 1 array

			classes.forEach((currClass) => {
				const [className, classSessions] = Object.entries(currClass)[0]; // size 1
				const startTimes = classSessions["start"];
				const endTimes = classSessions["end"];

				for (let i = 0; i < startTimes.length; i++) {
					const startTime = startTimes[i];
					const endTime = endTimes[i];

					const day = ( Math.floor(startTime / 1440) ).toString();

					const startTimeForDay = startTime % 1440;
					const startTimeDayHour = ( Math.floor(startTimeForDay / 60)) 
												.toString().padStart(2, '0');
					const startTimeDayMins = ( startTimeForDay % 60 )
												.toString().padStart(2, '0');
					// in case hours or minutes are single digit
					
					const endTimeForDay = endTime % 1440;
					const endTimeDayHour = ( Math.floor(endTimeForDay / 60)) 
												.toString().padStart(2, '0');
					const endTimeDayMins = ( endTimeForDay % 60 )
												.toString().padStart(2, '0');
					
					processedCourseTimes.push({
						id: `${courseCode} ${className} ${i}`,
						resourceId: `${day}`,
						start: `${baseDate}T${startTimeDayHour}:${startTimeDayMins}:00`,
						end: `${baseDate}T${endTimeDayHour}:${endTimeDayMins}:00`,
						title: `${courseCode} ${className}`,
						backgroundColor: `${COLOURS[colourIndex++]}`
					});

					if (colourIndex === 15) colourIndex = 0;
				}
			});
		});

		return processedCourseTimes;
	}

	const handleSelectClick = (cellInfo) => {
		const targetDay = cellInfo.resource.id;
		const newBusyTime = {
			id: `selected-${Math.random().toString(36).substring(2, 7)}`,
			start: cellInfo.startStr,
			end: cellInfo.endStr,
			resourceId: targetDay,
			backgroundColor: "#888888",
			title: "Busy",
			extendedProps: {
				isSelectionBlock: true
			}
		}

		setEvents((prevEvents) => {
			const updatedEvents = [...prevEvents, newBusyTime];
			return recalculateBusyTimes(updatedEvents, targetDay);
		});

		cellInfo.view.calendar.unselect(); // try comment out
		console.log("Made a busy time");
	};


	const toMinutes = (dateStr) => {
		const date = new Date(dateStr);
		return date.getHours()*60 + date.getMinutes();
	};

	const handleEventClick = (eventInfo) => {
		if (eventInfo.event.extendedProps.isSelectionBlock) {
			const targetId = eventInfo.event.id;
			setEvents((prevEvents) => {
				const targetEvent = prevEvents.find((e) => e.id === targetId);

				const targetDay = targetEvent?.resourceId 
				const updatedEvents = prevEvents.filter((e) => e.id !== targetId);
				return recalculateBusyTimes(updatedEvents, targetDay);
			});
			console.log("Deleted a busy time");
		} else {
			console.log("Selected a class session event");
		}
	};


	const recalculateBusyTimes = (updatedEvents, targetDay) => {
		const otherEvents = updatedEvents.filter(
			(e) => !(e.extendedProps?.isSelectionBlock && e.resourceId === targetDay)
		);
		const todayBusys = updatedEvents.filter(
			(e) => e.extendedProps?.isSelectionBlock && e.resourceId === targetDay
		);
		

		if (todayBusys.length === 0) {
			delete busyTimes.current[targetDay];
			setPersonalTimes?.({...busyTimes.current});
			console.log(`Deleted busy times for day: ${targetDay}`);
			return otherEvents;
		}

		todayBusys.sort((a, b) => new Date(a.start) - new Date(b.start));
		const mergedBusys = [];
		let currBusy = {...todayBusys[0]} // needs dict spread because object items

		for (let i = 1; i < todayBusys.length; i++) {
			const nextBusy = todayBusys[i];

			if (new Date(nextBusy.start) <= new Date(currBusy.end)) {
				if (new Date(nextBusy.end) > new Date(currBusy.end)) {
					currBusy.end = nextBusy.end;
				}
			} else {
				mergedBusys.push(currBusy);
				currBusy = {...nextBusy};
			}
		}
		mergedBusys.push(currBusy);

		busyTimes.current[targetDay] = mergedBusys.map((busyTime) => 
			[toMinutes(busyTime.start), toMinutes(busyTime.end)]);
		
		setPersonalTimes?.({...busyTimes.current[targetDay]});
		console.log(`Updated busy times for day ${targetDay}:`, busyTimes.current);
		return [...otherEvents, ...mergedBusys];
	};

	const syncWidth = () => {
		const axis = document.querySelector(".fc-timegrid-axis");
		if (axis) {
			const width = axis.getBoundingClientRect().width;
			document.documentElement.style.setProperty("--time-axis-width", `${width}px`);
		}
	};
	return (
		<div className="timetable-container">
			<div className="term-rows">
				<div className="time-column"></div>
				<div className="term1-row">Term 1</div>
				<div className="term2-row">Term 2</div>
			</div>

			<div className="schedule-container">
				<FullCalendar
					plugins={[resourceTimeGridPlugin, interactionPlugin]} //downloaded features
					initialView="resourceTimeGridDay" //timetable design/format
					headerToolbar={false}
					allDaySlot={false}
					slotMinTime="07:00:00"
					slotMaxTime="23:00:00"
					initialDate="2018-01-11" // fix timetable to one day
					selectable={true} // enables blocking off times
					selectMirror={true} // let user see blocked off times
					slotDuration="00:30:00" // divide table into 30 minute cells
					datesSet={syncWidth}
					height="auto"
					
					select={handleSelectClick}
					eventClick={handleEventClick}

					events={events}
					resources={[
						{ id: "0", title: "Mon" },
						{ id: "1", title: "Tue" },
						{ id: "2", title: "Wed" },
						{ id: "3", title: "Thu" },
						{ id: "4", title: "Fri" },
						{ id: "5", title: "Mon" },
						{ id: "6", title: "Tue" },
						{ id: "7", title: "Wed" },
						{ id: "8", title: "Thu" },
						{ id: "9", title: "Fri" }
					]}
					schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
				/>
				<div className="loading-wrapper">
					<button 
						id="plot-timetable-button" 
						onClick={plotSchedule}
						disabled={isLoading}
					>
						{isLoading ? "Loading..." : "Generate schedule"}
					</button>

					{isLoading && 
					<span className="loading-message">
						Loading timetable...
					</span>}
				</div>
			</div>
		</div>
	);
}
