import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { styled } from '@mui/system'; // Corrección aquí
import { Box } from '@mui/material'; // Utiliza Box para envolver el contenido

// Define a CalendarContainer styled component
const CalendarContainer = styled(Box)` // Usa Box de MUI System
  width: 100%;
  height: 80vh; /* Adjust the height as needed */
  border-radius: 8px;
  overflow: auto;
`;

const MyCustomCalendar = ({ events }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [year, setYear] = useState(selectedDate.getFullYear());
    const [month, setMonth] = useState(selectedDate.getMonth());

    useEffect(() => {
        // Logic to update events based on selectedDate
    }, [selectedDate]);

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const handleDateClick = (info) => {
        alert(`You clicked on ${info.dateStr}`);
    };

    return (
        <CalendarContainer>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={events} // Assuming events is an array of event objects
                dateClick={handleDateClick}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
            />
        </CalendarContainer>
    );
};

export default MyCustomCalendar;
