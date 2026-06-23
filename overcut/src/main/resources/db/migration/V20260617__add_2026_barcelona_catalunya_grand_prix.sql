-- 2026 Barcelona-Catalunya Grand Prix.
-- Continues after Monaco in V20260610.1__add_2026_season_events_to_monaco.sql.

START TRANSACTION;

-- Drivers.
SET @d_hamilton := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'hamilton' LIMIT 1), 1);
SET @d_alonso := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'alonso' LIMIT 1), 4);
SET @d_hulkenberg := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'hulkenberg' LIMIT 1), 807);
SET @d_perez := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'perez' LIMIT 1), 815);
SET @d_bottas := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'bottas' LIMIT 1), 822);
SET @d_verstappen := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'max_verstappen' LIMIT 1), 830);
SET @d_sainz := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'sainz' LIMIT 1), 832);
SET @d_ocon := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'ocon' LIMIT 1), 839);
SET @d_stroll := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'stroll' LIMIT 1), 840);
SET @d_gasly := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'gasly' LIMIT 1), 842);
SET @d_leclerc := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'leclerc' LIMIT 1), 844);
SET @d_norris := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'norris' LIMIT 1), 846);
SET @d_russell := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'russell' LIMIT 1), 847);
SET @d_albon := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'albon' LIMIT 1), 848);
SET @d_lawson := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'lawson' LIMIT 1), 859);
SET @d_bearman := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'bearman' LIMIT 1), 860);
SET @d_colapinto := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'colapinto' LIMIT 1), 861);
SET @d_antonelli := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'antonelli' LIMIT 1), 863);
SET @d_bortoleto := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'bortoleto' LIMIT 1), 864);
SET @d_hadjar := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'hadjar' LIMIT 1), 865);
SET @d_lindblad := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'lindblad' LIMIT 1), 866);
SET @d_piastri := COALESCE((SELECT driverId FROM drivers WHERE driverRef = 'piastri' LIMIT 1), 857);

-- Constructors.
SET @c_mclaren := 1;
SET @c_williams := 3;
SET @c_ferrari := 6;
SET @c_red_bull := 9;
SET @c_mercedes := 131;
SET @c_aston := 117;
SET @c_audi := COALESCE((SELECT constructorId FROM constructors WHERE constructorRef = 'audi' LIMIT 1), 216);
SET @c_cadillac := COALESCE((SELECT constructorId FROM constructors WHERE constructorRef = 'cadillac' LIMIT 1), 217);
SET @c_haas := 210;
SET @c_alpine := 214;
SET @c_rb := 215;

-- Circuits.
SET @circuit_catalunya := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'catalunya' LIMIT 1), 4);

-- Statuses.
SET @st_finished := COALESCE((SELECT statusId FROM status WHERE status = 'Finished' LIMIT 1), 1);
SET @st_engine := COALESCE((SELECT statusId FROM status WHERE status = 'Engine' LIMIT 1), 5);
SET @st_gearbox := COALESCE((SELECT statusId FROM status WHERE status = 'Gearbox' LIMIT 1), 6);
SET @st_electrical := COALESCE((SELECT statusId FROM status WHERE status = 'Electrical' LIMIT 1), 23);
SET @st_battery := COALESCE((SELECT statusId FROM status WHERE status = 'Battery' LIMIT 1), @st_electrical);
SET @st_mechanical := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Mechanical%' LIMIT 1), @st_engine);
SET @st_steering := COALESCE((SELECT statusId FROM status WHERE status = 'Steering' LIMIT 1), @st_mechanical);
SET @st_technical := COALESCE((SELECT statusId FROM status WHERE status = 'Technical' LIMIT 1), @st_mechanical);

-- Idempotency cleanup for Barcelona-Catalunya only.
DELETE FROM driverStandings WHERE raceId = 1175;
DELETE FROM constructorStandings WHERE raceId = 1175;
DELETE FROM pitstops WHERE raceId = 1175;
DELETE FROM qualifying WHERE raceId = 1175;
DELETE FROM results WHERE raceId = 1175;
DELETE FROM races WHERE raceId = 1175;

/* =========================
   RACE
   ========================= */
