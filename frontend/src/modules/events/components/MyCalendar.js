import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as selectors from '../../events/selectors'; // Asegúrate de tener este hook creado
import * as actions from '../../events/actions';
import moment from 'moment';
import MyCustomCalendar from "./MyCustomCalendar";

const MyCalendar = () => {
    const dispatch = useDispatch();
    const events = useSelector(selectors.getEvents); // Usa el selector de Redux para obtener los eventos
    const [items, setItems] = useState([]);

    useEffect(() => {
        dispatch(actions.getEvents(0, () => {})); // Carga los eventos cuando el componente monta
    }, [dispatch]);

    useEffect(() => {
        if (events) {
            const formattedEvents = events.items.map(event => ({
                title: event.name,
                startDate: moment(event.date).toDate(),
                endDate: moment(event.date).add(1, 'hours').toDate(), // Asumiendo que cada evento dura 1 hora
                description: event.description,
                location: event.location,
                imageUrl: event.imageUrl,
            }));
            setItems(formattedEvents);
        }
    }, [events]);

    return (
        <MyCustomCalendar events={items}> </MyCustomCalendar>
    );
};

export default MyCalendar;