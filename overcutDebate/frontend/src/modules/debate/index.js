import reducer from "./reducer";

import DebateHome from "./components/DebateHome";
import DebateRoomPage from "./components/DebateRoomPage";

import * as actions from "./actions";
import * as selectors from "./selectors";

const debate = { reducer, actions, selectors };

export default debate;
export { DebateHome, DebateRoomPage };
