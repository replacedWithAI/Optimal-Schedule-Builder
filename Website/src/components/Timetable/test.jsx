import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './plotTimetable.css';

export default function FetchSchedule( {requestedCourses = []} ) {
	const [events, setEvents] = useState([
		{
			id: "Meeting1",
			resourceId: "1",
			start: "2018-01-11T10:00:00",
			end: "2018-01-11T12:00:00",
			title: "Meeting"
		}
	]);

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

			const newEvents = /*content.events ||*/ [];
			setEvents((prevEvents) => [...prevEvents, ...newEvents]);
		} catch (error) {
			console.log(`Error: ${error}`);
			return;
		}
	};

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