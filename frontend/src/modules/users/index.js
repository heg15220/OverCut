import * as actions from './actions';
import * as actionTypes from './actionTypes';
import reducer from './reducer';
import * as selectors from './selectors';

export { default as SignUp } from './components/SignUp';
export { default as Login } from './components/Login';
export { default as ChangePassword } from './components/ChangePassword';
export { default as UpdateProfile } from './components/UpdateProfile';
export { default as Logout} from './components/Logout';
export { default as UserDetails } from './components/UserDetails';

const modUserExport = { actions, actionTypes, reducer, selectors };

export default modUserExport;
