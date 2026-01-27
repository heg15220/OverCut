import { init } from "./appFetch";

import NetworkError from "./NetworkError";

import * as debateService from "./debateService";



const backExport = { init, NetworkError, debateService}

export default backExport;