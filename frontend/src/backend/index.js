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

import * as gridGameService from "./gridGameService";

import * as guessDriverService from "./guessDriverService";

import * as top10Service from "./top10Service";

import * as driversLinkService from "./driversLinkService";

const backExport = { init, NetworkError, userService,
    postService,quizService, historicService,eventService,tiktakService, pilotService, crosswordService,
    gridGameService, guessDriverService, top10Service, driversLinkService}


export default backExport;
