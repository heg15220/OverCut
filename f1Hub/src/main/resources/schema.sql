DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS circuits;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS constructors;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS qualifying;
DROP TABLE IF EXISTS sprintresults;

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
    nationality VARCHAR(100)
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
