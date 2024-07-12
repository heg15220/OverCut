import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import * as selectors from '../../events/selectors';
import * as actions from '../../events/actions';
import { useDispatch, useSelector } from "react-redux";
import EventDetails from "./EventDetails";
import EventCalendarDetails from "./EventCalendarDetails";
import {styled} from "@mui/system";
import {Box} from "@mui/material"; // Asegúrate de que la ruta de importación sea correcta

const CalendarContainer = styled(Box)`
  width: 100%;
  height: 100vh;
  border-radius: 8px;
  overflow: auto;
`;

const MyCustomCalendar = () => {
    const dispatch = useDispatch();
    const events = useSelector(selectors.getEvents);

    useEffect(() => {
        dispatch(actions.getEvents(0, () => {}));
    }, [dispatch]);

    const calendarEvents = events.items.map(eventObj => ({
        title: eventObj.name,
        start: new Date(eventObj.date),
        description: eventObj.description,
        location: eventObj.location,
        url: eventObj.imageUrl,
        id: eventObj.id,
    }));

    return (
        <CalendarContainer>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                events={calendarEvents}
                eventContent={({ event }) => (
                    <EventCalendarDetails details={event} />
                )}
                headerToolbar={{
                    left: 'prev,next',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
            />
        </CalendarContainer>
    );
};

export default MyCustomCalendar;
