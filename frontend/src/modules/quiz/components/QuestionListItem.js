import React, { useState } from 'react';
import QuestionDetailsLink from "./QuestionDetailsLink";

const QuestionListItem = ({ question, handleSelectAnswer }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleClick = (event) => {
        event.preventDefault(); // Evita el comportamiento predeterminado del enlace
        handleSelectAnswer(question.id, selectedAnswer); // Actualiza la respuesta seleccionada
    };

    const srcImage = question.imagePath? "data:image/jpg;base64," + question.imagePath : null;

    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {srcImage && (
                <img src={srcImage} alt="Question Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px' }} />
            )}
            <div className="card-body">
                <a href="#" onClick={handleClick}>
                    <QuestionDetailsLink id={question.id} name={question.name} />
                </a>
            </div>
        </div>
    );
};

export default QuestionListItem;
