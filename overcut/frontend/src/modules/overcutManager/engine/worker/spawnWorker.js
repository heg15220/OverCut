/**
 * Webpack 5 (react-scripts 5) bundles a module worker from `new URL(..., import.meta.url)`.
 * Kept in its own module and loaded with a dynamic import, so jest (no Worker, no
 * import.meta in CommonJS) never parses it.
 */
const spawnRaceWorker = () => new Worker(new URL("./raceWorker.js", import.meta.url));

export default spawnRaceWorker;
