import { init } from "./appFetch";

import NetworkError from "./NetworkError";

import * as raceResultService from "./raceResultService";

import * as raceSelectorService from "./raceSelectorService";

import * as statisticsService from "./statisticsService";

import * as championshipService from "./championshipService";


import * as chartService from "./chartService";

const backExport = { init, NetworkError, raceResultService, raceSelectorService, statisticsService, championshipService,
chartService}

export default backExport;