import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './plotTimetable.css';

export default function FetchSchedule( {requestedCourses = []} ) {
	const [events, setEvents] = useState([]);

	const plotSchedule = async () => {
		try {
			const apiURL = new URL(import.meta.env.VITE_azureURL);

			requestedCourses.forEach(course => apiURL.searchParams.append("tags", course));
			const dictionary = Object.fromEntries(requestedCourses); //idk how I'm formating this yet
			
			const response = await fetch(apiURL, {
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
					//"Authorization": Not done yet
				},
				body: JSON.stringify( {dictionary} )	
			});

			if (!response.ok) {
				console.error(`API access error; status ${response.status}`);
				//decide error handling without crashing; idk how
				return;
			}

			const content = await response.json();
			console.log(`API output: ${JSON.stringify(content)}`);

			const newEvents = processCourseTimes(content) || [];
			setEvents((prevEvents) => [...prevEvents, ...newEvents]);
		} catch (error) {
			console.log(`Error: ${error}`);
			return;
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

	const handleDateClick = () => {

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
					selectable={true} // enables blocking off times
					initialDate="2018-01-11" // fix timetable for one day
					schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
					
					events={events}
					dateClick={handleDateClick} // handles logic of selectable
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
				/>

				<button id="plot-timetable-btn" onClick={plotSchedule}>
					Generate schedule
				</button>
			</div>
		</div>
	);
}