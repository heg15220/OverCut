import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const QuizListLink = ({ id}) => {
    return (
        <Link to={`/quiz/quiz-list/${id}`} style={{ color: '#00000F'}}>
        </Link>
    );
}

QuizListLink.propTypes = {
    id: PropTypes.number.isRequired,
};


export default QuizListLink;