// WeekView.js
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const AgendaView = ({ children,...props }) => {
    const CustomToolbar = (props) => {
        return (
            <>
                {props.children}
            </>
        );
    };
    return (
        <Calendar
            localizer={localizer}
            {...props}
            view="rbc-agenda-view"

        />
    );
};

AgendaView.range = Calendar.range;

export default AgendaView;
