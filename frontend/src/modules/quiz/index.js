import * as actions from './actions';
import * as actionTypes from './actionTypes';
import reducer from './reducer';
import * as selectors from './selectors';

export { default as Quiz } from './components/Quiz';

export { default as QuizList } from './components/QuizList';

export { default as QuestionDetails } from './components/QuestionDetails';


const exportedObj = { actions, actionTypes, reducer, selectors };

export default exportedObj;