import * as actions from './actions';
import reducer from './reducer'
import * as selectors from './selectors';
import App from './components/App';



const modAppExport = { App, actions, reducer, selectors };
export default modAppExport;
