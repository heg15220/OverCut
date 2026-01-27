// frontend/src/modules/debate/index.js
import reducer from "./reducer";

import DebateHome from "./components/DebateHome";
import DebateRoomPage from "./components/DebateRoomPage";

const debate = { reducer };

export default debate;

export { DebateHome, DebateRoomPage };
