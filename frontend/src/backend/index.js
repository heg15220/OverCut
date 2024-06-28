import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";

import * as quizService from "./quizService";

const backExport = { init, NetworkError, userService, postService,quizService}

export default backExport;
