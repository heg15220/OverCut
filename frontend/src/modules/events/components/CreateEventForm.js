import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import * as actions from "../../events/actions";

const CreateEventForm = ({ showModal, setShowModal, selectedDate }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [location, setLocation] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [backendErrors, setBackendErrors] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState(selectedDate);

    const handleSubmit = event => {
        event.preventDefault();
        dispatch(actions.createEvent(
            {
                name: name.trim(),
                description: description.trim(),
                location: location.trim(),
                date: formData
            },
            event => {
                setSuccess('Se ha creado el evento correctamente');
                navigate(`/calendar`);
            },
            errors => setBackendErrors(errors),
        ));
    }

    useEffect(() => {
        dispatch(actions.getAllEvents(() => { }))
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleDateChange = (date) => {
        setFormData({
            ...formData,
            date: date
        });
    };

    return (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Agregar Evento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(formData);
                }}>
                    <Form.Group controlId="eventName">
                        <Form.Label>Nombre del Evento</Form.Label>
                        <Form.Control type="text" placeholder="Ingrese el nombre del evento" name="name" value={formData.name} onChange={handleChange} required />
                    </Form.Group>

                    <Form.Group controlId="eventDescription">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control as="textarea" rows={3} placeholder="Ingrese la descripción del evento" name="description" value={formData.description} onChange={handleChange} required />
                    </Form.Group>

                    <Form.Group controlId="eventLocation">
                        <Form.Label>Ubicación</Form.Label>
                        <Form.Control type="text" placeholder="Ingrese la ubicación del evento" name="location" value={formData.location} onChange={handleChange} required />
                    </Form.Group>

                    <Form.Group controlId="eventDate">
                        <Form.Label>Fecha del Evento</Form.Label>
                        <Form.Control type="date" name="date" value={formData.date? formData.date.toISOString().split('T')[0] : ''} onChange={(e) => handleDateChange(new Date(e.target.value))} required />
                    </Form.Group>

                    <Button variant="primary" type="submit">
                        Crear Evento
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreateEventForm;
