-- 2026 season: rounds 8-11 (Austria, Great Britain, Belgium, Hungary).
-- Continues after Barcelona-Catalunya in V20260617__add_2026_barcelona_catalunya_grand_prix.sql.
-- Race IDs continue after 1175; qualifying IDs continue after 11226.

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
SET @circuit_red_bull_ring := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'red_bull_ring' LIMIT 1), 70);
SET @circuit_silverstone := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'silverstone' LIMIT 1), 9);
SET @circuit_spa := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'spa' LIMIT 1), 13);
SET @circuit_hungaroring := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'hungaroring' LIMIT 1), 11);

-- Statuses.
SET @st_finished := COALESCE((SELECT statusId FROM status WHERE status = 'Finished' LIMIT 1), 1);
SET @st_accident := COALESCE((SELECT statusId FROM status WHERE status = 'Accident' LIMIT 1), 3);
SET @st_collision := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Collision%' LIMIT 1), 4);
SET @st_engine := COALESCE((SELECT statusId FROM status WHERE status = 'Engine' LIMIT 1), 5);
SET @st_gearbox := COALESCE((SELECT statusId FROM status WHERE status = 'Gearbox' LIMIT 1), 6);
SET @st_electrical := COALESCE((SELECT statusId FROM status WHERE status = 'Electrical' LIMIT 1), 23);
SET @st_suspension := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Suspension%' LIMIT 1), 22);
SET @st_brakes := COALESCE((SELECT statusId FROM status WHERE status = 'Brakes' LIMIT 1), 37);
SET @st_ers := COALESCE((SELECT statusId FROM status WHERE status LIKE 'ERS%' LIMIT 1), @st_electrical);
SET @st_spun_off := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Spun off%' LIMIT 1), @st_accident);
SET @st_withdrew := COALESCE((SELECT statusId FROM status WHERE status = 'Withdrew' LIMIT 1), @st_finished);

-- Idempotency cleanup for this migration range only.
DELETE FROM driverStandings WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM constructorStandings WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM pitstops WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM sprintResults WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM qualifying WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM results WHERE raceId BETWEEN 1176 AND 1179;
DELETE FROM races WHERE raceId BETWEEN 1176 AND 1179;

/* =========================
   RACES
   ========================= */
