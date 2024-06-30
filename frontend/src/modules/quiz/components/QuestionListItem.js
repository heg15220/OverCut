import React from 'react';
import QuestionDetailsLink from "./QuestionDetailsLink";

const QuestionListItem = ({ question }) => {
    // Asumiendo que post.image contiene la imagen del post en formato base64

    const srcImage = question.imagePath ? "data:image/jpg;base64," + question.imagePath : null;
    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            {/* Muestra la imagen del post si existe */}
            {srcImage && (
                <img src={srcImage} alt="Question Image" style={{ maxHeight: '100px', maxWidth: '100px', objectFit: 'cover', position: 'absolute', top: '10px', right: '10px'}} />
            )}
            <div className="card-body">
                <QuestionDetailsLink id={question.id} name={question.name} />
            </div>
        </div>
    )
}

export default QuestionListItem;