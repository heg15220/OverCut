import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";


import * as quizService from "./quizService"

import * as historicService from "./historicService";

const backExport = { init, NetworkError, userService, postService,quizService, historicService}


export default backExport;