INSERT INTO races (
  raceId, year, round, circuitId, name, date, time, url,
  fp1_date, fp1_time, fp2_date, fp2_time, fp3_date, fp3_time,
  quali_date, quali_time, sprint_date, sprint_time
) VALUES
(1176, 2026, 8, @circuit_red_bull_ring, 'Austrian Grand Prix', '2026-06-28', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Austrian_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-27', NULL, NULL, NULL),
(1177, 2026, 9, @circuit_silverstone, 'British Grand Prix', '2026-07-05', '15:00:00', 'https://en.wikipedia.org/wiki/2026_British_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-04', NULL, '2026-07-04', NULL),
(1178, 2026, 10, @circuit_spa, 'Belgian Grand Prix', '2026-07-19', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Belgian_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-18', NULL, NULL, NULL),
(1179, 2026, 11, @circuit_hungaroring, 'Hungarian Grand Prix', '2026-07-26', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Hungarian_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-07-25', NULL, NULL, NULL);

/* =========================
   QUALIFYING
   ========================= */
INSERT INTO qualifying (qualifyId, raceId, driverId, constructorId, number, position, q1, q2, q3) VALUES
-- 2026 Austrian Grand Prix
(11227,1176,@d_russell,@c_mercedes,63,1,'1:07.398','1:06.979','1:06.113'),
(11228,1176,@d_leclerc,@c_ferrari,16,2,'1:07.543','1:07.030','1:06.349'),
(11229,1176,@d_hamilton,@c_ferrari,44,3,'1:07.290','1:06.994','1:06.408'),
(11230,1176,@d_antonelli,@c_mercedes,12,4,'1:07.083','1:06.763','1:06.414'),
(11231,1176,@d_verstappen,@c_red_bull,3,5,'1:07.407','1:07.183','1:06.475'),
(11232,1176,@d_norris,@c_mclaren,1,6,'1:07.259','1:06.897','1:06.502'),
(11233,1176,@d_piastri,@c_mclaren,81,7,'1:07.487','1:06.890','1:06.511'),
(11234,1176,@d_hadjar,@c_red_bull,6,8,'1:07.408','1:07.086','1:06.632'),
(11235,1176,@d_lawson,@c_rb,30,9,'1:07.385','1:07.136','1:06.955'),
(11236,1176,@d_lindblad,@c_rb,41,10,'1:07.549','1:07.155','1:07.007'),
(11237,1176,@d_gasly,@c_alpine,10,11,'1:08.038','1:07.223',NULL),
(11238,1176,@d_bortoleto,@c_audi,5,12,'1:08.035','1:07.293',NULL),
(11239,1176,@d_bearman,@c_haas,87,13,'1:08.061','1:07.523',NULL),
(11240,1176,@d_hulkenberg,@c_audi,27,14,'1:08.066','1:07.611',NULL),
(11241,1176,@d_ocon,@c_haas,31,15,'1:08.231','1:07.817',NULL),
(11242,1176,@d_colapinto,@c_alpine,43,16,'1:07.894','1:08.171',NULL),
(11243,1176,@d_sainz,@c_williams,55,17,'1:08.252',NULL,NULL),
(11244,1176,@d_albon,@c_williams,23,18,'1:08.509',NULL,NULL),
(11245,1176,@d_perez,@c_cadillac,11,19,'1:08.945',NULL,NULL),
(11246,1176,@d_bottas,@c_cadillac,77,20,'1:09.030',NULL,NULL),
(11247,1176,@d_alonso,@c_aston,14,21,'1:09.942',NULL,NULL),
(11248,1176,@d_stroll,@c_aston,18,22,'1:10.363',NULL,NULL),
-- 2026 British Grand Prix
(11249,1177,@d_antonelli,@c_mercedes,12,1,'1:29.719','1:28.493','1:28.111'),
(11250,1177,@d_leclerc,@c_ferrari,16,2,'1:29.534','1:28.626','1:28.286'),
(11251,1177,@d_hamilton,@c_ferrari,44,3,'1:29.644','1:28.864','1:28.458'),
(11252,1177,@d_russell,@c_mercedes,63,4,'1:29.985','1:28.920','1:28.481'),
(11253,1177,@d_hadjar,@c_red_bull,6,5,'1:29.276','1:29.069','1:28.746'),
(11254,1177,@d_norris,@c_mclaren,1,6,'1:30.186','1:29.383','1:28.877'),
(11255,1177,@d_verstappen,@c_red_bull,3,7,'1:29.549','1:29.113','1:28.893'),
(11256,1177,@d_piastri,@c_mclaren,81,8,'1:29.971','1:29.218','1:29.032'),
(11257,1177,@d_lindblad,@c_rb,41,9,'1:29.661','1:29.324','1:29.305'),
(11258,1177,@d_lawson,@c_rb,30,10,'1:29.300','1:29.429','1:29.716'),
(11259,1177,@d_bortoleto,@c_audi,5,11,'1:30.269','1:29.461',NULL),
(11260,1177,@d_gasly,@c_alpine,10,12,'1:30.345','1:30.063',NULL),
(11261,1177,@d_hulkenberg,@c_audi,27,13,'1:29.539','1:30.076',NULL),
(11262,1177,@d_bearman,@c_haas,87,14,'1:30.570','1:30.501',NULL),
(11263,1177,@d_sainz,@c_williams,55,15,'1:30.562','1:30.623',NULL),
(11264,1177,@d_albon,@c_williams,23,16,'1:30.638','1:31.341',NULL),
(11265,1177,@d_ocon,@c_haas,31,17,'1:30.680',NULL,NULL),
(11266,1177,@d_bottas,@c_cadillac,77,18,'1:31.227',NULL,NULL),
(11267,1177,@d_colapinto,@c_alpine,43,19,'1:31.321',NULL,NULL),
(11268,1177,@d_perez,@c_cadillac,11,20,'1:31.451',NULL,NULL),
(11269,1177,@d_stroll,@c_aston,18,21,'1:32.863',NULL,NULL),
(11270,1177,@d_alonso,@c_aston,14,22,'1:33.025',NULL,NULL),
-- 2026 Belgian Grand Prix
(11271,1178,@d_antonelli,@c_mercedes,12,1,'1:46.304','1:45.142','1:44.361'),
(11272,1178,@d_verstappen,@c_red_bull,3,2,'1:45.930','1:45.589','1:44.678'),
(11273,1178,@d_norris,@c_mclaren,1,3,'1:45.865','1:45.454','1:44.801'),
(11274,1178,@d_russell,@c_mercedes,63,4,'1:46.185','1:45.689','1:44.869'),
(11275,1178,@d_leclerc,@c_ferrari,16,5,'1:46.278','1:45.397','1:44.893'),
(11276,1178,@d_hamilton,@c_ferrari,44,6,'1:46.124','1:45.543','1:44.895'),
(11277,1178,@d_piastri,@c_mclaren,81,7,'1:46.433','1:45.671','1:45.016'),
(11278,1178,@d_lindblad,@c_rb,41,8,'1:46.191','1:45.629','1:45.143'),
(11279,1178,@d_bortoleto,@c_audi,5,9,'1:46.609','1:46.082','1:45.628'),
(11280,1178,@d_hadjar,@c_red_bull,6,10,'1:46.062','1:45.823',NULL),
(11281,1178,@d_lawson,@c_rb,30,11,'1:46.501','1:46.120',NULL),
(11282,1178,@d_gasly,@c_alpine,10,12,'1:46.679','1:46.331',NULL),
(11283,1178,@d_colapinto,@c_alpine,43,13,'1:46.795','1:46.392',NULL),
(11284,1178,@d_hulkenberg,@c_audi,27,14,'1:46.893','1:46.671',NULL),
(11285,1178,@d_sainz,@c_williams,55,15,'1:47.080','1:46.777',NULL),
(11286,1178,@d_bearman,@c_haas,87,16,'1:47.113','1:46.779',NULL),
(11287,1178,@d_albon,@c_williams,23,17,'1:47.120',NULL,NULL),
(11288,1178,@d_ocon,@c_haas,31,18,'1:47.801',NULL,NULL),
(11289,1178,@d_bottas,@c_cadillac,77,19,'1:47.823',NULL,NULL),
(11290,1178,@d_perez,@c_cadillac,11,20,'1:47.971',NULL,NULL),
(11291,1178,@d_alonso,@c_aston,14,21,'1:50.002',NULL,NULL),
(11292,1178,@d_stroll,@c_aston,18,22,'1:50.177',NULL,NULL),
-- 2026 Hungarian Grand Prix
(11293,1179,@d_norris,@c_mclaren,1,1,'1:18.277','1:17.456','1:17.207'),
(11294,1179,@d_hamilton,@c_ferrari,44,2,'1:18.730','1:17.803','1:17.219'),
(11295,1179,@d_leclerc,@c_ferrari,16,3,'1:18.984','1:17.626','1:17.445'),
(11296,1179,@d_antonelli,@c_mercedes,12,4,'1:18.726','1:18.393','1:17.479'),
(11297,1179,@d_piastri,@c_mclaren,81,5,'1:18.891','1:17.928','1:17.684'),
(11298,1179,@d_verstappen,@c_red_bull,3,6,'1:18.656','1:18.249','1:17.725'),
(11299,1179,@d_russell,@c_mercedes,63,7,'1:18.856','1:18.445','1:17.760'),
(11300,1179,@d_hadjar,@c_red_bull,6,8,'1:18.754','1:17.872','1:17.856'),
(11301,1179,@d_lindblad,@c_rb,41,9,'1:19.233','1:18.360','1:18.281'),
(11302,1179,@d_hulkenberg,@c_audi,27,10,'1:18.796','1:18.639','1:18.686'),
(11303,1179,@d_lawson,@c_rb,30,11,'1:19.161','1:18.765',NULL),
(11304,1179,@d_gasly,@c_alpine,10,12,'1:19.741','1:18.844',NULL),
(11305,1179,@d_colapinto,@c_alpine,43,13,'1:19.771','1:19.027',NULL),
(11306,1179,@d_bortoleto,@c_audi,5,14,'1:19.069','1:19.105',NULL),
(11307,1179,@d_ocon,@c_haas,31,15,'1:20.010','1:19.734',NULL),
(11308,1179,@d_alonso,@c_aston,14,16,'1:20.126','1:19.808',NULL),
(11309,1179,@d_bearman,@c_haas,87,17,'1:20.233',NULL,NULL),
(11310,1179,@d_sainz,@c_williams,55,18,'1:20.621',NULL,NULL),
(11311,1179,@d_albon,@c_williams,23,19,'1:20.658',NULL,NULL),
(11312,1179,@d_stroll,@c_aston,18,20,'1:20.659',NULL,NULL),
(11313,1179,@d_bottas,@c_cadillac,77,21,'1:20.886',NULL,NULL),
(11314,1179,@d_perez,@c_cadillac,11,22,'1:21.322',NULL,NULL);

/* =========================
   SPRINT RESULTS
   ========================= */
INSERT INTO sprintResults (
  raceId, driverId, constructorId, number, grid,
  position, positionText, positionOrder, points, laps, time, milliseconds, statusId
) VALUES
-- Great Britain
(1177,@d_antonelli,@c_mercedes,12,2,1,'1',1,8,17,'26:12.129',NULL,@st_finished),
(1177,@d_hamilton,@c_ferrari,44,1,2,'2',2,7,17,'+2.745',NULL,@st_finished),
(1177,@d_norris,@c_mclaren,1,6,3,'3',3,6,17,'+9.783',NULL,@st_finished),
(1177,@d_russell,@c_mercedes,63,5,4,'4',4,5,17,'+10.639',NULL,@st_finished),
(1177,@d_leclerc,@c_ferrari,16,4,5,'5',5,4,17,'+12.620',NULL,@st_finished),
(1177,@d_verstappen,@c_red_bull,3,3,6,'6',6,3,17,'+16.550',NULL,@st_finished),
(1177,@d_piastri,@c_mclaren,81,7,7,'7',7,2,17,'+17.551',NULL,@st_finished),
(1177,@d_lawson,@c_rb,30,9,8,'8',8,1,17,'+30.233',NULL,@st_finished),
(1177,@d_hadjar,@c_red_bull,6,8,9,'9',9,0,17,'+30.953',NULL,@st_finished),
(1177,@d_lindblad,@c_rb,41,10,10,'10',10,0,17,'+35.110',NULL,@st_finished),
(1177,@d_gasly,@c_alpine,10,11,11,'11',11,0,17,'+40.273',NULL,@st_finished),
(1177,@d_colapinto,@c_alpine,43,14,12,'12',12,0,17,'+41.026',NULL,@st_finished),
(1177,@d_bortoleto,@c_audi,5,12,13,'13',13,0,17,'+42.499',NULL,@st_finished),
(1177,@d_bearman,@c_haas,87,16,14,'14',14,0,17,'+45.784',NULL,@st_finished),
(1177,@d_hulkenberg,@c_audi,27,13,15,'15',15,0,17,'+46.680',NULL,@st_finished),
(1177,@d_ocon,@c_haas,31,17,16,'16',16,0,17,'+49.810',NULL,@st_finished),
(1177,@d_sainz,@c_williams,55,15,17,'17',17,0,17,'+50.379',NULL,@st_finished),
(1177,@d_albon,@c_williams,23,0,18,'18',18,0,17,'+50.757',NULL,@st_finished),
(1177,@d_bottas,@c_cadillac,77,19,19,'19',19,0,17,'+1:15.117',NULL,@st_finished),
(1177,@d_alonso,@c_aston,14,20,20,'20',20,0,17,'+1:31.872',NULL,@st_finished),
(1177,@d_stroll,@c_aston,18,21,21,'21',21,0,16,'+1 lap',NULL,@st_finished),
(1177,@d_perez,@c_cadillac,11,18,22,'22',22,0,16,'+1 lap',NULL,@st_finished);

/* =========================
   RACE RESULTS
   ========================= */
INSERT INTO results (
  raceId, driverId, constructorId, number, grid,
  position, positionText, positionOrder, points, laps,
  time, milliseconds, fastestLap, `rank`, fastestLapTime, fastestLapSpeed, statusId
) VALUES
-- Austria
(1176,@d_russell,@c_mercedes,63,1,1,'1',1,25,71,'1:26:37.979',NULL,49,6,'1:10.683',220.330,@st_finished),
(1176,@d_verstappen,@c_red_bull,3,5,2,'2',2,18,71,'+1.611',NULL,57,2,'1:10.483',220.955,@st_finished),
(1176,@d_antonelli,@c_mercedes,12,4,3,'3',3,15,71,'+1.986',NULL,59,1,'1:10.374',221.297,@st_finished),
(1176,@d_piastri,@c_mclaren,81,7,4,'4',4,12,71,'+21.809',NULL,45,3,'1:10.595',220.604,@st_finished),
(1176,@d_hamilton,@c_ferrari,44,3,5,'5',5,10,71,'+26.393',NULL,45,7,'1:10.946',219.513,@st_finished),
(1176,@d_hadjar,@c_red_bull,6,8,6,'6',6,8,71,'+29.399',NULL,42,8,'1:10.947',219.510,@st_finished),
(1176,@d_norris,@c_mclaren,1,6,7,'7',7,6,71,'+31.505',NULL,55,5,'1:10.652',220.426,@st_finished),
(1176,@d_leclerc,@c_ferrari,16,2,8,'8',8,4,71,'+45.659',NULL,67,4,'1:10.606',220.570,@st_finished),
(1176,@d_lawson,@c_rb,30,9,9,'9',9,2,70,'+1 lap',NULL,55,10,'1:11.547',217.669,@st_finished),
(1176,@d_lindblad,@c_rb,41,10,10,'10',10,1,70,'+1 lap',NULL,57,11,'1:11.587',217.547,@st_finished),
(1176,@d_bortoleto,@c_audi,5,12,11,'11',11,0,70,'+1 lap',NULL,60,14,'1:11.866',216.703,@st_finished),
(1176,@d_hulkenberg,@c_audi,27,14,12,'12',12,0,70,'+1 lap',NULL,56,12,'1:11.634',217.405,@st_finished),
(1176,@d_gasly,@c_alpine,10,11,13,'13',13,0,70,'+1 lap',NULL,55,9,'1:11.466',217.916,@st_finished),
(1176,@d_bearman,@c_haas,87,13,14,'14',14,0,70,'+1 lap',NULL,55,15,'1:12.207',215.679,@st_finished),
(1176,@d_colapinto,@c_alpine,43,16,15,'15',15,0,70,'+1 lap',NULL,50,13,'1:11.795',216.917,@st_finished),
(1176,@d_ocon,@c_haas,31,15,16,'16',16,0,69,'+2 laps',NULL,38,17,'1:12.979',213.398,@st_finished),
(1176,@d_albon,@c_williams,23,18,17,'17',17,0,69,'+2 laps',NULL,44,18,'1:13.137',212.937,@st_finished),
(1176,@d_alonso,@c_aston,14,21,18,'18',18,0,68,'+3 laps',NULL,54,16,'1:12.501',214.805,@st_finished),
(1176,@d_stroll,@c_aston,18,22,NULL,'R',19,0,45,'ERS',NULL,31,20,'1:13.796',211.035,@st_ers),
(1176,@d_sainz,@c_williams,55,17,NULL,'R',20,0,23,'Electrical',NULL,22,19,'1:13.694',211.327,@st_electrical),
(1176,@d_perez,@c_cadillac,11,19,NULL,'R',21,0,4,'Brakes',NULL,3,21,'1:14.448',209.187,@st_brakes),
(1176,@d_bottas,@c_cadillac,77,20,NULL,'R',22,0,2,'Brakes',NULL,NULL,NULL,NULL,NULL,@st_brakes),
-- Great Britain
(1177,@d_leclerc,@c_ferrari,16,2,1,'1',1,25,52,'1:27:11.335',NULL,43,8,'1:32.871',228.355,@st_finished),
(1177,@d_russell,@c_mercedes,63,4,2,'2',2,18,52,'+0.427',NULL,36,5,'1:32.489',229.298,@st_finished),
(1177,@d_hamilton,@c_ferrari,44,3,3,'3',3,15,52,'+0.772',NULL,25,4,'1:32.309',229.745,@st_finished),
(1177,@d_norris,@c_mclaren,1,6,4,'4',4,12,52,'+1.149',NULL,45,6,'1:32.625',228.961,@st_finished),
(1177,@d_hadjar,@c_red_bull,6,5,5,'5',5,10,52,'+1.598',NULL,40,3,'1:32.268',229.847,@st_finished),
(1177,@d_lawson,@c_rb,30,10,6,'6',6,8,52,'+2.023',NULL,45,12,'1:33.648',226.460,@st_finished),
(1177,@d_lindblad,@c_rb,41,9,7,'7',7,6,52,'+2.214',NULL,29,11,'1:33.632',226.499,@st_finished),
(1177,@d_bortoleto,@c_audi,5,11,8,'8',8,4,52,'+2.413',NULL,30,13,'1:33.650',226.455,@st_finished),
(1177,@d_colapinto,@c_alpine,43,19,9,'9',9,2,52,'+3.229',NULL,25,16,'1:34.281',224.940,@st_finished),
(1177,@d_gasly,@c_alpine,10,15,10,'10',10,1,52,'+3.445',NULL,44,15,'1:34.179',225.183,@st_finished),
(1177,@d_piastri,@c_mclaren,81,8,11,'11',11,0,52,'+4.014',NULL,43,9,'1:32.917',228.242,@st_finished),
(1177,@d_bearman,@c_haas,87,13,12,'12',12,0,52,'+5.245',NULL,32,17,'1:34.455',224.525,@st_finished),
(1177,@d_ocon,@c_haas,31,17,13,'13',13,0,52,'+5.512',NULL,44,18,'1:34.792',223.727,@st_finished),
(1177,@d_perez,@c_cadillac,11,20,14,'14',14,0,52,'+7.403',NULL,45,19,'1:35.520',222.022,@st_finished),
(1177,@d_antonelli,@c_mercedes,12,1,15,'15',15,0,52,'+8.005',NULL,37,1,'1:31.777',231.077,@st_finished),
(1177,@d_bottas,@c_cadillac,77,18,16,'16',16,0,52,'+8.162',NULL,32,21,'1:35.893',221.159,@st_finished),
(1177,@d_sainz,@c_williams,55,14,17,'17',17,0,51,'+1 lap',NULL,51,7,'1:32.734',228.692,@st_finished),
(1177,@d_alonso,@c_aston,14,0,18,'18',18,0,51,'+1 lap',NULL,51,20,'1:35.827',221.311,@st_finished),
(1177,@d_stroll,@c_aston,18,22,19,'19',19,0,51,'+1 lap',NULL,43,22,'1:37.232',218.113,@st_finished),
(1177,@d_verstappen,@c_red_bull,3,7,20,'20',20,0,46,'Spun off',NULL,40,2,'1:32.101',230.264,@st_spun_off),
(1177,@d_albon,@c_williams,23,16,NULL,'R',21,0,43,'Withdrew',NULL,45,14,'1:33.867',225.932,@st_withdrew),
(1177,@d_hulkenberg,@c_audi,27,12,NULL,'R',22,0,36,'Gearbox',NULL,37,10,'1:33.433',226.981,@st_gearbox),
-- Belgium
(1178,@d_antonelli,@c_mercedes,12,1,1,'1',1,25,44,'1:24:42.479',NULL,41,2,'1:49.098',231.116,@st_finished),
(1178,@d_leclerc,@c_ferrari,16,4,2,'2',2,18,44,'+1.952',NULL,23,4,'1:49.333',230.620,@st_finished),
(1178,@d_verstappen,@c_red_bull,3,2,3,'3',3,15,44,'+11.586',NULL,23,7,'1:49.618',230.020,@st_finished),
(1178,@d_hamilton,@c_ferrari,44,5,4,'4',4,12,44,'+17.245',NULL,33,5,'1:49.454',230.365,@st_finished),
(1178,@d_piastri,@c_mclaren,81,6,5,'5',5,10,44,'+18.988',NULL,23,6,'1:49.562',230.138,@st_finished),
(1178,@d_hadjar,@c_red_bull,6,21,6,'6',6,8,44,'+23.307',NULL,44,3,'1:49.298',230.694,@st_finished),
(1178,@d_norris,@c_mclaren,1,13,7,'7',7,6,44,'+24.014',NULL,44,1,'1:48.890',231.558,@st_finished),
(1178,@d_bortoleto,@c_audi,5,8,8,'8',8,4,44,'+49.140',NULL,22,8,'1:50.334',228.527,@st_finished),
(1178,@d_lindblad,@c_rb,41,7,9,'9',9,2,44,'+50.406',NULL,23,10,'1:50.536',228.110,@st_finished),
(1178,@d_colapinto,@c_alpine,43,11,10,'10',10,1,44,'+1:16.037',NULL,42,14,'1:51.162',226.825,@st_finished),
(1178,@d_gasly,@c_alpine,10,10,11,'11',11,0,44,'+1:16.991',NULL,39,12,'1:51.101',226.950,@st_finished),
(1178,@d_lawson,@c_rb,30,9,12,'12',12,0,44,'+1:17.523',NULL,44,11,'1:51.075',227.003,@st_finished),
(1178,@d_hulkenberg,@c_audi,27,12,13,'13',13,0,44,'+1:18.348',NULL,41,9,'1:50.503',228.178,@st_finished),
(1178,@d_bearman,@c_haas,87,14,14,'14',14,0,44,'+1:34.465',NULL,22,13,'1:51.109',226.933,@st_finished),
(1178,@d_albon,@c_williams,23,15,15,'15',15,0,44,'+1:44.684',NULL,21,16,'1:51.894',225.341,@st_finished),
(1178,@d_sainz,@c_williams,55,19,16,'16',16,0,44,'+1:45.856',NULL,24,15,'1:51.363',226.416,@st_finished),
(1178,@d_ocon,@c_haas,31,16,17,'17',17,0,44,'+1:50.925',NULL,44,17,'1:51.900',225.329,@st_finished),
(1178,@d_bottas,@c_cadillac,77,17,18,'18',18,0,43,'+1 lap',NULL,36,18,'1:52.011',225.106,@st_finished),
(1178,@d_alonso,@c_aston,14,22,19,'19',19,0,42,'+2 laps',NULL,35,19,'1:52.948',223.239,@st_finished),
(1178,@d_stroll,@c_aston,18,20,NULL,'R',20,0,25,'Gearbox',NULL,21,21,'1:53.980',221.217,@st_gearbox),
(1178,@d_perez,@c_cadillac,11,18,NULL,'R',21,0,13,'Suspension',NULL,10,20,'1:53.520',222.114,@st_suspension),
(1178,@d_russell,@c_mercedes,63,3,NULL,'R',22,0,0,'Collision',NULL,NULL,NULL,NULL,NULL,@st_collision),
-- Hungary
(1179,@d_norris,@c_mclaren,1,1,1,'1',1,25,70,'1:39:56.180',NULL,64,4,'1:22.491',191.191,@st_finished),
(1179,@d_verstappen,@c_red_bull,3,4,2,'2',2,18,70,'+15.080',NULL,66,8,'1:23.433',189.033,@st_finished),
(1179,@d_antonelli,@c_mercedes,12,7,3,'3',3,15,70,'+18.728',NULL,58,3,'1:22.415',191.368,@st_finished),
(1179,@d_leclerc,@c_ferrari,16,2,4,'4',4,12,70,'+23.840',NULL,58,1,'1:22.000',192.336,@st_finished),
(1179,@d_hamilton,@c_ferrari,44,5,5,'5',5,10,70,'+24.540',NULL,59,2,'1:22.300',191.635,@st_finished),
(1179,@d_hadjar,@c_red_bull,6,8,6,'6',6,8,70,'+55.488',NULL,45,7,'1:23.218',189.521,@st_finished),
(1179,@d_russell,@c_mercedes,63,6,7,'7',7,6,70,'+57.503',NULL,58,5,'1:22.589',190.964,@st_finished),
(1179,@d_lawson,@c_rb,30,11,8,'8',8,4,69,'+1 lap',NULL,65,11,'1:23.900',187.980,@st_finished),
(1179,@d_hulkenberg,@c_audi,27,10,9,'9',9,2,69,'+1 lap',NULL,68,12,'1:23.964',187.837,@st_finished),
(1179,@d_lindblad,@c_rb,41,9,10,'10',10,1,69,'+1 lap',NULL,47,20,'1:25.931',183.537,@st_finished),
(1179,@d_bortoleto,@c_audi,5,14,11,'11',11,0,69,'+1 lap',NULL,33,15,'1:24.783',186.023,@st_finished),
(1179,@d_gasly,@c_alpine,10,12,12,'12',12,0,69,'+1 lap',NULL,58,6,'1:22.871',190.315,@st_finished),
(1179,@d_stroll,@c_aston,18,20,13,'13',13,0,69,'+1 lap',NULL,58,14,'1:24.718',186.165,@st_finished),
(1179,@d_alonso,@c_aston,14,16,14,'14',14,0,69,'+1 lap',NULL,58,9,'1:23.679',188.477,@st_finished),
(1179,@d_colapinto,@c_alpine,43,13,15,'15',15,0,68,'+2 laps',NULL,41,13,'1:24.624',186.372,@st_finished),
(1179,@d_ocon,@c_haas,31,15,16,'16',16,0,68,'+2 laps',NULL,63,19,'1:25.889',183.627,@st_finished),
(1179,@d_albon,@c_williams,23,19,17,'17',17,0,68,'+2 laps',NULL,59,17,'1:25.403',184.672,@st_finished),
(1179,@d_sainz,@c_williams,55,18,18,'18',18,0,68,'+2 laps',NULL,58,16,'1:24.864',185.845,@st_finished),
(1179,@d_bearman,@c_haas,87,17,19,'19',19,0,68,'+2 laps',NULL,24,18,'1:25.884',183.638,@st_finished),
(1179,@d_piastri,@c_mclaren,81,3,NULL,'R',20,0,55,'Gearbox',NULL,35,10,'1:23.896',187.989,@st_gearbox),
(1179,@d_perez,@c_cadillac,11,0,NULL,'R',21,0,48,'Suspension',NULL,24,21,'1:26.342',182.664,@st_suspension),
(1179,@d_bottas,@c_cadillac,77,21,NULL,'R',22,0,13,'Brakes',NULL,4,22,'1:27.959',179.306,@st_brakes);

/* =========================
   PIT STOPS
   ========================= */
INSERT INTO pitstops (raceId, driverId, stop, lap, time, duration, milliseconds) VALUES
-- Austria
(1176,@d_hamilton,1,12,'15:17:52','21.369',NULL),(1176,@d_leclerc,1,13,'15:19:10','21.731',NULL),
(1176,@d_gasly,1,13,'15:19:33','21.600',NULL),(1176,@d_sainz,1,14,'15:20:51','21.371',NULL),
(1176,@d_bortoleto,1,17,'15:24:22','22.605',NULL),(1176,@d_verstappen,1,18,'15:25:08','21.317',NULL),
(1176,@d_hadjar,1,18,'15:25:21','21.770',NULL),(1176,@d_lindblad,1,18,'15:25:32','21.408',NULL),
(1176,@d_ocon,1,18,'15:25:50','21.878',NULL),(1176,@d_albon,1,18,'15:25:53','21.249',NULL),
(1176,@d_russell,1,19,'15:26:16','21.204',NULL),(1176,@d_piastri,1,19,'15:26:31','22.077',NULL),
(1176,@d_lawson,1,19,'15:26:44','22.022',NULL),(1176,@d_colapinto,1,20,'15:28:24','21.561',NULL),
(1176,@d_norris,1,21,'15:29:01','21.578',NULL),(1176,@d_hulkenberg,1,21,'15:29:31','21.585',NULL),
(1176,@d_antonelli,1,24,'15:32:30','21.413',NULL),(1176,@d_bearman,1,24,'15:33:29','21.593',NULL),
(1176,@d_alonso,1,24,'15:33:56','22.358',NULL),(1176,@d_stroll,1,24,'15:34:04','23.522',NULL),
(1176,@d_hamilton,2,25,'15:34:17','21.250',NULL),(1176,@d_ocon,2,33,'15:45:18','25.455',NULL),
(1176,@d_leclerc,2,37,'15:49:12','21.020',NULL),(1176,@d_albon,2,37,'15:50:22','21.270',NULL),
(1176,@d_gasly,2,38,'15:51:10','21.212',NULL),(1176,@d_hadjar,2,40,'15:52:52','21.268',NULL),
(1176,@d_piastri,2,42,'15:55:11','21.209',NULL),(1176,@d_hamilton,3,42,'15:55:13','21.267',NULL),
(1176,@d_russell,2,43,'15:56:07','21.221',NULL),(1176,@d_bortoleto,2,44,'15:58:22','21.877',NULL),
(1176,@d_lawson,2,45,'15:59:29','21.545',NULL),(1176,@d_hulkenberg,2,45,'15:59:44','22.591',NULL),
(1176,@d_bearman,2,45,'16:00:03','22.044',NULL),(1176,@d_lindblad,2,46,'16:00:41','21.551',NULL),
(1176,@d_norris,2,47,'16:01:19','21.816',NULL),(1176,@d_colapinto,2,46,'16:01:25','21.446',NULL),
(1176,@d_verstappen,2,49,'16:03:24','21.252',NULL),(1176,@d_antonelli,2,51,'16:05:50','21.502',NULL),
(1176,@d_alonso,2,49,'16:05:57','28.713',NULL),(1176,@d_gasly,3,51,'16:07:16','21.580',NULL),
(1176,@d_leclerc,3,59,'16:16:08','22.738',NULL),
-- Great Britain
(1177,@d_albon,1,1,'15:06:09','44.179',NULL),(1177,@d_piastri,1,2,'15:07:34','40.553',NULL),
(1177,@d_albon,2,14,'15:28:00','41.291',NULL),(1177,@d_verstappen,1,17,'15:30:43','28.738',NULL),
(1177,@d_hulkenberg,1,17,'15:31:25','28.979',NULL),(1177,@d_stroll,1,18,'15:33:41','28.734',NULL),
(1177,@d_hadjar,1,19,'15:33:59','29.972',NULL),(1177,@d_sainz,1,20,'15:36:11','28.894',NULL),
(1177,@d_alonso,1,20,'15:37:01','28.732',NULL),(1177,@d_ocon,1,21,'15:37:56','43.253',NULL),
(1177,@d_perez,1,21,'15:38:09','29.374',NULL),(1177,@d_colapinto,1,22,'15:39:27','29.360',NULL),
(1177,@d_hamilton,1,23,'15:40:18','34.864',NULL),(1177,@d_russell,1,23,'15:40:22','28.663',NULL),
(1177,@d_gasly,1,23,'15:41:02','33.608',NULL),(1177,@d_albon,3,23,'15:43:15','39.601',NULL),
(1177,@d_leclerc,1,25,'15:43:16','28.444',NULL),(1177,@d_bortoleto,1,26,'15:45:41','28.662',NULL),
(1177,@d_lindblad,1,27,'15:47:14','28.974',NULL),(1177,@d_norris,1,28,'15:48:24','28.833',NULL),
(1177,@d_lawson,1,28,'15:48:46','28.746',NULL),(1177,@d_bearman,1,29,'15:51:04','29.971',NULL),
(1177,@d_bottas,1,29,'15:51:29','31.599',NULL),(1177,@d_russell,2,34,'15:57:52','28.337',NULL),
(1177,@d_hulkenberg,2,34,'15:58:52','35.858',NULL),(1177,@d_antonelli,1,35,'15:58:55','28.948',NULL),
(1177,@d_piastri,2,36,'16:02:14','29.515',NULL),(1177,@d_albon,4,35,'16:03:00','31.474',NULL),
(1177,@d_verstappen,2,38,'16:04:09','28.950',NULL),(1177,@d_norris,2,38,'16:04:25','29.818',NULL),
(1177,@d_antonelli,2,41,'16:08:59','41.215',NULL),(1177,@d_albon,5,40,'16:11:43','32.582',NULL),
(1177,@d_antonelli,3,43,'16:12:57','33.650',NULL),(1177,@d_hadjar,3,47,'16:19:06','29.672',NULL),
(1177,@d_perez,2,46,'16:19:12','29.866',NULL),(1177,@d_lawson,2,47,'16:19:28','28.577',NULL),
(1177,@d_lindblad,2,47,'16:19:30','32.143',NULL),(1177,@d_bortoleto,2,47,'16:19:38','29.926',NULL),
(1177,@d_bottas,2,46,'16:19:56','29.584',NULL),(1177,@d_colapinto,2,47,'16:20:01','29.461',NULL),
(1177,@d_leclerc,2,48,'16:20:05','28.887',NULL),(1177,@d_hamilton,2,48,'16:20:32','28.732',NULL),
(1177,@d_piastri,3,47,'16:20:34','29.081',NULL),(1177,@d_alonso,2,46,'16:20:47','29.964',NULL),
(1177,@d_stroll,2,46,'16:20:53','46.234',NULL),(1177,@d_bearman,2,47,'16:20:55','30.274',NULL),
(1177,@d_ocon,2,47,'16:21:01','31.212',NULL),(1177,@d_norris,3,48,'16:21:02','28.475',NULL),
(1177,@d_gasly,2,48,'16:22:11','28.737',NULL),(1177,@d_sainz,2,48,'16:22:49','29.219',NULL),
-- Belgium
(1178,@d_bearman,1,1,'15:06:21','26.554',NULL),(1178,@d_hadjar,1,1,'15:06:22','24.156',NULL),
(1178,@d_perez,1,1,'15:06:23','25.372',NULL),(1178,@d_bottas,1,1,'15:06:26','30.594',NULL),
(1178,@d_ocon,1,1,'15:06:32','33.740',NULL),(1178,@d_hadjar,2,2,'15:09:02','22.997',NULL),
(1178,@d_perez,2,12,'15:29:41','27.617',NULL),(1178,@d_gasly,1,14,'15:32:55','24.177',NULL),
(1178,@d_sainz,1,14,'15:33:07','34.841',NULL),(1178,@d_lawson,1,15,'15:34:46','23.722',NULL),
(1178,@d_colapinto,1,15,'15:34:49','24.146',NULL),(1178,@d_lindblad,1,16,'15:36:37','24.810',NULL),
(1178,@d_ocon,2,16,'15:37:01','24.124',NULL),(1178,@d_verstappen,1,17,'15:38:12','23.128',NULL),
(1178,@d_stroll,1,17,'15:39:28','31.649',NULL),(1178,@d_antonelli,1,18,'15:40:12','23.093',NULL),
(1178,@d_albon,1,18,'15:40:49','22.638',NULL),(1178,@d_alonso,1,19,'15:43:29','23.190',NULL),
(1178,@d_leclerc,1,20,'15:44:12','23.164',NULL),(1178,@d_hamilton,1,20,'15:44:17','32.201',NULL),
(1178,@d_piastri,1,20,'15:44:22','23.292',NULL),(1178,@d_hadjar,3,20,'15:44:37','24.727',NULL),
(1178,@d_bortoleto,1,20,'15:44:42','23.127',NULL),(1178,@d_hulkenberg,1,20,'15:44:45','26.098',NULL),
(1178,@d_bearman,2,20,'15:44:59','28.982',NULL),(1178,@d_norris,1,30,'16:03:05','28.314',NULL),
(1178,@d_alonso,2,31,'16:07:18','24.746',NULL),(1178,@d_bottas,2,32,'16:08:30','25.910',NULL),
-- Hungary
(1179,@d_stroll,1,8,'15:15:19','21.789',NULL),(1179,@d_hamilton,1,13,'15:21:59','21.748',NULL),
(1179,@d_verstappen,1,14,'15:23:24','21.625',NULL),(1179,@d_colapinto,1,15,'15:25:31','22.995',NULL),
(1179,@d_piastri,1,16,'15:26:11','21.765',NULL),(1179,@d_leclerc,1,16,'15:26:19','21.931',NULL),
(1179,@d_gasly,1,16,'15:26:52','21.458',NULL),(1179,@d_norris,1,17,'15:27:37','22.147',NULL),
(1179,@d_ocon,1,17,'15:28:26','22.505',NULL),(1179,@d_sainz,1,18,'15:30:00','21.614',NULL),
(1179,@d_hadjar,1,19,'15:30:54','21.822',NULL),(1179,@d_hulkenberg,1,19,'15:31:08','21.420',NULL),
(1179,@d_lindblad,1,20,'15:32:33','21.395',NULL),(1179,@d_lawson,1,21,'15:33:58','21.923',NULL),
(1179,@d_perez,1,21,'15:34:51','23.212',NULL),(1179,@d_antonelli,1,22,'15:34:54','21.326',NULL),
(1179,@d_bearman,1,22,'15:35:53','22.504',NULL),(1179,@d_albon,1,26,'15:41:57','22.105',NULL),
(1179,@d_russell,1,27,'15:42:33','22.247',NULL),(1179,@d_bortoleto,1,29,'15:45:49','21.749',NULL),
(1179,@d_hamilton,2,30,'15:46:33','21.693',NULL),(1179,@d_piastri,2,33,'15:50:42','21.720',NULL),
(1179,@d_alonso,1,34,'15:53:26','22.175',NULL),(1179,@d_ocon,2,35,'15:55:06','22.399',NULL),
(1179,@d_leclerc,2,36,'15:55:09','21.763',NULL),(1179,@d_stroll,2,37,'15:57:53','24.241',NULL),
(1179,@d_colapinto,2,37,'15:57:57','22.206',NULL),(1179,@d_norris,2,39,'15:59:10','22.112',NULL),
(1179,@d_hulkenberg,2,39,'16:00:18','22.186',NULL),(1179,@d_gasly,2,39,'16:00:34','21.574',NULL),
(1179,@d_verstappen,2,41,'16:02:11','22.015',NULL),(1179,@d_hadjar,2,42,'16:04:09','22.211',NULL),
(1179,@d_lawson,2,42,'16:04:32','21.598',NULL),(1179,@d_bearman,2,42,'16:05:42','22.336',NULL),
(1179,@d_sainz,2,43,'16:07:01','28.658',NULL),(1179,@d_perez,2,46,'16:12:05','24.261',NULL),
(1179,@d_russell,2,54,'16:21:13','22.019',NULL),(1179,@d_albon,2,54,'16:23:16','22.757',NULL),
(1179,@d_norris,3,56,'16:23:22','21.878',NULL),(1179,@d_sainz,3,54,'16:23:24','22.082',NULL),
(1179,@d_hamilton,3,56,'16:23:40','22.420',NULL),(1179,@d_leclerc,3,56,'16:23:55','21.945',NULL),
(1179,@d_gasly,3,55,'16:24:06','21.740',NULL),(1179,@d_alonso,2,55,'16:24:15','22.613',NULL);

/* =========================
   STANDINGS GENERATED FROM 2026 RESULTS + SPRINTS
   ========================= */
INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1176, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 8
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 8
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1176, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 8
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 8
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1177, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 9
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 9
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1177, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 9
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 9
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1178, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 10
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 10
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1178, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 10
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 10
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1179, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 11
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 11
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1179, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 11
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 11
    ) x GROUP BY constructorId
  ) y
) ranked;

COMMIT;
