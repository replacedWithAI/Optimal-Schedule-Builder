import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './timetable.css';

export default function FetchSchedule( {functionsAndUseStates} ) {
	const {setPersonalTimes, onResult, onError, buildPayload} = functionsAndUseStates;

	const [events, setEvents] = useState([]);
	const busyTimes = useRef({});

	const plotSchedule = async () => {
		try {
			console.log(buildPayload())
			// const apiURL = new URL(`${import.meta.env.VITE_AZUREURL}/calculate`);
			
			// const response = await fetch(apiURL, {
			// 	method: "POST",
			// 	credentials: "include",
			// 	headers: {
			// 		"Accept": "application/json",
			// 		"Content-Type": "application/json"
			// 		//"Authorization": Not done yet
			// 	},
			// 	body: JSON.stringify( buildPayload() )	
			// });

			// if (!response.ok) {
			// 	console.error(`API access error; status ${response.status}`);
			// 	onError?.(`Request failed; status ${response.status}`)
			// 	return;
			// }

			// const content = await response.json();
			// console.log(`API output: ${JSON.stringify(content)}`);

			// const newEvents = processCourseTimes(content) || [];
			// setEvents((prevEvents) => [...prevEvents, ...newEvents]);
		} catch (error) {
			console.log(`Error: ${error}`);
			onError?.(error.message ?? String(error));
		}
	};

	const processCourseTimes = (content) => {
		const processedCourseTimes = [];
		const baseDate = "2018-01-11";
		const courses = content["courses"]

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
						title: `${courseCode} ${className}`
					});
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
			backgroundColor: '#888888',
			title: "Busy",
			extendedProps: {
				isSelectionBlock: true
			}
		}

		setEvents((prevEvents) => {
			const updatedEvents = [...prevEvents, newBusyTime];
			recalculateBusyTimes(updatedEvents, targetDay);
			return updatedEvents;			
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
				recalculateBusyTimes(updatedEvents, targetDay);
				return updatedEvents;
			});
			console.log("Deleted a busy time");
		} else {
			console.log("Selected a class session event");
		}
	};


	const recalculateBusyTimes = (updatedEvents, targetDay) => {
		const todayBusys = updatedEvents.filter((e) => 
												e.extendedProps?.isSelectionBlock
												&& e.resourceId === targetDay);

		if (todayBusys.length === 0) {
			delete busyTimes.current[targetDay];
			console.log(`Deleted busy times for day: ${targetDay}`);
			return;
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
				mergedBusys.push([toMinutes(currBusy.start), toMinutes(currBusy.end)]);
				currBusy = {...nextBusy};
			}
		}
		mergedBusys.push([toMinutes(currBusy.start), toMinutes(currBusy.end)]);

		busyTimes.current[targetDay] = mergedBusys;
		setPersonalTimes?.({...busyTimes.current});
		console.log(`Updated busy times for day ${targetDay}:`, busyTimes.current);
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
					initialDate="2018-01-11" // fix timetable to one day
					selectable={true} // enables blocking off times
					selectMirror={true} // let user see blocked off times
					slotDuration="00:30:00" // divide table into 30 minute cells
					
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

				<button id="plot-timetable-btn" onClick={plotSchedule}>
					Generate schedule
				</button>
			</div>
		</div>
	);
}

/*
const tryMergeBusy = (todayBusys, otherItems) => {
		todayBusys.sort((a, b) => new Date(a.start) - new Date(b.start));

		const processedBusys = [];
		let currBusy = {...todayBusys[0]};

		let weekdayNumber = todayBusys[0].resourceId;
		busyTimes.current[weekdayNumber] = [];
		
		for (let i = 1; i < todayBusys.length; i++) {
			const nextBusy = todayBusys[i];
			
			const overlaps = new Date(nextBusy.start) <= new Date(currBusy.end); 
			if (overlaps) {
				const isSubset = new Date(nextBusy.end) < new Date(currBusy.end);
				currBusy.end = isSubset ? currBusy.end : nextBusy.end;
			} else {
				processedBusys.push(currBusy);
				busyTimes.current[weekdayNumber].push([
														toMinutes(currBusy.start),
														toMinutes(currBusy.end)
													  ]);

				currBusy = {...nextBusy};
			}
		}
		processedBusys.push(currBusy);
		busyTimes.current[weekdayNumber].push([
										toMinutes(currBusy.start),
										toMinutes(currBusy.end)
										]);

		console.log(busyTimes);
		
		return [...otherItems, ...processedBusys];
	}
		*/