-- =========================================================
-- 1) QUALIFYING: tabla con best lap en ms por piloto/carrera
-- =========================================================
DROP TABLE IF EXISTS qualifying_best_ms;

CREATE TABLE qualifying_best_ms (
  raceId BIGINT NOT NULL,
  driverId BIGINT NOT NULL,
  constructorId BIGINT NOT NULL,
  bestMs INT NOT NULL,
  PRIMARY KEY (raceId, driverId),
  INDEX idx_qbm_race_constructor (raceId, constructorId),
  INDEX idx_qbm_constructor (constructorId),
  CONSTRAINT fk_qbm_race FOREIGN KEY (raceId) REFERENCES races(raceId),
  CONSTRAINT fk_qbm_driver FOREIGN KEY (driverId) REFERENCES drivers(driverId),
  CONSTRAINT fk_qbm_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId)
);

-- =========================================================
-- 2) QUALI POLE: pole en ms por carrera
-- =========================================================
DROP TABLE IF EXISTS quali_pole_ms;

CREATE TABLE quali_pole_ms (
  raceId BIGINT NOT NULL PRIMARY KEY,
  poleMs INT NOT NULL,
  INDEX idx_qpm_pole (poleMs),
  CONSTRAINT fk_qpm_race FOREIGN KEY (raceId) REFERENCES races(raceId)
);

-- =========================================================
-- 3) AGREGADO: gap medio por equipo y carrera vs pole
-- =========================================================
DROP TABLE IF EXISTS team_quali_gap_per_race;

CREATE TABLE team_quali_gap_per_race (
  raceId BIGINT NOT NULL,
  constructorId BIGINT NOT NULL,
  avgQualiGapMs DOUBLE NOT NULL,
  PRIMARY KEY (raceId, constructorId),
  INDEX idx_tqg_race (raceId),
  INDEX idx_tqg_constructor (constructorId),
  CONSTRAINT fk_tqg_race FOREIGN KEY (raceId) REFERENCES races(raceId),
  CONSTRAINT fk_tqg_constructor FOREIGN KEY (constructorId) REFERENCES constructors(constructorId)
);

-- =========================================================
-- REFRESH PROCEDURE (lo puedes lanzar al arrancar, o cron)
-- =========================================================
DROP PROCEDURE IF EXISTS refresh_quali_gap_tables;
DELIMITER $$

CREATE PROCEDURE refresh_quali_gap_tables(IN p_year INT)
BEGIN
  -- Limpia sólo ese año (rápido)
  DELETE qbm
  FROM qualifying_best_ms qbm
  JOIN races r ON r.raceId = qbm.raceId
  WHERE r.year = p_year;

  DELETE qpm
  FROM quali_pole_ms qpm
  JOIN races r ON r.raceId = qpm.raceId
  WHERE r.year = p_year;

  DELETE tqg
  FROM team_quali_gap_per_race tqg
  JOIN races r ON r.raceId = tqg.raceId
  WHERE r.year = p_year;

  -- 1) bestMs por piloto/carrera
  INSERT INTO qualifying_best_ms (raceId, driverId, constructorId, bestMs)
  SELECT
    q.raceId,
    q.driverId,
    q.constructorId,
    CAST(ROUND(1000 * LEAST(
      CASE WHEN q.q1 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(q.q1, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN q.q2 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(q.q2, '%i:%s.%f')) ELSE 999999 END,
      CASE WHEN q.q3 REGEXP '^[0-9]+:[0-9]+\\.[0-9]+$' THEN TIME_TO_SEC(STR_TO_DATE(q.q3, '%i:%s.%f')) ELSE 999999 END
    )) AS SIGNED) AS bestMs
  FROM qualifying q
  JOIN races r ON r.raceId = q.raceId
  WHERE r.year = p_year
    AND q.position IS NOT NULL
  HAVING bestMs < 999999000;

  -- 2) poleMs por carrera (mínimo bestMs del P1, o mínimo absoluto si prefieres)
  INSERT INTO quali_pole_ms (raceId, poleMs)
  SELECT
    qbm.raceId,
    MIN(qbm.bestMs) AS poleMs
  FROM qualifying_best_ms qbm
  JOIN qualifying q ON q.raceId = qbm.raceId AND q.driverId = qbm.driverId
  WHERE q.position = 1
  GROUP BY qbm.raceId;

  -- 3) gap medio por equipo y carrera vs pole
  INSERT INTO team_quali_gap_per_race (raceId, constructorId, avgQualiGapMs)
  SELECT
    qbm.raceId,
    qbm.constructorId,
    AVG(qbm.bestMs - qpm.poleMs) AS avgQualiGapMs
  FROM qualifying_best_ms qbm
  JOIN quali_pole_ms qpm ON qpm.raceId = qbm.raceId
  GROUP BY qbm.raceId, qbm.constructorId;

END$$
DELIMITER ;

-- Ejemplo: refresca 2024
-- CALL refresh_quali_gap_tables(2024);

-- Recomendado tras cargas masivas:
ANALYZE TABLE qualifying_best_ms;
ANALYZE TABLE quali_pole_ms;
ANALYZE TABLE team_quali_gap_per_race;
