DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS drivers;
DROP TABLE IF EXISTS constructors;
DROP TABLE IF EXISTS status;
CREATE TABLE races (
    raceId BIGINT PRIMARY KEY,
    year INT,
    name VARCHAR(255)
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
