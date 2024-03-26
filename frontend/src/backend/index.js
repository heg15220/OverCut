import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";

const backExport = { init, NetworkError, userService, postService}

export default backExport;
