import {QuestionDetails} from "../index";
import {useState} from "react";

const QuizQuestions = ({ questions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // Check if questions and questions.items exist before accessing them
    const currentQuestion = questions?.items ? questions.items[currentQuestionIndex] : null;

    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    };

    const handlePreviousQuestion = () => {
        setCurrentQuestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    return (
        <div>
            {currentQuestion? (
                <QuestionDetails question={currentQuestion} onAnswerSubmit={handleNextQuestion} />
            ) : (
                <p>No hay preguntas disponibles.</p>
            )}
            <button onClick={handlePreviousQuestion}>Anterior</button>
            <button onClick={handleNextQuestion}>Siguiente</button>
        </div>
    );
};

export default QuizQuestions;
