import React, { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import './MyCalendar.css';
import CreateEventForm from './CreateEventForm';
const localizer = momentLocalizer(moment);

const MyCalendar = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);


    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setShowModal(true);
    };

    return (
        <div style={{ width: '80%', margin: '0 auto', overflowX: 'auto' }}>
            <h1>Calendario</h1>
            <div style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
                <Calendar
                    localizer={localizer}
                    defaultDate={new Date()}
                    defaultView="week"
                    selectable
                    onSelectEvent={() => {}}
                    onSelectSlot={handleDateSelect}
                >
                </Calendar>
            </div>
            {showModal && <CreateEventForm showModal={showModal} setShowModal={setShowModal} selectedDate={selectedDate}/>}
        </div>
    );
};

export default MyCalendar;
