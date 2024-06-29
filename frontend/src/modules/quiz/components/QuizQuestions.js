import { FormattedMessage } from 'react-intl';
import QuestionDetails from "./QuestionDetails";



const QuizQuestions = ({ questions }) => {

    return (
        <div>
            {questions ?
                (<div>
                    <div>{
                        questions.items.map(question =>
                            <QuestionDetails key={question.id} question={question} />)
                    }
                    </div>
                </div>) : <FormattedMessage id="project.no_questions" />}
        </div>
    );

}

export default QuizQuestions;
