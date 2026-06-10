-- Inserts for the Ergast-style F1 dataset used by the Python minigames.
-- Target tables:
--   circuits(circuitId, circuitRef, name, location, country, lat, lng, alt, url)
--   constructors(constructorId, constructorRef, name, nationality, url)
--   drivers(driverId, driverRef, number, code, forename, surname, dob, nationality, url)
--   races(raceId, year, round, circuitId, name, date, time, url, ...)

START TRANSACTION;

-- New Madrid circuit: Madring / IFEMA-Valdebebas.
-- Wiki coordinates: 40.463611, -3.617778. Track length is 5.419 km.
-- Ergast's circuits.alt stores metres above sea level; 657 is Madrid's approximate elevation.
SET @madringCircuitId := (
  SELECT circuitId
  FROM circuits
  WHERE circuitRef = 'madring'
  LIMIT 1
);

SET @madringCircuitId := IFNULL(@madringCircuitId, (SELECT COALESCE(MAX(circuitId), 0) + 1 FROM circuits));

INSERT INTO circuits (circuitId, circuitRef, name, location, country, lat, lng, alt, url)
SELECT
  @madringCircuitId,
  'madring',
  'Madring',
  'Madrid',
  'Spain',
  40.463611,
  -3.617778,
  657,
  'https://en.wikipedia.org/wiki/Madring'
WHERE NOT EXISTS (
  SELECT 1 FROM circuits WHERE circuitRef = 'madring'
);

UPDATE circuits
SET
  name = 'Madring',
  location = 'Madrid',
  country = 'Spain',
  lat = 40.463611,
  lng = -3.617778,
  alt = 657,
  url = 'https://en.wikipedia.org/wiki/Madring'
WHERE circuitRef = 'madring';

-- Barcelona-Catalunya GP naming.
-- Keep the historic circuit, but make future/current rows explicit if the race
-- is no longer stored simply as "Spanish Grand Prix".
UPDATE races
SET name = 'Barcelona-Catalunya Grand Prix'
WHERE circuitId = (
  SELECT circuitId FROM circuits WHERE circuitRef = 'catalunya' LIMIT 1
)
AND year >= 2026;

-- New constructors.
SET @audiConstructorId := (
  SELECT constructorId
  FROM constructors
  WHERE constructorRef = 'audi'
  LIMIT 1
);

SET @audiConstructorId := IFNULL(@audiConstructorId, (SELECT COALESCE(MAX(constructorId), 0) + 1 FROM constructors));

INSERT INTO constructors (constructorId, constructorRef, name, nationality, url)
SELECT
  @audiConstructorId,
  'audi',
  'Audi',
  'German',
  'https://en.wikipedia.org/wiki/Audi_in_Formula_One'
WHERE NOT EXISTS (
  SELECT 1 FROM constructors WHERE constructorRef = 'audi'
);

UPDATE constructors
SET
  name = 'Audi',
  nationality = 'German',
  url = 'https://en.wikipedia.org/wiki/Audi_in_Formula_One'
WHERE constructorRef = 'audi';

SET @cadillacConstructorId := (
  SELECT constructorId
  FROM constructors
  WHERE constructorRef = 'cadillac'
  LIMIT 1
);

SET @cadillacConstructorId := IFNULL(@cadillacConstructorId, (SELECT COALESCE(MAX(constructorId), 0) + 1 FROM constructors));

INSERT INTO constructors (constructorId, constructorRef, name, nationality, url)
SELECT
  @cadillacConstructorId,
  'cadillac',
  'Cadillac',
  'American',
  'https://en.wikipedia.org/wiki/Cadillac_in_Formula_One'
WHERE NOT EXISTS (
  SELECT 1 FROM constructors WHERE constructorRef = 'cadillac'
);

UPDATE constructors
SET
  name = 'Cadillac',
  nationality = 'American',
  url = 'https://en.wikipedia.org/wiki/Cadillac_in_Formula_One'
WHERE constructorRef = 'cadillac';

-- New debutant driver. Correct spelling is Lindblad.
SET @lindbladDriverId := (
  SELECT driverId
  FROM drivers
  WHERE driverRef = 'lindblad'
  LIMIT 1
);

SET @lindbladDriverId := IFNULL(@lindbladDriverId, (SELECT COALESCE(MAX(driverId), 0) + 1 FROM drivers));

INSERT INTO drivers (driverId, driverRef, number, code, forename, surname, dob, nationality, url)
SELECT
  @lindbladDriverId,
  'lindblad',
  NULL,
  'LIN',
  'Arvid',
  'Lindblad',
  '2007-08-08',
  'British',
  'https://en.wikipedia.org/wiki/Arvid_Lindblad'
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE driverRef = 'lindblad'
);

UPDATE drivers
SET
  number = NULL,
  code = 'LIN',
  forename = 'Arvid',
  surname = 'Lindblad',
  dob = '2007-08-08',
  nationality = 'British',
  url = 'https://en.wikipedia.org/wiki/Arvid_Lindblad'
WHERE driverRef = 'lindblad';

-- Optional compatibility alias for the common misspelling in notes/searches.
-- Do not insert driverRef = 'linblad'; keep the canonical DB key as 'lindblad'.

COMMIT;
