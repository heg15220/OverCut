import { FormattedMessage } from 'react-intl';
import QuestionDetails from "./QuestionDetails";
import QuestionListItem from "./QuestionListItem";
import {useState} from "react";



const QuizQuestions = ({ questions }) => {

    const [currentUserSelectedAnswer, setCurrentUserSelectedAnswer] = useState(null);

    const handleSelectAnswer = (questionId, selectedAnswer) => {
        setCurrentUserSelectedAnswer(selectedAnswer);
        // Aquí puedes manejar la lógica adicional necesaria, como actualizar el estado global o enviar la respuesta al servidor
    };
    return (
        <div>
            {questions ?
                (<div>
                    <div>  {questions.items.map((question) =>
                        <QuestionListItem key={question.id} question={question} handleSelectAnswer={handleSelectAnswer} />
                    )}
                    </div>
                </div>) : <FormattedMessage id="project.no_questions" />}
        </div>
    );

}

export default QuizQuestions;
