import { init } from "./appFetch";
import * as userService from "./userService";
import NetworkError from "./NetworkError";

import * as postService from "./postService";


import * as quizService from "./quizService"

import * as historicService from "./historicService";
import * as eventService from "./eventService";
import * as pilotService from "./pilotService";

import * as tiktakService from "./tiktakService";

import * as crosswordService from "./crosswordService";

const backExport = { init, NetworkError, userService,
    postService,quizService, historicService,eventService,tiktakService, pilotService, crosswordService}


export default backExport;
