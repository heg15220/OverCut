import {QuestionDetails} from "../index";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import './QuestionDetails.css';
const QuizQuestions = ({ questions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // Check if questions and questions.items exist before accessing them
    const currentQuestion = questions?.items ? questions.items[currentQuestionIndex] : null;
    const navigate = useNavigate();

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
                navigate('/')
            )}
        </div>
    );
};

export default QuizQuestions;
