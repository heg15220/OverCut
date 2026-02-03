import { init } from "./appFetch";

import NetworkError from "./NetworkError";

import * as predictionsService from "./predictionsService";



const backExport = { init, NetworkError, predictionsService}

export default backExport;