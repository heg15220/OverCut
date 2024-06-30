import { FormattedMessage } from 'react-intl';
import QuestionDetails from "./QuestionDetails";
import QuestionListItem from "./QuestionListItem";



const QuizQuestions = ({ questions }) => {

    return (
        <div>
            {questions ?
                (<div>
                    <div>{
                        questions.items.map(question =>
                            <QuestionListItem key={question.id} question={question} />)
                    }
                    </div>
                </div>) : <FormattedMessage id="project.no_questions" />}
        </div>
    );

}

export default QuizQuestions;
