import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../actions';
import { getEvents } from '../selectors';
import * as actions from '../actions';

// En CreateEventForm.js, modifica el componente para incluir la prop onCreate
const CreateEventForm = ({ showModal, setShowModal, selectedDate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const dispatch = useDispatch();

    const handleSubmit = event => {
        event.preventDefault();
        const eventData = {
            name: name.trim(),
            description: description.trim(),
            location: location.trim(),
            date: selectedDate
        };
        actions.createEvent(eventData, () => {}, {}); // Llama a la función onCreate con los datos del evento
        setShowModal(false);
    };

    useEffect(() => {
        dispatch(getEvents(() => {}));
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        switch (name) {
            case 'name':
                setName(value);
                break;
            case 'description':
                setDescription(value);
                break;
            case 'location':
                setLocation(value);
                break;
            default:
                break;
        }
    };

    return (
        <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Agregar Evento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {/* Form fields */}
                    <Button variant="primary" type="submit">
                        Crear Evento
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default CreateEventForm;
