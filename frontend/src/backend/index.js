import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";

import * as eventService from "./eventService";

const backExport = { init, NetworkError, userService, postService,
    eventService}

export default backExport;
