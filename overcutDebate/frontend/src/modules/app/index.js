import reducer from "./reducer";
import * as actions from "./actions";
import * as actionTypes from "./actionTypes";
import * as selectors from "./selectors";

export { reducer, actions, actionTypes, selectors };

// ✅ Esto hace que `import app from "./modules/app"` funcione
export default { reducer, actions, actionTypes, selectors };
