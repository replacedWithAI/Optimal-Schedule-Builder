import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Required for selectable & dateClick
import './plotTimetable.css'; // We will put your CSS here

export default function fetchSchedule() {
  // 1. Manage your events using React State
  const [events, setEvents] = useState([
    {
      id: "Meeting1",
      resourceId: "1",
      start: "2018-01-11T10:00:00",
      end: "2018-01-11T12:00:00",
      title: "Meeting"/Timetable/test
    }
  ]);

  // 2. The "React Way" to add an event
  const handleGenerateSchedule = () => {
    const newEvent = {
      id: 'EECS-1021-' + Date.now(),
      resourceId: '1',
      title: 'EECS 1021',
      start: '2018-01-11T14:00:00',
      end: '2018-01-11T16:01:00'
    };
    
    // This adds the new event to the existing array, causing the calendar to update
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  // 3. Handle Date Clicks
  const handleDateClick = (info) => {
    alert(`Date: ${info.dateStr}\nResource ID: ${info.resource.id}`);
  };

  return (
    <div className="schedule-wrapper">
      
      {/* Your Custom Flexbox Top Row */}
      <div className="term-rows">
        <div className="time-column"></div>
        <div className="term1-row">Term 1</div>
        <div className="term2-row">Term 2</div>
      </div>  

      {/* The Calendar Container */}
      <div className="calendar-container">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          headerToolbar={true} // Set to false if you still want to hide the top bar
          selectable={true}
          initialDate="2018-01-11"
          schedulerLicenseKey="GPL-My-Project-Is-Open-Source"
          
          // Feed your state and data into the props
          events={events}
          dateClick={handleDateClick}
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
        
        {/* Button triggers the React function instead of a standalone DOM listener */}
        <button id="add-event-btn" onClick={handleGenerateSchedule}>
          Generate schedule
        </button>
      </div>
      
    </div>
  );
}