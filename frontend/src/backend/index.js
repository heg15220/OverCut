import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";


import * as quizService from "./quizService"

import * as historicService from "./historicService";
import * as eventService from "./eventService";


const backExport = { init, NetworkError, userService,
    postService,quizService, historicService,eventService}


export default backExport;
