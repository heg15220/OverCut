import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { getAllEvents, getAllNotifications } from '../selectors';
import { saveNotification } from '../actions';

import * as selectors from '../selectors';
import { Field, Form, Formik } from "formik";
import Events from "../components/Events";
import './MyCalendar.css'; // Importa el archivo CSS aquí

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
    const dispatch = useDispatch();
    const events = useSelector(selectors.getAllEvents);

    useEffect(() => {
        const fetchEvents = async () => {
            await getAllEvents(() => {}, (error) => {
                if (error) {
                    console.error('Error al cargar eventos:', error);
                }
            });
        };
        fetchEvents();
    }, []);

    const handleDateSelect = (date) => {
        console.log('Fecha seleccionada:', date);
    };

    const handleSubmit = async (values) => {
        try {
            await saveNotification(values.notification, () => {}, (error) => {
                if (!error) {
                    dispatch(saveNotification(values.notification));
                }
            });
        } catch (error) {
            console.error('Error al enviar la notificación:', error);
        }
    };

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            <h1>Calendario</h1>
            <div style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}>
                <Calendar
                    localizer={localizer}
                    defaultDate={new Date()}
                    defaultView="month"
                    selectable
                    onSelectEvent={() => {}}
                    onSelectSlot={handleDateSelect}
                >
                    <Events events={events} />
                </Calendar>
            </div>
            <h1>Crear Notificación</h1>
            <Formik initialValues={{ notification: '' }} onSubmit={handleSubmit}>
                {({ isSubmitting }) => (
                    <Form>
                        <Field type="text" name="notification" placeholder="Escribe tu notificación aquí..." />
                        <button type="submit" disabled={isSubmitting}>Enviar</button>
                    </Form>
                )}
            </Formik>
        </div>
    );
};

export default MyCalendar;
