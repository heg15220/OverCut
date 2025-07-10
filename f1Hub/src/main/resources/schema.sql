DROP TABLE IF EXISTS laptimes;
DROP TABLE IF EXISTS pitstops;
DROP TABLE IF EXISTS qualifying;
DROP TABLE IF EXISTS sprintresults;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS constructorresults;
DROP TABLE IF EXISTS constructorstandings;
DROP TABLE IF EXISTS driverstandings;
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS circuits;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS constructors;
DROP TABLE IF EXISTS status;

CREATE TABLE qualifying (
    qualifyId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT NOT NULL,
    driverId BIGINT NOT NULL,
    constructorId BIGINT NOT NULL,
    number INT NOT NULL,
    position INT,
    q1 VARCHAR(255),
    q2 VARCHAR(255),
    q3 VARCHAR(255),

    CONSTRAINT fk_qualifying_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_qualifying_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId),
    CONSTRAINT fk_qualifying_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId)
);

CREATE TABLE races (
    raceId BIGINT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    round INT NOT NULL,
    circuitId BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    url VARCHAR(255),

    fp1_date DATE,
    fp1_time TIME,
    fp2_date DATE,
    fp2_time TIME,
    fp3_date DATE,
    fp3_time TIME,
    quali_date DATE,
    quali_time TIME,
    sprint_date DATE,
    sprint_time TIME,

    CONSTRAINT fk_circuit_race FOREIGN KEY (circuitId) REFERENCES circuits(circuitId)
);

CREATE TABLE drivers (
    driverId BIGINT PRIMARY KEY,
    forename VARCHAR(100),
    surname VARCHAR(100),
    nationality VARCHAR(100),
    dob DATE
);


CREATE TABLE constructors (
    constructorId BIGINT PRIMARY KEY,
    constructorRef VARCHAR(100),
    name VARCHAR(100)
);
CREATE TABLE circuits (
    circuitId BIGINT PRIMARY KEY,
    circuitRef VARCHAR(255),
    name VARCHAR(255),
    location VARCHAR(255),
    country VARCHAR(255),
    lat DOUBLE,
    lng DOUBLE,
    alt INT,
    url VARCHAR(255)
);

CREATE TABLE status (
    statusId BIGINT PRIMARY KEY,
    status VARCHAR(255)
);

CREATE TABLE results (
    resultId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT,
    driverId BIGINT,
    constructorId BIGINT,
    statusId BIGINT,
    number INT,
    grid INT,
    positionOrder INT,
    laps INT,
    time VARCHAR(100),
    points DOUBLE,
    milliseconds INT,
    fastestLapSpeed DOUBLE,

    CONSTRAINT fk_result_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_result_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId),
    CONSTRAINT fk_result_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId),
    CONSTRAINT fk_result_status FOREIGN KEY (statusId) REFERENCES status(statusId)
);

CREATE TABLE sprintresults (
    sprintResultId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT NOT NULL,
    driverId BIGINT NOT NULL,
    constructorId BIGINT NOT NULL,
    number INT NOT NULL,
    grid INT,
    position INT,
    positionText VARCHAR(255),
    positionOrder INT,
    points DOUBLE,
    laps INT,
    time VARCHAR(255),
    milliseconds INT,
    fastestLap INT,
    fastestLapTime VARCHAR(255),
    statusId BIGINT,

    CONSTRAINT fk_sprint_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_sprint_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId),
    CONSTRAINT fk_sprint_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId),
    CONSTRAINT fk_sprint_status FOREIGN KEY (statusId) REFERENCES status(statusId)
);

UPDATE sprintresults SET position = positionOrder WHERE position IS NULL;

CREATE TABLE laptimes (
    raceId BIGINT NOT NULL,
    driverId BIGINT NOT NULL,
    lap INT NOT NULL,
    position INT,
    time VARCHAR(50),
    milliseconds INT,

    PRIMARY KEY (raceId, driverId, lap),
    CONSTRAINT fk_laptimes_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_laptimes_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId)
);

CREATE TABLE pitstops (
    raceId BIGINT NOT NULL,
    driverId BIGINT NOT NULL,
    stop INT NOT NULL,
    lap INT,
    time VARCHAR(50),
    duration VARCHAR(50),
    milliseconds INT,

    PRIMARY KEY (raceId, driverId, stop),
    CONSTRAINT fk_pitstops_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_pitstops_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId)
);


CREATE TABLE constructorresults (
    constructorResultsId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT NOT NULL,
    constructorId BIGINT NOT NULL,
    points DOUBLE,
    status VARCHAR(255),

    CONSTRAINT fk_constructorresults_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_constructorresults_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId)
);


CREATE TABLE constructorstandings (
    constructorStandingsId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT NOT NULL,
    constructorId BIGINT NOT NULL,
    points DOUBLE,
    position INT,
    positionText VARCHAR(10),
    wins INT,

    CONSTRAINT fk_constructorstandings_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_constructorstandings_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId)
);


CREATE TABLE driverstandings (
    driverStandingsId BIGINT AUTO_INCREMENT PRIMARY KEY,
    raceId BIGINT NOT NULL,
    driverId BIGINT NOT NULL,
    points DOUBLE,
    position INT,
    positionText VARCHAR(10),
    wins INT,

    CONSTRAINT fk_driverstandings_race FOREIGN KEY (raceId) REFERENCES races(raceId),
    CONSTRAINT fk_driverstandings_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId)
);


CREATE TABLE seasons (
    year INT PRIMARY KEY,
    url VARCHAR(255)
);

