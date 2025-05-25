import { init } from "./appFetch";

import NetworkError from "./NetworkError";

import * as raceResultService from "./raceResultService";

import * as raceSelectorService from "./raceSelectorService";

import * as statisticsService from "./statisticsService";

const backExport = { init, NetworkError, raceResultService, raceSelectorService, statisticsService}

export default backExport;