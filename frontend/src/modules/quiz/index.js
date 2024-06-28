import * as actions from './actions';
import * as actionTypes from './actionTypes';
import reducer from './reducer';
import * as selectors from './selectors';


const exportedObj = { actions, actionTypes, reducer, selectors };

export default exportedObj;