/* eslint-disable no-restricted-globals */
/**
 * The race worker (SRS 4): a thin wrapper that feeds messages to the pure race
 * session (raceSession.js) and posts its replies back. Nothing else lives here, so the
 * in-thread fallback and the tests run exactly the same engine code.
 */

import { createRaceSession } from "./raceSession";

const session = createRaceSession();

self.onmessage = (event) => {
  self.postMessage(session.handle(event.data));
};