INSERT INTO races (
  raceId, year, round, circuitId, name, date, time, url,
  fp1_date, fp1_time, fp2_date, fp2_time, fp3_date, fp3_time,
  quali_date, quali_time, sprint_date, sprint_time
) VALUES
(1175, 2026, 7, @circuit_catalunya, 'Barcelona-Catalunya Grand Prix', '2026-06-14', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Barcelona-Catalunya_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-13', NULL, NULL, NULL);

/* =========================
   QUALIFYING
   ========================= */
INSERT INTO qualifying (qualifyId, raceId, driverId, constructorId, number, position, q1, q2, q3) VALUES
(11205,1175,@d_russell,@c_mercedes,63,1,'1:15.717','1:15.228','1:14.679'),
(11206,1175,@d_hamilton,@c_ferrari,44,2,'1:15.625','1:15.418','1:14.743'),
(11207,1175,@d_antonelli,@c_mercedes,12,3,'1:15.977','1:15.295','1:14.998'),
(11208,1175,@d_norris,@c_mclaren,1,4,'1:16.287','1:15.361','1:15.001'),
(11209,1175,@d_verstappen,@c_red_bull,3,5,'1:16.352','1:15.484','1:15.021'),
(11210,1175,@d_hadjar,@c_red_bull,6,6,'1:16.427','1:15.754','1:15.077'),
(11211,1175,@d_piastri,@c_mclaren,81,7,'1:16.138','1:15.518','1:15.090'),
(11212,1175,@d_lawson,@c_rb,30,8,'1:16.673','1:15.585','1:16.542'),
(11213,1175,@d_hulkenberg,@c_audi,27,9,'1:16.066','1:15.768','1:16.657'),
(11214,1175,@d_leclerc,@c_ferrari,16,10,'1:15.964','1:15.281',NULL),
(11215,1175,@d_lindblad,@c_rb,41,11,'1:16.425','1:15.840',NULL),
(11216,1175,@d_bortoleto,@c_audi,5,12,'1:16.616','1:16.001',NULL),
(11217,1175,@d_colapinto,@c_alpine,43,13,'1:16.590','1:16.191',NULL),
(11218,1175,@d_gasly,@c_alpine,10,14,'1:16.599','1:16.261',NULL),
(11219,1175,@d_bearman,@c_haas,87,15,'1:16.571','1:16.389',NULL),
(11220,1175,@d_sainz,@c_williams,55,16,'1:16.881','1:17.827',NULL),
(11221,1175,@d_ocon,@c_haas,31,17,'1:17.073',NULL,NULL),
(11222,1175,@d_albon,@c_williams,23,18,'1:17.424',NULL,NULL),
(11223,1175,@d_perez,@c_cadillac,11,19,'1:17.545',NULL,NULL),
(11224,1175,@d_bottas,@c_cadillac,77,20,'1:17.757',NULL,NULL),
(11225,1175,@d_stroll,@c_aston,18,21,'1:18.758',NULL,NULL),
(11226,1175,@d_alonso,@c_aston,14,22,'1:18.815',NULL,NULL);

/* =========================
   RACE RESULTS
   ========================= */
INSERT INTO results (
  raceId, driverId, constructorId, number, grid,
  position, positionOrder, positionText, points, laps,
  time, milliseconds, fastestLap, `rank`, fastestLapTime, fastestLapSpeed, statusId
) VALUES
(1175,@d_hamilton,@c_ferrari,44,2,1,1,'1',25,66,'1:32:28.105',NULL,44,1,'1:20.122',209.245,@st_finished),
(1175,@d_russell,@c_mercedes,63,1,2,2,'2',18,66,'+19.561',NULL,43,6,'1:20.640',207.901,@st_finished),
(1175,@d_norris,@c_mclaren,1,4,3,3,'3',15,66,'+23.719',NULL,37,4,'1:20.232',208.959,@st_finished),
(1175,@d_verstappen,@c_red_bull,3,5,4,4,'4',12,66,'+40.497',NULL,42,3,'1:20.230',208.964,@st_finished),
(1175,@d_piastri,@c_mclaren,81,7,5,5,'5',10,66,'+58.661',NULL,46,8,'1:20.835',207.400,@st_finished),
(1175,@d_hadjar,@c_red_bull,6,6,6,6,'6',8,65,'+1 lap',NULL,61,2,'1:20.150',209.172,@st_finished),
(1175,@d_gasly,@c_alpine,10,14,7,7,'7',6,65,'+1 lap',NULL,44,13,'1:21.960',204.553,@st_finished),
(1175,@d_lawson,@c_rb,30,8,8,8,'8',4,65,'+1 lap',NULL,46,17,'1:22.691',202.745,@st_finished),
(1175,@d_lindblad,@c_rb,41,11,9,9,'9',2,65,'+1 lap',NULL,46,12,'1:21.914',204.668,@st_finished),
(1175,@d_colapinto,@c_alpine,43,13,10,10,'10',1,65,'+1 lap',NULL,44,16,'1:22.449',203.340,@st_finished),
(1175,@d_bortoleto,@c_audi,5,12,11,11,'11',0,64,'+2 laps',NULL,57,9,'1:21.446',205.844,@st_finished),
(1175,@d_sainz,@c_williams,55,16,12,12,'12',0,64,'+2 laps',NULL,60,14,'1:22.061',204.301,@st_finished),
(1175,@d_ocon,@c_haas,31,17,13,13,'13',0,64,'+2 laps',NULL,65,10,'1:21.643',205.347,@st_finished),
(1175,@d_perez,@c_cadillac,11,19,14,14,'14',0,63,'+3 laps',NULL,45,18,'1:22.820',202.429,@st_finished),
(1175,@d_leclerc,@c_ferrari,16,10,15,15,'15',0,62,'Steering',NULL,47,5,'1:20.379',208.576,@st_steering),
(1175,@d_antonelli,@c_mercedes,12,3,16,16,'16',0,61,'Engine',NULL,46,7,'1:20.704',207.736,@st_engine),
(1175,@d_bearman,@c_haas,87,15,17,17,'17',0,60,'Technical',NULL,44,15,'1:22.419',203.414,@st_technical),
(1175,@d_albon,@c_williams,23,18,NULL,'NC',18,0,55,'+11 laps',NULL,65,11,'1:21.744',205.093,@st_finished),
(1175,@d_alonso,@c_aston,14,0,NULL,'R',19,0,37,'Battery',NULL,28,20,'1:25.366',196.392,@st_battery),
(1175,@d_hulkenberg,@c_audi,27,9,NULL,'R',20,0,29,'Technical',NULL,2,19,'1:23.447',200.908,@st_technical),
(1175,@d_bottas,@c_cadillac,77,20,NULL,'R',21,0,15,'Technical',NULL,3,21,'1:25.745',195.523,@st_technical),
(1175,@d_stroll,@c_aston,18,21,NULL,'R',22,0,5,'Gearbox',NULL,3,22,'1:25.904',195.162,@st_gearbox);

/* =========================
   PIT STOPS
   ========================= */
INSERT INTO pitstops (raceId, driverId, stop, lap, time, duration, milliseconds) VALUES
(1175,@d_hamilton,1,11,'15:18:43','22.480',NULL),
(1175,@d_lawson,1,11,'15:19:05','25.983',NULL),
(1175,@d_russell,1,12,'15:20:03','22.080',NULL),
(1175,@d_verstappen,1,12,'15:20:15','22.273',NULL),
(1175,@d_colapinto,1,12,'15:20:38','22.983',NULL),
(1175,@d_perez,1,12,'15:20:52','24.805',NULL),
(1175,@d_norris,1,13,'15:21:34','21.791',NULL),
(1175,@d_hulkenberg,1,13,'15:21:58','22.869',NULL),
(1175,@d_ocon,1,13,'15:22:13','23.256',NULL),
(1175,@d_albon,1,13,'15:22:15','24.005',NULL),
(1175,@d_antonelli,1,14,'15:22:55','22.038',NULL),
(1175,@d_piastri,1,14,'15:23:07','21.776',NULL),
(1175,@d_gasly,1,14,'15:23:31','22.682',NULL),
(1175,@d_sainz,1,14,'15:23:35','22.977',NULL),
(1175,@d_bottas,1,14,'15:23:59','23.280',NULL),
(1175,@d_hadjar,1,15,'15:24:48','22.444',NULL),
(1175,@d_bortoleto,1,15,'15:25:07','22.783',NULL),
(1175,@d_leclerc,1,16,'15:25:51','22.249',NULL),
(1175,@d_bearman,1,18,'15:29:25','23.118',NULL),
(1175,@d_alonso,1,21,'15:34:11','22.220',NULL),
(1175,@d_lindblad,1,22,'15:34:58','22.476',NULL),
(1175,@d_hamilton,2,27,'15:41:05','22.477',NULL),
(1175,@d_verstappen,2,29,'15:44:04','24.189',NULL),
(1175,@d_albon,2,29,'15:45:34','22.027',NULL),
(1175,@d_sainz,2,30,'15:46:35','22.595',NULL),
(1175,@d_perez,2,31,'15:48:37','24.432',NULL),
(1175,@d_hadjar,2,32,'15:48:46','22.528',NULL),
(1175,@d_bortoleto,2,33,'15:50:58','22.285',NULL),
(1175,@d_colapinto,2,34,'15:52:02','22.290',NULL),
(1175,@d_norris,2,35,'15:52:14','22.041',NULL),
(1175,@d_ocon,2,34,'15:52:35','26.449',NULL),
(1175,@d_lawson,2,35,'15:53:25','23.172',NULL),
(1175,@d_russell,2,36,'15:53:32','21.677',NULL),
(1175,@d_piastri,2,36,'15:53:56','22.661',NULL),
(1175,@d_antonelli,2,37,'15:54:54','22.210',NULL),
(1175,@d_lindblad,2,37,'15:56:31','24.010',NULL),
(1175,@d_leclerc,2,39,'15:57:58','22.125',NULL),
(1175,@d_verstappen,3,40,'15:59:35','22.786',NULL),
(1175,@d_bearman,2,39,'15:59:42','23.901',NULL),
(1175,@d_perez,3,39,'16:00:43','23.912',NULL),
(1175,@d_hamilton,3,41,'16:00:50','22.837',NULL),
(1175,@d_gasly,2,40,'16:00:55','23.310',NULL),
(1175,@d_bortoleto,3,53,'16:19:54','25.915',NULL),
(1175,@d_sainz,3,55,'16:22:41','22.772',NULL),
(1175,@d_hadjar,3,58,'16:25:31','21.949',NULL),
(1175,@d_ocon,3,58,'16:27:21','22.965',NULL),
(1175,@d_albon,4,50,'16:28:24','22.703',NULL);

/* =========================
   STANDINGS GENERATED FROM 2026 RESULTS + SPRINTS
   ========================= */
INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1175, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 7
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 7
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1175, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 7
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 7
    ) x GROUP BY constructorId
  ) y
) ranked;

COMMIT;
