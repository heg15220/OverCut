import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";
import * as historicService from "./historicService";
const backExport = { init, NetworkError, userService, postService, historicService}

export default backExport;
