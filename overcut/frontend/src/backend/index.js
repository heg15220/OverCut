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

import * as careerPathService from "./careerPathService";

import * as wordleService from "./wordleService";

import * as twoTeamsService from "./twoTeamsService";

import * as f1ImpostorService from "./f1ImpostorService";

import * as teamGuessService from "./teamGuessService";

import * as driversConnectionsService from "./driversConnectionsService";

import * as orderDriverService from "./orderDriverService";

import * as wordSearchService from "./wordSearchService";

import * as cooldownService from "./cooldownService";


import * as top10QualiService from "./top10qualiService"; // ✅ NUEVO

import * as driverSeasonService from "./driverSeasonService"; // ✅ NUEVO

import * as towerService from "./towerService"; // ✅ NUEVO


import * as anagramsService from "./anagramsService"; // ✅ NUEVO


import * as bingoService from "./bingoService"; // ✅ NUEVO


import * as timelineService from "./timelineService"; // ✅ NUEVO

import * as whoIsWhoService from "./whoIsWhoService";// ✅ NUEVO

import * as memoryService from "./memoryService";// ✅ NUEVO

import * as teamHistoryService from "./teamHistoryService"; // ✅ NUEVO

import * as higherLowerService from "./higherLowerService";// ✅ NUEVO


import * as thirtySecondsService  from "./thirtySecondsService";// ✅ NUEVO

import * as driverStatsService from "./driverStatsService"; // ✅ NUEVO


import * as abbreviationsService from "./abbreviationsService"; // ✅ NUEVO

const backExport = { init, NetworkError, userService,
    postService,quizService, historicService,eventService,tiktakService, pilotService, crosswordService,
    gridGameService, guessDriverService, top10Service, driversLinkService, careerPathService,
     wordleService, twoTeamsService, f1ImpostorService, teamGuessService, driversConnectionsService, orderDriverService,
     wordSearchService, cooldownService, top10QualiService, driverSeasonService, towerService, anagramsService,
     bingoService,timelineService,whoIsWhoService, memoryService, teamHistoryService, higherLowerService,
     thirtySecondsService, driverStatsService, abbreviationsService}


export default backExport;
