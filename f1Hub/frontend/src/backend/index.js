import { init } from "./appFetch";

import NetworkError from "./NetworkError";

import * as raceResultService from "./raceResultService";

const backExport = { init, NetworkError, raceResultService}

export default backExport;