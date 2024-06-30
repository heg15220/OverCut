import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const QuestionDetailsLink = ({ id, name }) => {
    return (
        <Link to={`/question/question-details/${id}`} style={{ color: '#00000F'}}>
            {name}
        </Link>
    );
}

QuestionDetailsLink.propTypes = {
    id: PropTypes.number.isRequired,
    name: PropTypes.number.isRequired,
};


export default QuestionDetailsLink;