CREATE INDEX idx_results_driverId_raceId ON results(driverId, raceId);
CREATE INDEX idx_races_raceId_date ON races(raceId, date);
CREATE INDEX idx_qualifying_driverId_raceId_position ON qualifying(driverId, raceId, position);
CREATE INDEX idx_laptimes_driverId_raceId_position ON laptimes(driverId, raceId, position);

-- INDEX para results: optimiza joins y filtros sobre driver, carrera, grid, posiciones y estado
CREATE INDEX idx_results_driver_race_pos_grid_laps_status
    ON results(driverId, raceId, positionOrder, grid, laps, statusId);

-- INDEX para races: optimiza búsquedas por id, año y fecha
CREATE INDEX idx_races_id_year_date
    ON races(raceId, year, date);

-- INDEX para status: optimiza búsquedas por id y descripción de estado
CREATE INDEX idx_status_id_status
    ON status(statusId, status);

CREATE INDEX idx_status_statusId_status ON status(statusId, status);

CREATE INDEX idx_results_statusId ON results(statusId);
CREATE INDEX idx_results_driverId_raceId_statusId ON results(driverId, raceId, statusId);


-- índice para búsquedas por carrera
CREATE INDEX idx_results_raceId ON results(raceId);

-- índice para búsquedas por piloto
CREATE INDEX idx_results_driverId ON results(driverId);

-- índice para búsquedas por constructor
CREATE INDEX idx_results_constructorId ON results(constructorId);

-- índice para búsquedas por status
CREATE INDEX idx_results_statusId ON results(statusId);

-- índice para WHERE positionOrder, grid
CREATE INDEX idx_results_positionOrder_grid ON results(positionOrder, grid);

-- índice para rangos de año (vía join con races)
CREATE INDEX idx_results_raceId_positionOrder ON results(raceId, positionOrder);

-- índice para filtrado por piloto y posición
CREATE INDEX idx_results_driverId_positionOrder ON results(driverId, positionOrder);

-- índice para filtrado por constructor y posición
CREATE INDEX idx_results_constructorId_positionOrder ON results(constructorId, positionOrder);

-- índice para filtrado por piloto y grid
CREATE INDEX idx_results_driverId_grid ON results(driverId, grid);

-- índice para joins por piloto/carrera/constructor
CREATE INDEX idx_results_driver_race_constructor ON results(driverId, raceId, constructorId);

-- índice para puntos
CREATE INDEX idx_results_points ON results(points);

-- índice para grid vs posición
CREATE INDEX idx_results_grid_positionOrder ON results(grid, positionOrder);

-- índice para tiempo en milisegundos (para gaps de carrera)
CREATE INDEX idx_results_milliseconds ON results(milliseconds);

-- índice para fastest lap speed
CREATE INDEX idx_results_fastestLapSpeed ON results(fastestLapSpeed);

-- índice combinado para COUNTs y GROUP BY más usados
CREATE INDEX idx_results_driver_constructor_positionOrder ON results(driverId, constructorId, positionOrder);


-- para joins por id
CREATE INDEX idx_races_raceId ON races(raceId);

-- para joins con filtros de año
CREATE INDEX idx_races_year ON races(year);

-- para filtros de año + round
CREATE INDEX idx_races_year_round ON races(year, round);

-- para filtros por circuito
CREATE INDEX idx_races_circuitId ON races(circuitId);

-- para ORDER BY por fecha
CREATE INDEX idx_races_date ON races(date);

-- para JOIN frecuente con status de resultados
CREATE INDEX idx_races_raceId_year_date ON races(raceId, year, date);


-- búsqueda por id
CREATE INDEX idx_status_statusId ON status(statusId);

-- búsqueda por texto de status (para causas)
CREATE INDEX idx_status_status ON status(status);


-- búsqueda por id
CREATE INDEX idx_drivers_driverId ON drivers(driverId);

-- para forename + surname (para los counts por nombre completo)
CREATE INDEX idx_drivers_forename_surname ON drivers(forename, surname);

-- para JOIN con nacionalidad (home GP)
CREATE INDEX idx_drivers_nationality ON drivers(nationality);


-- búsqueda por id
CREATE INDEX idx_constructors_constructorId ON constructors(constructorId);

-- búsqueda por ref (para queries de constructorRef)
CREATE INDEX idx_constructors_constructorRef ON constructors(constructorRef);


-- búsqueda por carrera, piloto, lap
CREATE INDEX idx_laptimes_race_driver_lap ON laptimes(raceId, driverId, lap);

-- búsqueda por posición
CREATE INDEX idx_laptimes_position ON laptimes(position);


-- para joins por carrera y piloto/constructor
CREATE INDEX idx_driverstandings_race_driver ON driverstandings(raceId, driverId);
CREATE INDEX idx_constructorstandings_race_constructor ON constructorstandings(raceId, constructorId);

-- para posición en el campeonato
CREATE INDEX idx_driverstandings_position ON driverstandings(position);
CREATE INDEX idx_constructorstandings_position ON constructorstandings(position);


-- búsqueda por carrera
CREATE INDEX idx_qualifying_raceId ON qualifying(raceId);

-- búsqueda por piloto
CREATE INDEX idx_qualifying_driverId ON qualifying(driverId);

-- búsqueda por constructor
CREATE INDEX idx_qualifying_constructorId ON qualifying(constructorId);

-- búsqueda por posición
CREATE INDEX idx_qualifying_position ON qualifying(position);

-- búsqueda combinada para JOIN frecuentes
CREATE INDEX idx_qualifying_race_driver_constructor ON qualifying(raceId, driverId, constructorId);

-- búsqueda por tiempos Q1/Q2/Q3
CREATE INDEX idx_qualifying_q1_q2_q3 ON qualifying(q1, q2, q3);


