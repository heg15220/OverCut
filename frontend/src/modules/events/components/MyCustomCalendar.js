import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { styled } from '@mui/system'; // Corrección aquí
import { Box } from '@mui/material'; // Utiliza Box para envolver el contenido
import timeGridPlugin from '@fullcalendar/timegrid'; // Importa timeGridPlugin
import * as selectors from '../../events/selectors'; // Asegúrate de tener este hook creado
import * as actions from '../../events/actions';
import {useDispatch, useSelector} from "react-redux";
// Define a CalendarContainer styled component
const CalendarContainer = styled(Box)` // Usa Box de MUI System
  width: 100%;
  height: 80vh; /* Adjust the height as needed */
  border-radius: 8px;
  overflow: auto;
`;

const testEventsData = [
    {
        name: "Evento de Prueba 1",
        date: "2024-07-15T10:00:00Z", // Fecha y hora en UTC
        description: "Descripción del primer evento",
        location: "Ubicación 1",
        imageUrl: "https://example.com/image1.jpg",
    },
    {
        name: "Evento de Prueba 2",
        date: "2024-07-16T14:30:00Z", // Fecha y hora en UTC
        description: "Descripción del segundo evento",
        location: "Ubicación 2",
        imageUrl: "https://example.com/image2.jpg",
    },
];

const MyCustomCalendar = () => {

    const dispatch = useDispatch();

    const events = useSelector(selectors.getEvents);


    useEffect(() => {
        dispatch(actions.getEvents(0, () => {})); // Carga los eventos cuando el componente monta
    }, [dispatch]);


    const calendarEvents = events.items.map(eventObj => ({
        title: eventObj.name, // Nombre del evento
        start: new Date(eventObj.date), // Fecha de inicio del evento
        description: eventObj.description, // Descripción opcional
        location: eventObj.location, // Ubicación opcional
        url: eventObj.imageUrl, // URL de imagen opcional
    }));

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

    const handleDateClick = (info) => {
        alert(`You clicked on ${info.dateStr}`);
    };

    return (
        <CalendarContainer>
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents} // Pasamos los eventos transformados
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
