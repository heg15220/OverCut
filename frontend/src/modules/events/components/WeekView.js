// WeekView.js
import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ButtonAddEvent from "./ButtonAddEvent";

const localizer = momentLocalizer(moment);

const WeekView = ({ children,...props }) => {
    const CustomToolbar = (props) => {
        return (
            <>
                {props.children}
                <ButtonAddEvent onClick={() => window.location.href='/events/event/create'} />
            </>
        );
    };
    return (
        <Calendar
            localizer={localizer}
            {...props}
            view="week"
            components={{
                toolbar: CustomToolbar,
                monthHeader: props.components.monthHeader,
                dayHeader: props.components.dayHeader,
                eventPropGetter: props.components.eventPropGetter,
                title: props.components.title,
                navigation: props.components.navigation,
                today: props.components.today,
                timeGrid: props.components.timeGrid,
                headerToolbar: props.components.headerToolbar,
                agenda: props.components.agenda,
                agendaDay: props.components.agendaDay,
                agendaWeek: props.components.agendaWeek,
                agendaWorkWeek: props.components.agendaWorkWeek,
                agendaFourDayWeek: props.components.agendaFourDayWeek,
                agendaTwoDayWeek: props.components.agendaTwoDayWeek,
                agendaThreeDayWeek: props.components.agendaThreeDayWeek,
                agendaFiveDayWeek: props.components.agendaFiveDayWeek,
                agendaSixDayWeek: props.components.agendaSixDayWeek,
                agendaSevenDayWeek: props.components.agendaSevenDayWeek,
                agendaToday: props.components.agendaToday,
                agendaAllDayProps: props.components.agendaAllDayProps,
                agendaTimeRangeProps: props.components.agendaTimeRangeProps,
                agendaMoreProps: props.components.agendaMoreProps,
                agendaUnitProps: props.components.agendaUnitProps,
                agendaEventPropGetter: props.components.agendaEventPropGetter,
                agendaSlotPropGetter: props.components.agendaSlotPropGetter,
                agendaSlotStyleGetter: props.components.agendaSlotStyleGetter,
                agendaSlotPropsGetter: props.components.agendaSlotPropsGetter,
                agendaSlotTitleGetter: props.components.agendaSlotTitleGetter,
                agendaSlotContentGetter: props.components.agendaSlotContentGetter,
                agendaSlotFooterGetter: props.components.agendaSlotFooterGetter,
            }}
        />
    );
};

WeekView.range = Calendar.range;

export default WeekView;
