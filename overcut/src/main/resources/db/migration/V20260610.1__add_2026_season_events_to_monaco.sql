-- 2026 season data through 2026-06-10.
-- Uses Ergast-style tables already consumed by the Python minigames.
-- Race IDs continue after 2025 Abu Dhabi (1168); qualifying IDs continue after 11072.

START TRANSACTION;

INSERT INTO seasons (year, url)
SELECT 2026, 'https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship'
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE year = 2026);

UPDATE seasons
SET url = 'https://en.wikipedia.org/wiki/2026_Formula_One_World_Championship'
WHERE year = 2026;

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
SET @circuit_australia := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'albert_park' LIMIT 1), 1);
SET @circuit_china := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'shanghai' LIMIT 1), 17);
SET @circuit_japan := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'suzuka' LIMIT 1), 22);
SET @circuit_miami := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'miami' LIMIT 1), 79);
SET @circuit_canada := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'villeneuve' LIMIT 1), 7);
SET @circuit_monaco := COALESCE((SELECT circuitId FROM circuits WHERE circuitRef = 'monaco' LIMIT 1), 6);

-- Statuses. Fallback IDs match common Ergast values and the existing inserts style.
SET @st_finished := COALESCE((SELECT statusId FROM status WHERE status = 'Finished' LIMIT 1), 1);
SET @st_disqualified := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Disqualified%' LIMIT 1), 2);
SET @st_accident := COALESCE((SELECT statusId FROM status WHERE status = 'Accident' LIMIT 1), 3);
SET @st_collision := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Collision%' LIMIT 1), 4);
SET @st_engine := COALESCE((SELECT statusId FROM status WHERE status = 'Engine' LIMIT 1), 5);
SET @st_gearbox := COALESCE((SELECT statusId FROM status WHERE status = 'Gearbox' LIMIT 1), 6);
SET @st_hydraulics := COALESCE((SELECT statusId FROM status WHERE status = 'Hydraulics' LIMIT 1), 129);
SET @st_electrical := COALESCE((SELECT statusId FROM status WHERE status = 'Electrical' LIMIT 1), 23);
SET @st_fuel_system := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Fuel%' LIMIT 1), 5);
SET @st_battery := COALESCE((SELECT statusId FROM status WHERE status = 'Battery' LIMIT 1), @st_electrical);
SET @st_suspension := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Suspension%' LIMIT 1), 22);
SET @st_brakes := COALESCE((SELECT statusId FROM status WHERE status = 'Brakes' LIMIT 1), 37);
SET @st_overheating := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Overheating%' LIMIT 1), 5);
SET @st_water_pressure := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Water pressure%' LIMIT 1), 5);
SET @st_vibrations := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Vibrations%' OR status LIKE 'Vibration%' LIMIT 1), 5);
SET @st_power_loss := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Power loss%' LIMIT 1), @st_electrical);
SET @st_coolant := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Coolant%' LIMIT 1), @st_engine);
SET @st_fire := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Fire%' LIMIT 1), @st_engine);
SET @st_mechanical := COALESCE((SELECT statusId FROM status WHERE status LIKE 'Mechanical%' LIMIT 1), @st_engine);

-- Idempotency cleanup for this migration range only.
DELETE FROM driverStandings WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM constructorStandings WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM pitstops WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM sprintResults WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM qualifying WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM results WHERE raceId BETWEEN 1169 AND 1174;
DELETE FROM races WHERE raceId BETWEEN 1169 AND 1174;

/* =========================
   RACES
   ========================= */
INSERT INTO races (
  raceId, year, round, circuitId, name, date, time, url,
  fp1_date, fp1_time, fp2_date, fp2_time, fp3_date, fp3_time,
  quali_date, quali_time, sprint_date, sprint_time
) VALUES
(1169, 2026, 1, @circuit_australia, 'Australian Grand Prix', '2026-03-08', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Australian_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-07', NULL, NULL, NULL),
(1170, 2026, 2, @circuit_china, 'Chinese Grand Prix', '2026-03-15', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Chinese_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-14', NULL, '2026-03-14', NULL),
(1171, 2026, 3, @circuit_japan, 'Japanese Grand Prix', '2026-03-29', '14:00:00', 'https://en.wikipedia.org/wiki/2026_Japanese_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-28', NULL, NULL, NULL),
(1172, 2026, 4, @circuit_miami, 'Miami Grand Prix', '2026-05-03', '13:00:00', 'https://en.wikipedia.org/wiki/2026_Miami_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-02', NULL, '2026-05-02', NULL),
(1173, 2026, 5, @circuit_canada, 'Canadian Grand Prix', '2026-05-24', '16:00:00', 'https://en.wikipedia.org/wiki/2026_Canadian_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-05-23', NULL, '2026-05-23', NULL),
(1174, 2026, 6, @circuit_monaco, 'Monaco Grand Prix', '2026-06-07', '15:00:00', 'https://en.wikipedia.org/wiki/2026_Monaco_Grand_Prix',
 NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-06', NULL, NULL, NULL);

/* =========================
   QUALIFYING
   ========================= */
INSERT INTO qualifying (qualifyId, raceId, driverId, constructorId, number, position, q1, q2, q3) VALUES
-- 2026 Australian Grand Prix
(11073,1169,@d_russell,@c_mercedes,63,1,'1:19.507','1:18.934','1:18.518'),
(11074,1169,@d_antonelli,@c_mercedes,12,2,'1:20.120','1:19.435','1:18.811'),
(11075,1169,@d_hadjar,@c_red_bull,6,3,'1:20.023','1:19.653','1:19.303'),
(11076,1169,@d_leclerc,@c_ferrari,16,4,'1:20.226','1:19.357','1:19.327'),
(11077,1169,@d_piastri,@c_mclaren,81,5,'1:19.664','1:19.525','1:19.380'),
(11078,1169,@d_norris,@c_mclaren,1,6,'1:20.010','1:19.882','1:19.475'),
(11079,1169,@d_hamilton,@c_ferrari,44,7,'1:19.811','1:19.921','1:19.478'),
(11080,1169,@d_lawson,@c_rb,30,8,'1:20.491','1:20.144','1:19.994'),
(11081,1169,@d_lindblad,@c_rb,41,9,'1:20.409','1:19.971','1:21.247'),
(11082,1169,@d_bortoleto,@c_audi,5,10,'1:20.495','1:20.221',NULL),
(11083,1169,@d_hulkenberg,@c_audi,27,11,'1:21.024','1:20.303',NULL),
(11084,1169,@d_bearman,@c_haas,87,12,'1:21.247','1:20.311',NULL),
(11085,1169,@d_ocon,@c_haas,31,13,'1:20.759','1:20.491',NULL),
(11086,1169,@d_gasly,@c_alpine,10,14,'1:21.138','1:20.501',NULL),
(11087,1169,@d_albon,@c_williams,23,15,'1:21.051','1:20.941',NULL),
(11088,1169,@d_colapinto,@c_alpine,43,16,'1:21.200','1:21.270',NULL),
(11089,1169,@d_alonso,@c_aston,14,17,'1:21.969',NULL,NULL),
(11090,1169,@d_perez,@c_cadillac,11,18,'1:22.605',NULL,NULL),
(11091,1169,@d_bottas,@c_cadillac,77,19,'1:23.244',NULL,NULL),
(11092,1169,@d_verstappen,@c_red_bull,3,20,NULL,NULL,NULL),
(11093,1169,@d_sainz,@c_williams,55,21,NULL,NULL,NULL),
(11094,1169,@d_stroll,@c_aston,18,22,NULL,NULL,NULL),
-- 2026 Chinese Grand Prix
(11095,1170,@d_antonelli,@c_mercedes,12,1,'1:33.305','1:32.443','1:32.064'),
(11096,1170,@d_russell,@c_mercedes,63,2,'1:33.262','1:32.523','1:32.286'),
(11097,1170,@d_hamilton,@c_ferrari,44,3,'1:33.522','1:32.567','1:32.415'),
(11098,1170,@d_leclerc,@c_ferrari,16,4,'1:33.175','1:32.486','1:32.428'),
(11099,1170,@d_piastri,@c_mclaren,81,5,'1:33.590','1:33.130','1:32.550'),
(11100,1170,@d_norris,@c_mclaren,1,6,'1:33.535','1:32.910','1:32.608'),
(11101,1170,@d_gasly,@c_alpine,10,7,'1:33.788','1:33.003','1:32.873'),
(11102,1170,@d_verstappen,@c_red_bull,3,8,'1:33.417','1:33.098','1:33.002'),
(11103,1170,@d_hadjar,@c_red_bull,6,9,'1:33.632','1:33.352','1:33.121'),
(11104,1170,@d_bearman,@c_haas,87,10,'1:33.687','1:33.197','1:33.292'),
(11105,1170,@d_hulkenberg,@c_audi,27,11,'1:34.116','1:33.354',NULL),
(11106,1170,@d_colapinto,@c_alpine,43,12,'1:33.634','1:33.357',NULL),
(11107,1170,@d_ocon,@c_haas,31,13,'1:33.974','1:33.538',NULL),
(11108,1170,@d_lawson,@c_rb,30,14,'1:34.139','1:33.765',NULL),
(11109,1170,@d_lindblad,@c_rb,41,15,'1:33.906','1:33.784',NULL),
(11110,1170,@d_bortoleto,@c_audi,5,16,'1:33.549','1:33.965',NULL),
(11111,1170,@d_sainz,@c_williams,55,17,'1:34.317',NULL,NULL),
(11112,1170,@d_albon,@c_williams,23,18,'1:34.772',NULL,NULL),
(11113,1170,@d_alonso,@c_aston,14,19,'1:35.203',NULL,NULL),
(11114,1170,@d_bottas,@c_cadillac,77,20,'1:35.436',NULL,NULL),
(11115,1170,@d_stroll,@c_aston,18,21,'1:35.995',NULL,NULL),
(11116,1170,@d_perez,@c_cadillac,11,22,'1:36.906',NULL,NULL),
-- 2026 Japanese Grand Prix
(11117,1171,@d_antonelli,@c_mercedes,12,1,'1:30.035','1:29.048','1:28.778'),
(11118,1171,@d_russell,@c_mercedes,63,2,'1:29.967','1:29.686','1:29.076'),
(11119,1171,@d_piastri,@c_mclaren,81,3,'1:30.200','1:29.451','1:29.132'),
(11120,1171,@d_leclerc,@c_ferrari,16,4,'1:29.915','1:29.303','1:29.405'),
(11121,1171,@d_norris,@c_mclaren,1,5,'1:30.401','1:29.795','1:29.409'),
(11122,1171,@d_hamilton,@c_ferrari,44,6,'1:30.309','1:29.589','1:29.567'),
(11123,1171,@d_gasly,@c_alpine,10,7,'1:30.584','1:29.874','1:29.691'),
(11124,1171,@d_hadjar,@c_red_bull,6,8,'1:30.662','1:30.104','1:29.978'),
(11125,1171,@d_bortoleto,@c_audi,5,9,'1:30.359','1:29.990','1:30.274'),
(11126,1171,@d_lindblad,@c_rb,41,10,'1:30.781','1:30.109','1:30.319'),
(11127,1171,@d_verstappen,@c_red_bull,3,11,'1:30.519','1:30.262',NULL),
(11128,1171,@d_ocon,@c_haas,31,12,'1:30.915','1:30.309',NULL),
(11129,1171,@d_hulkenberg,@c_audi,27,13,'1:30.358','1:30.387',NULL),
(11130,1171,@d_lawson,@c_rb,30,14,'1:30.657','1:30.495',NULL),
(11131,1171,@d_colapinto,@c_alpine,43,15,'1:30.931','1:30.627',NULL),
(11132,1171,@d_sainz,@c_williams,55,16,'1:30.927','1:31.033',NULL),
(11133,1171,@d_albon,@c_williams,23,17,'1:31.088',NULL,NULL),
(11134,1171,@d_bearman,@c_haas,87,18,'1:31.090',NULL,NULL),
(11135,1171,@d_perez,@c_cadillac,11,19,'1:32.206',NULL,NULL),
(11136,1171,@d_bottas,@c_cadillac,77,20,'1:32.330',NULL,NULL),
(11137,1171,@d_alonso,@c_aston,14,21,'1:32.646',NULL,NULL),
(11138,1171,@d_stroll,@c_aston,18,22,'1:32.920',NULL,NULL),
-- 2026 Miami Grand Prix
(11139,1172,@d_antonelli,@c_mercedes,12,1,'1:28.653','1:28.289','1:27.798'),
(11140,1172,@d_verstappen,@c_red_bull,3,2,'1:29.099','1:28.116','1:27.964'),
(11141,1172,@d_leclerc,@c_ferrari,16,3,'1:28.938','1:28.315','1:28.143'),
(11142,1172,@d_norris,@c_mclaren,1,4,'1:29.183','1:28.920','1:28.183'),
(11143,1172,@d_russell,@c_mercedes,63,5,'1:29.492','1:28.477','1:28.197'),
(11144,1172,@d_hamilton,@c_ferrari,44,6,'1:29.483','1:28.477','1:28.319'),
(11145,1172,@d_piastri,@c_mclaren,81,7,'1:29.920','1:28.332','1:28.500'),
(11146,1172,@d_colapinto,@c_alpine,43,8,'1:29.584','1:28.975','1:28.762'),
(11147,1172,@d_gasly,@c_alpine,10,9,'1:29.914','1:29.070','1:28.810'),
(11148,1172,@d_hulkenberg,@c_audi,27,10,'1:29.645','1:29.439',NULL),
(11149,1172,@d_lawson,@c_rb,30,11,'1:29.595','1:29.499',NULL),
(11150,1172,@d_bearman,@c_haas,87,12,'1:29.340','1:29.567',NULL),
(11151,1172,@d_sainz,@c_williams,55,13,'1:29.540','1:29.568',NULL),
(11152,1172,@d_ocon,@c_haas,31,14,'1:29.838','1:29.772',NULL),
(11153,1172,@d_albon,@c_williams,23,15,'1:29.720','1:29.946',NULL),
(11154,1172,@d_lindblad,@c_rb,41,16,'1:30.133',NULL,NULL),
(11155,1172,@d_alonso,@c_aston,14,17,'1:31.098',NULL,NULL),
(11156,1172,@d_stroll,@c_aston,18,18,'1:31.164',NULL,NULL),
(11157,1172,@d_bottas,@c_cadillac,77,19,'1:31.629',NULL,NULL),
(11158,1172,@d_perez,@c_cadillac,11,20,'1:31.967',NULL,NULL),
(11159,1172,@d_bortoleto,@c_audi,5,21,'1:33.737',NULL,NULL),
(11160,1172,@d_hadjar,@c_red_bull,6,NULL,'1:29.324','1:28.941','1:28.789'),
-- 2026 Canadian Grand Prix
(11161,1173,@d_russell,@c_mercedes,63,1,'1:13.953','1:13.079','1:12.578'),
(11162,1173,@d_antonelli,@c_mercedes,12,2,'1:13.380','1:13.076','1:12.646'),
(11163,1173,@d_norris,@c_mclaren,1,3,'1:13.503','1:13.049','1:12.729'),
(11164,1173,@d_piastri,@c_mclaren,81,4,'1:13.559','1:13.285','1:12.781'),
(11165,1173,@d_hamilton,@c_ferrari,44,5,'1:13.767','1:13.041','1:12.868'),
(11166,1173,@d_verstappen,@c_red_bull,3,6,'1:14.067','1:13.479','1:12.907'),
(11167,1173,@d_hadjar,@c_red_bull,6,7,'1:13.654','1:12.975','1:12.935'),
(11168,1173,@d_leclerc,@c_ferrari,16,8,'1:13.825','1:13.496','1:12.976'),
(11169,1173,@d_lindblad,@c_rb,41,9,'1:13.895','1:13.548','1:13.280'),
(11170,1173,@d_colapinto,@c_alpine,43,10,'1:14.466','1:13.857','1:13.697'),
(11171,1173,@d_hulkenberg,@c_audi,27,11,'1:14.562','1:13.886',NULL),
(11172,1173,@d_lawson,@c_rb,30,12,'1:14.346','1:13.897',NULL),
(11173,1173,@d_bortoleto,@c_audi,5,13,'1:14.775','1:14.071',NULL),
(11174,1173,@d_gasly,@c_alpine,10,14,'1:14.698','1:14.187',NULL),
(11175,1173,@d_sainz,@c_williams,55,15,'1:14.276','1:14.273',NULL),
(11176,1173,@d_bearman,@c_haas,87,16,'1:14.449','1:14.416',NULL),
(11177,1173,@d_ocon,@c_haas,31,17,'1:14.845',NULL,NULL),
(11178,1173,@d_albon,@c_williams,23,18,'1:14.851',NULL,NULL),
(11179,1173,@d_alonso,@c_aston,14,19,'1:15.196',NULL,NULL),
(11180,1173,@d_perez,@c_cadillac,11,20,'1:15.429',NULL,NULL),
(11181,1173,@d_stroll,@c_aston,18,21,'1:16.195',NULL,NULL),
(11182,1173,@d_bottas,@c_cadillac,77,22,'1:16.272',NULL,NULL),
-- 2026 Monaco Grand Prix
(11183,1174,@d_antonelli,@c_mercedes,12,1,'1:13.599','1:12.704','1:12.051'),
(11184,1174,@d_verstappen,@c_red_bull,3,2,'1:13.490','1:12.499','1:12.094'),
(11185,1174,@d_hamilton,@c_ferrari,44,3,'1:13.777','1:12.934','1:12.279'),
(11186,1174,@d_leclerc,@c_ferrari,16,4,'1:13.293','1:12.774','1:12.351'),
(11187,1174,@d_hadjar,@c_red_bull,6,5,'1:14.408','1:12.722','1:12.434'),
(11188,1174,@d_russell,@c_mercedes,63,6,'1:14.214','1:13.238','1:12.445'),
(11189,1174,@d_piastri,@c_mclaren,81,7,'1:14.159','1:12.983','1:12.624'),
(11190,1174,@d_norris,@c_mclaren,1,8,'1:13.630','1:12.919','1:12.765'),
(11191,1174,@d_gasly,@c_alpine,10,9,'1:14.469','1:13.762','1:13.226'),
(11192,1174,@d_lawson,@c_rb,30,10,'1:14.498','1:13.471','1:13.412'),
(11193,1174,@d_albon,@c_williams,23,11,'1:14.321','1:13.787',NULL),
(11194,1174,@d_sainz,@c_williams,55,12,'1:14.348','1:13.815',NULL),
(11195,1174,@d_hulkenberg,@c_audi,27,13,'1:13.923','1:13.902',NULL),
(11196,1174,@d_colapinto,@c_alpine,43,14,'1:14.573','1:13.995',NULL),
(11197,1174,@d_lindblad,@c_rb,41,15,'1:14.685','1:14.248',NULL),
(11198,1174,@d_bortoleto,@c_audi,5,16,'1:14.683',NULL,NULL),
(11199,1174,@d_ocon,@c_haas,31,17,'1:14.722',NULL,NULL),
(11200,1174,@d_perez,@c_cadillac,11,18,'1:14.747',NULL,NULL),
(11201,1174,@d_bearman,@c_haas,87,19,'1:14.814',NULL,NULL),
(11202,1174,@d_bottas,@c_cadillac,77,20,'1:15.283',NULL,NULL),
(11203,1174,@d_alonso,@c_aston,14,21,'1:15.349',NULL,NULL),
(11204,1174,@d_stroll,@c_aston,18,22,'1:16.061',NULL,NULL);

/* =========================
   SPRINT RESULTS
   ========================= */
INSERT INTO sprintResults (
  raceId, driverId, constructorId, number, grid,
  position, positionText, positionOrder, points, laps, time, milliseconds, statusId
) VALUES
-- China
(1170,@d_russell,@c_mercedes,63,1,1,'1',1,8,19,'33:38.998',NULL,@st_finished),
(1170,@d_leclerc,@c_ferrari,16,6,2,'2',2,7,19,'+0.674',NULL,@st_finished),
(1170,@d_hamilton,@c_ferrari,44,4,3,'3',3,6,19,'+2.554',NULL,@st_finished),
(1170,@d_norris,@c_mclaren,1,3,4,'4',4,5,19,'+4.433',NULL,@st_finished),
(1170,@d_antonelli,@c_mercedes,12,2,5,'5',5,4,19,'+5.688',NULL,@st_finished),
(1170,@d_piastri,@c_mclaren,81,5,6,'6',6,3,19,'+6.809',NULL,@st_finished),
(1170,@d_lawson,@c_rb,30,13,7,'7',7,2,19,'+10.900',NULL,@st_finished),
(1170,@d_bearman,@c_haas,87,9,8,'8',8,1,19,'+11.271',NULL,@st_finished),
(1170,@d_verstappen,@c_red_bull,3,8,9,'9',9,0,19,'+11.619',NULL,@st_finished),
(1170,@d_ocon,@c_haas,31,12,10,'10',10,0,19,'+13.887',NULL,@st_finished),
(1170,@d_gasly,@c_alpine,10,7,11,'11',11,0,19,'+14.780',NULL,@st_finished),
(1170,@d_sainz,@c_williams,55,17,12,'12',12,0,19,'+15.753',NULL,@st_finished),
(1170,@d_bortoleto,@c_audi,5,14,13,'13',13,0,19,'+15.858',NULL,@st_finished),
(1170,@d_colapinto,@c_alpine,43,16,14,'14',14,0,19,'+16.393',NULL,@st_finished),
(1170,@d_hadjar,@c_red_bull,6,10,15,'15',15,0,19,'+16.430',NULL,@st_finished),
(1170,@d_albon,@c_williams,23,0,16,'16',16,0,19,'+20.014',NULL,@st_finished),
(1170,@d_alonso,@c_aston,14,18,17,'17',17,0,19,'+21.599',NULL,@st_finished),
(1170,@d_stroll,@c_aston,18,19,18,'18',18,0,19,'+21.971',NULL,@st_finished),
(1170,@d_perez,@c_cadillac,11,21,19,'19',19,0,19,'+28.241',NULL,@st_finished),
(1170,@d_hulkenberg,@c_audi,27,11,NULL,'R',20,0,12,'Engine',NULL,@st_engine),
(1170,@d_bottas,@c_cadillac,77,20,NULL,'R',21,0,12,'Power loss',NULL,@st_power_loss),
(1170,@d_lindblad,@c_rb,41,15,NULL,'R',22,0,11,'Withdrew',NULL,@st_finished),
-- Miami
(1172,@d_norris,@c_mclaren,1,1,1,'1',1,8,19,'29:15.045',NULL,@st_finished),
(1172,@d_piastri,@c_mclaren,81,3,2,'2',2,7,19,'+3.766',NULL,@st_finished),
(1172,@d_leclerc,@c_ferrari,16,4,3,'3',3,6,19,'+6.251',NULL,@st_finished),
(1172,@d_russell,@c_mercedes,63,6,4,'4',4,5,19,'+12.951',NULL,@st_finished),
(1172,@d_verstappen,@c_red_bull,3,5,5,'5',5,4,19,'+13.639',NULL,@st_finished),
(1172,@d_antonelli,@c_mercedes,12,2,6,'6',6,3,19,'+13.777',NULL,@st_finished),
(1172,@d_hamilton,@c_ferrari,44,7,7,'7',7,2,19,'+21.665',NULL,@st_finished),
(1172,@d_gasly,@c_alpine,10,10,8,'8',8,1,19,'+30.525',NULL,@st_finished),
(1172,@d_hadjar,@c_red_bull,6,9,9,'9',9,0,19,'+35.346',NULL,@st_finished),
(1172,@d_colapinto,@c_alpine,43,8,10,'10',10,0,19,'+36.970',NULL,@st_finished),
(1172,@d_ocon,@c_haas,31,16,11,'11',11,0,19,'+56.972',NULL,@st_finished),
(1172,@d_bearman,@c_haas,87,13,12,'12',12,0,19,'+57.365',NULL,@st_finished),
(1172,@d_sainz,@c_williams,55,14,13,'13',13,0,19,'+58.504',NULL,@st_finished),
(1172,@d_lawson,@c_rb,30,15,14,'14',14,0,19,'+59.358',NULL,@st_finished),
(1172,@d_alonso,@c_aston,14,20,15,'15',15,0,19,'+1:16.067',NULL,@st_finished),
(1172,@d_perez,@c_cadillac,11,17,16,'16',16,0,19,'+1:16.691',NULL,@st_finished),
(1172,@d_stroll,@c_aston,18,21,17,'17',17,0,19,'+1:17.626',NULL,@st_finished),
(1172,@d_albon,@c_williams,23,18,18,'18',18,0,19,'+1:28.173',NULL,@st_finished),
(1172,@d_bottas,@c_cadillac,77,19,19,'19',19,0,19,'+1:29.597',NULL,@st_finished),
(1172,@d_hulkenberg,@c_audi,27,0,NULL,'W',20,0,0,'Fire',NULL,@st_fire),
(1172,@d_lindblad,@c_rb,41,0,NULL,'W',21,0,0,'Mechanical',NULL,@st_mechanical),
(1172,@d_bortoleto,@c_audi,5,11,NULL,'D',22,0,19,'Engine intake',NULL,@st_disqualified),
-- Canada
(1173,@d_russell,@c_mercedes,63,1,1,'1',1,8,23,'28:50.951',NULL,@st_finished),
(1173,@d_norris,@c_mclaren,1,3,2,'2',2,7,23,'+1.272',NULL,@st_finished),
(1173,@d_antonelli,@c_mercedes,12,2,3,'3',3,6,23,'+1.843',NULL,@st_finished),
(1173,@d_piastri,@c_mclaren,81,4,4,'4',4,5,23,'+9.797',NULL,@st_finished),
(1173,@d_leclerc,@c_ferrari,16,6,5,'5',5,4,23,'+9.929',NULL,@st_finished),
(1173,@d_hamilton,@c_ferrari,44,5,6,'6',6,3,23,'+10.545',NULL,@st_finished),
(1173,@d_verstappen,@c_red_bull,3,7,7,'7',7,2,23,'+15.935',NULL,@st_finished),
(1173,@d_lindblad,@c_rb,41,9,8,'8',8,1,23,'+29.710',NULL,@st_finished),
(1173,@d_colapinto,@c_alpine,43,13,9,'9',9,0,23,'+31.621',NULL,@st_finished),
(1173,@d_sainz,@c_williams,55,10,10,'10',10,0,23,'+36.793',NULL,@st_finished),
(1173,@d_lawson,@c_rb,30,18,11,'11',11,0,23,'+1:01.344',NULL,@st_finished),
(1173,@d_bortoleto,@c_audi,5,12,12,'12',12,0,23,'+1:01.814',NULL,@st_finished),
(1173,@d_ocon,@c_haas,31,14,13,'13',13,0,23,'+1:04.209',NULL,@st_finished),
(1173,@d_perez,@c_cadillac,11,16,14,'14',14,0,23,'+1:10.402',NULL,@st_finished),
(1173,@d_hulkenberg,@c_audi,27,11,15,'15',15,0,23,'+1:12.158',NULL,@st_finished),
(1173,@d_stroll,@c_aston,18,0,16,'16',16,0,22,'+1 lap',NULL,@st_finished),
(1173,@d_bottas,@c_cadillac,77,0,17,'17',17,0,22,'+1 lap',NULL,@st_finished),
(1173,@d_bearman,@c_haas,87,0,18,'18',18,0,22,'+1 lap',NULL,@st_finished),
(1173,@d_albon,@c_williams,23,0,19,'19',19,0,22,'+1 lap',NULL,@st_finished),
(1173,@d_gasly,@c_alpine,10,0,20,'20',20,0,22,'+1 lap',NULL,@st_finished),
(1173,@d_hadjar,@c_red_bull,6,8,21,'21',21,0,20,'+3 laps',NULL,@st_finished),
(1173,@d_alonso,@c_aston,14,15,NULL,'R',22,0,15,'Engine',NULL,@st_engine);

/* =========================
   RACE RESULTS
   ========================= */
INSERT INTO results (
  raceId, driverId, constructorId, number, grid,
  position, positionOrder, positionText, points, laps,
  time, milliseconds, fastestLap, `rank`, fastestLapTime, fastestLapSpeed, statusId
) VALUES
-- Australia
(1169,@d_russell,@c_mercedes,63,1,1,1,'1',25,58,'1:23:06.801',NULL,21,6,'1:22.670',229.839,@st_finished),
(1169,@d_antonelli,@c_mercedes,12,2,2,2,'2',18,58,'+2.974',NULL,57,3,'1:22.417',230.544,@st_finished),
(1169,@d_leclerc,@c_ferrari,16,4,3,3,'3',15,58,'+15.519',NULL,38,5,'1:22.579',230.092,@st_finished),
(1169,@d_hamilton,@c_ferrari,44,7,4,4,'4',12,58,'+16.144',NULL,55,4,'1:22.423',230.527,@st_finished),
(1169,@d_norris,@c_mclaren,1,6,5,5,'5',10,58,'+51.741',NULL,53,2,'1:22.358',230.709,@st_finished),
(1169,@d_verstappen,@c_red_bull,3,20,6,6,'6',8,58,'+54.617',NULL,43,1,'1:22.091',231.460,@st_finished),
(1169,@d_bearman,@c_haas,87,12,7,7,'7',6,57,'+1 lap',NULL,22,11,'1:24.020',226.146,@st_finished),
(1169,@d_lindblad,@c_rb,41,9,8,8,'8',4,57,'+1 lap',NULL,21,12,'1:24.182',225.710,@st_finished),
(1169,@d_bortoleto,@c_audi,5,10,9,9,'9',2,57,'+1 lap',NULL,45,8,'1:23.257',228.218,@st_finished),
(1169,@d_gasly,@c_alpine,10,14,10,10,'10',1,57,'+1 lap',NULL,57,15,'1:24.486',224.898,@st_finished),
(1169,@d_ocon,@c_haas,31,13,11,11,'11',0,57,'+1 lap',NULL,25,14,'1:24.424',225.063,@st_finished),
(1169,@d_albon,@c_williams,23,15,12,12,'12',0,57,'+1 lap',NULL,37,13,'1:24.375',225.194,@st_finished),
(1169,@d_lawson,@c_rb,30,8,13,13,'13',0,57,'+1 lap',NULL,48,10,'1:23.783',226.785,@st_finished),
(1169,@d_colapinto,@c_alpine,43,16,14,14,'14',0,56,'+2 laps',NULL,49,7,'1:22.926',229.129,@st_finished),
(1169,@d_sainz,@c_williams,55,21,15,15,'15',0,56,'+2 laps',NULL,54,9,'1:23.590',227.309,@st_finished),
(1169,@d_perez,@c_cadillac,11,18,16,16,'16',0,55,'+3 laps',NULL,49,19,'1:26.070',220.759,@st_finished),
(1169,@d_stroll,@c_aston,18,22,NULL,'NC',17,0,43,'+15 laps',NULL,51,17,'1:25.410',222.465,@st_finished),
(1169,@d_alonso,@c_aston,14,17,NULL,'R',18,0,21,'Vibrations',NULL,26,18,'1:25.713',221.679,@st_vibrations),
(1169,@d_bottas,@c_cadillac,77,19,NULL,'R',19,0,15,'Fuel system',NULL,8,20,'1:27.364',217.490,@st_fuel_system),
(1169,@d_hadjar,@c_red_bull,6,3,NULL,'R',20,0,10,'Engine',NULL,9,16,'1:25.239',222.912,@st_engine),
(1169,@d_piastri,@c_mclaren,81,0,NULL,'W',21,0,0,'Accident',NULL,NULL,NULL,NULL,NULL,@st_accident),
(1169,@d_hulkenberg,@c_audi,27,0,NULL,'W',22,0,0,'Hydraulics',NULL,NULL,NULL,NULL,NULL,@st_hydraulics),
-- China
(1170,@d_antonelli,@c_mercedes,12,1,1,1,'1',25,56,'1:33:15.607',NULL,52,1,'1:35.275',205.967,@st_finished),
(1170,@d_russell,@c_mercedes,63,2,2,2,'2',18,56,'+5.515',NULL,56,2,'1:35.400',205.698,@st_finished),
(1170,@d_hamilton,@c_ferrari,44,3,3,3,'3',15,56,'+25.267',NULL,55,5,'1:36.092',204.216,@st_finished),
(1170,@d_leclerc,@c_ferrari,16,4,4,4,'4',12,56,'+28.894',NULL,56,4,'1:36.011',204.389,@st_finished),
(1170,@d_bearman,@c_haas,87,10,5,5,'5',10,56,'+57.268',NULL,56,8,'1:36.429',203.503,@st_finished),
(1170,@d_gasly,@c_alpine,10,7,6,6,'6',8,56,'+59.647',NULL,53,9,'1:36.505',203.342,@st_finished),
(1170,@d_lawson,@c_rb,30,14,7,7,'7',6,56,'+1:20.588',NULL,56,12,'1:37.096',202.105,@st_finished),
(1170,@d_hadjar,@c_red_bull,6,9,8,8,'8',4,56,'+1:27.247',NULL,46,13,'1:37.311',201.658,@st_finished),
(1170,@d_sainz,@c_williams,55,17,9,9,'9',2,55,'+1 lap',NULL,52,14,'1:37.981',200.279,@st_finished),
(1170,@d_colapinto,@c_alpine,43,12,10,10,'10',1,55,'+1 lap',NULL,35,10,'1:36.783',202.758,@st_finished),
(1170,@d_hulkenberg,@c_audi,27,11,11,11,'11',0,55,'+1 lap',NULL,38,7,'1:36.180',204.029,@st_finished),
(1170,@d_lindblad,@c_rb,41,15,12,12,'12',0,55,'+1 lap',NULL,47,6,'1:36.099',204.201,@st_finished),
(1170,@d_bottas,@c_cadillac,77,19,13,13,'13',0,55,'+1 lap',NULL,56,15,'1:38.393',199.441,@st_finished),
(1170,@d_ocon,@c_haas,31,13,14,14,'14',0,55,'+1 lap',NULL,55,3,'1:35.964',204.489,@st_finished),
(1170,@d_perez,@c_cadillac,11,21,15,15,'15',0,55,'+1 lap',NULL,51,16,'1:38.523',199.177,@st_finished),
(1170,@d_verstappen,@c_red_bull,3,8,NULL,'R',16,0,45,'Coolant leak',NULL,39,11,'1:37.046',202.209,@st_coolant),
(1170,@d_alonso,@c_aston,14,18,NULL,'R',17,0,32,'Vibrations',NULL,25,17,'1:39.721',196.785,@st_vibrations),
(1170,@d_stroll,@c_aston,18,20,NULL,'R',18,0,9,'Battery',NULL,9,18,'1:40.883',194.518,@st_battery),
(1170,@d_piastri,@c_mclaren,81,0,NULL,'W',19,0,0,'Electrical',NULL,NULL,NULL,NULL,NULL,@st_electrical),
(1170,@d_norris,@c_mclaren,1,0,NULL,'W',20,0,0,'Electrical',NULL,NULL,NULL,NULL,NULL,@st_electrical),
(1170,@d_bortoleto,@c_audi,5,0,NULL,'W',21,0,0,'Hydraulics',NULL,NULL,NULL,NULL,NULL,@st_hydraulics),
(1170,@d_albon,@c_williams,23,0,NULL,'W',22,0,0,'Hydraulics',NULL,NULL,NULL,NULL,NULL,@st_hydraulics),
-- Japan
(1171,@d_antonelli,@c_mercedes,12,1,1,1,'1',25,53,'1:28:03.403',NULL,49,1,'1:32.432',226.168,@st_finished),
(1171,@d_piastri,@c_mclaren,81,3,2,2,'2',18,53,'+13.722',NULL,49,5,'1:32.996',224.796,@st_finished),
(1171,@d_leclerc,@c_ferrari,16,4,3,3,'3',15,53,'+15.270',NULL,53,3,'1:32.634',225.675,@st_finished),
(1171,@d_russell,@c_mercedes,63,2,4,4,'4',12,53,'+15.754',NULL,53,2,'1:32.549',225.882,@st_finished),
(1171,@d_norris,@c_mclaren,1,5,5,5,'5',10,53,'+23.479',NULL,52,6,'1:33.208',224.285,@st_finished),
(1171,@d_hamilton,@c_ferrari,44,6,6,6,'6',8,53,'+25.037',NULL,48,4,'1:32.777',225.327,@st_finished),
(1171,@d_gasly,@c_alpine,10,7,7,7,'7',6,53,'+32.340',NULL,39,9,'1:33.691',223.129,@st_finished),
(1171,@d_verstappen,@c_red_bull,3,11,8,8,'8',4,53,'+32.677',NULL,41,8,'1:33.552',223.460,@st_finished),
(1171,@d_lawson,@c_rb,30,14,9,9,'9',2,53,'+50.180',NULL,53,13,'1:34.230',221.852,@st_finished),
(1171,@d_ocon,@c_haas,31,12,10,10,'10',1,53,'+51.216',NULL,53,14,'1:34.256',221.791,@st_finished),
(1171,@d_hulkenberg,@c_audi,27,13,11,11,'11',0,53,'+52.280',NULL,47,10,'1:33.732',223.031,@st_finished),
(1171,@d_hadjar,@c_red_bull,6,8,12,12,'12',0,53,'+56.154',NULL,53,11,'1:33.837',222.782,@st_finished),
(1171,@d_bortoleto,@c_audi,5,9,13,13,'13',0,53,'+59.078',NULL,40,12,'1:34.164',222.008,@st_finished),
(1171,@d_lindblad,@c_rb,41,10,14,14,'14',0,53,'+59.848',NULL,53,15,'1:34.314',221.655,@st_finished),
(1171,@d_sainz,@c_williams,55,16,15,15,'15',0,53,'+1:05.008',NULL,38,17,'1:34.514',221.186,@st_finished),
(1171,@d_colapinto,@c_alpine,43,15,16,16,'16',0,53,'+1:05.773',NULL,41,16,'1:34.512',221.190,@st_finished),
(1171,@d_perez,@c_cadillac,11,19,17,17,'17',0,53,'+1:32.453',NULL,53,19,'1:35.637',218.589,@st_finished),
(1171,@d_alonso,@c_aston,14,21,18,18,'18',0,52,'+1 lap',NULL,48,20,'1:36.221',217.262,@st_finished),
(1171,@d_bottas,@c_cadillac,77,20,19,19,'19',0,52,'+1 lap',NULL,53,21,'1:36.269',217.154,@st_finished),
(1171,@d_albon,@c_williams,23,17,20,20,'20',0,51,'+2 laps',NULL,53,7,'1:33.427',223.759,@st_finished),
(1171,@d_stroll,@c_aston,18,22,NULL,'R',21,0,30,'Water pressure',NULL,29,22,'1:37.217',215.036,@st_water_pressure),
(1171,@d_bearman,@c_haas,87,18,NULL,'R',22,0,20,'Accident',NULL,20,18,'1:35.604',218.664,@st_accident),
-- Miami
(1172,@d_antonelli,@c_mercedes,12,1,1,1,'1',25,57,'1:33:19.273',NULL,34,3,'1:31.968',211.847,@st_finished),
(1172,@d_norris,@c_mclaren,1,4,2,2,'2',18,57,'+3.264',NULL,35,1,'1:31.869',212.075,@st_finished),
(1172,@d_piastri,@c_mclaren,81,7,3,3,'3',15,57,'+27.092',NULL,30,2,'1:31.949',211.891,@st_finished),
(1172,@d_russell,@c_mercedes,63,5,4,4,'4',12,57,'+43.051',NULL,53,4,'1:32.446',210.752,@st_finished),
(1172,@d_verstappen,@c_red_bull,3,2,5,5,'5',10,57,'+48.949',NULL,24,9,'1:33.110',209.249,@st_finished),
(1172,@d_hamilton,@c_ferrari,44,6,6,6,'6',8,57,'+53.753',NULL,29,6,'1:32.676',210.229,@st_finished),
(1172,@d_colapinto,@c_alpine,43,8,7,7,'7',6,57,'+1:01.871',NULL,33,8,'1:33.035',209.417,@st_finished),
(1172,@d_leclerc,@c_ferrari,16,3,8,8,'8',4,57,'+1:04.245',NULL,44,5,'1:32.515',210.595,@st_finished),
(1172,@d_sainz,@c_williams,55,13,9,9,'9',2,57,'+1:22.072',NULL,30,7,'1:33.026',209.438,@st_finished),
(1172,@d_albon,@c_williams,23,15,10,10,'10',1,57,'+1:30.972',NULL,30,13,'1:33.784',207.745,@st_finished),
(1172,@d_bearman,@c_haas,87,12,11,11,'11',0,56,'+1 lap',NULL,28,12,'1:33.744',207.834,@st_finished),
(1172,@d_bortoleto,@c_audi,5,21,12,12,'12',0,56,'+1 lap',NULL,56,10,'1:33.500',208.376,@st_finished),
(1172,@d_ocon,@c_haas,31,14,13,13,'13',0,56,'+1 lap',NULL,33,11,'1:33.712',207.905,@st_finished),
(1172,@d_lindblad,@c_rb,41,16,14,14,'14',0,56,'+1 lap',NULL,30,14,'1:34.058',207.140,@st_finished),
(1172,@d_alonso,@c_aston,14,17,15,15,'15',0,56,'+1 lap',NULL,46,16,'1:34.594',205.966,@st_finished),
(1172,@d_perez,@c_cadillac,11,20,16,16,'16',0,56,'+1 lap',NULL,31,21,'1:34.895',205.313,@st_finished),
(1172,@d_stroll,@c_aston,18,18,17,17,'17',0,56,'+1 lap',NULL,57,17,'1:34.716',205.701,@st_finished),
(1172,@d_bottas,@c_cadillac,77,19,18,18,'18',0,55,'+2 laps',NULL,16,22,'1:36.080',202.781,@st_finished),
(1172,@d_hulkenberg,@c_audi,27,10,NULL,'R',19,0,7,'Overheating',NULL,4,15,'1:34.523',206.121,@st_overheating),
(1172,@d_lawson,@c_rb,30,11,NULL,'R',20,0,6,'Gearbox',NULL,3,18,'1:34.814',205.488,@st_gearbox),
(1172,@d_gasly,@c_alpine,10,9,NULL,'R',21,0,4,'Collision',NULL,4,20,'1:34.856',205.397,@st_collision),
(1172,@d_hadjar,@c_red_bull,6,0,NULL,'R',22,0,4,'Accident',NULL,4,19,'1:34.833',205.447,@st_accident),
-- Canada
(1173,@d_antonelli,@c_mercedes,12,2,1,1,'1',25,68,'1:28:15.758',NULL,68,1,'1:14.210',211.556,@st_finished),
(1173,@d_hamilton,@c_ferrari,44,5,2,2,'2',18,68,'+10.768',NULL,61,3,'1:14.573',210.526,@st_finished),
(1173,@d_verstappen,@c_red_bull,3,6,3,3,'3',15,68,'+11.276',NULL,68,2,'1:14.398',211.021,@st_finished),
(1173,@d_leclerc,@c_ferrari,16,8,4,4,'4',12,68,'+44.151',NULL,37,5,'1:15.297',208.502,@st_finished),
(1173,@d_hadjar,@c_red_bull,6,7,5,5,'5',10,67,'+1 lap',NULL,68,4,'1:14.578',210.512,@st_finished),
(1173,@d_colapinto,@c_alpine,43,10,6,6,'6',8,67,'+1 lap',NULL,68,8,'1:15.462',208.046,@st_finished),
(1173,@d_lawson,@c_rb,30,12,7,7,'7',6,67,'+1 lap',NULL,60,10,'1:15.604',207.655,@st_finished),
(1173,@d_gasly,@c_alpine,10,14,8,8,'8',4,67,'+1 lap',NULL,68,6,'1:15.390',208.245,@st_finished),
(1173,@d_sainz,@c_williams,55,15,9,9,'9',2,67,'+1 lap',NULL,66,12,'1:15.852',206.976,@st_finished),
(1173,@d_bearman,@c_haas,87,16,10,10,'10',1,67,'+1 lap',NULL,65,13,'1:16.002',206.568,@st_finished),
(1173,@d_piastri,@c_mclaren,81,4,11,11,'11',0,66,'+2 laps',NULL,63,7,'1:15.456',208.062,@st_finished),
(1173,@d_hulkenberg,@c_audi,27,11,12,12,'12',0,66,'+2 laps',NULL,58,15,'1:16.275',205.828,@st_finished),
(1173,@d_bortoleto,@c_audi,5,13,13,13,'13',0,66,'+2 laps',NULL,51,14,'1:16.221',205.974,@st_finished),
(1173,@d_ocon,@c_haas,31,17,14,14,'14',0,66,'+2 laps',NULL,66,16,'1:16.577',205.017,@st_finished),
(1173,@d_stroll,@c_aston,18,0,15,15,'15',0,64,'+4 laps',NULL,41,20,'1:18.721',199.433,@st_finished),
(1173,@d_bottas,@c_cadillac,77,21,16,16,'16',0,64,'+4 laps',NULL,63,19,'1:17.725',201.989,@st_finished),
(1173,@d_perez,@c_cadillac,11,20,NULL,'R',17,0,39,'Suspension',NULL,38,17,'1:16.915',204.116,@st_suspension),
(1173,@d_norris,@c_mclaren,1,3,NULL,'R',18,0,38,'Gearbox',NULL,36,11,'1:15.845',206.995,@st_gearbox),
(1173,@d_russell,@c_mercedes,63,1,NULL,'R',19,0,29,'Engine',NULL,16,9,'1:15.477',208.005,@st_engine),
(1173,@d_alonso,@c_aston,14,19,NULL,'R',20,0,23,'Broken seat',NULL,10,21,'1:19.635',197.144,@st_finished),
(1173,@d_albon,@c_williams,23,18,NULL,'R',21,0,11,'Collision',NULL,11,18,'1:17.221',203.307,@st_collision),
(1173,@d_lindblad,@c_rb,41,0,NULL,'W',22,0,0,'Gearbox',NULL,NULL,NULL,NULL,NULL,@st_gearbox),
-- Monaco
(1174,@d_antonelli,@c_mercedes,12,1,1,1,'1',25,78,'2:23:31.243',NULL,76,1,'1:13.481',163.487,@st_finished),
(1174,@d_hamilton,@c_ferrari,44,3,2,2,'2',18,78,'+6.271',NULL,74,2,'1:14.643',160.942,@st_finished),
(1174,@d_hadjar,@c_red_bull,6,5,3,3,'3',15,78,'+23.394',NULL,77,4,'1:15.669',158.759,@st_finished),
(1174,@d_piastri,@c_mclaren,81,7,4,4,'4',12,78,'+24.261',NULL,76,7,'1:15.816',158.452,@st_finished),
(1174,@d_lawson,@c_rb,30,10,5,5,'5',10,78,'+26.553',NULL,76,5,'1:15.754',158.581,@st_finished),
(1174,@d_lindblad,@c_rb,41,15,6,6,'6',8,78,'+29.010',NULL,76,8,'1:15.908',158.259,@st_finished),
(1174,@d_gasly,@c_alpine,10,9,7,7,'7',6,78,'+30.369',NULL,77,3,'1:15.497',159.121,@st_finished),
(1174,@d_albon,@c_williams,23,11,8,8,'8',4,78,'+33.413',NULL,78,12,'1:16.393',157.255,@st_finished),
(1174,@d_ocon,@c_haas,31,17,9,9,'9',2,78,'+37.140',NULL,77,15,'1:16.914',156.190,@st_finished),
(1174,@d_alonso,@c_aston,14,21,10,10,'10',1,78,'+41.899',NULL,77,16,'1:17.120',155.772,@st_finished),
(1174,@d_bortoleto,@c_audi,5,0,11,11,'11',0,78,'+42.748',NULL,48,13,'1:16.803',156.415,@st_finished),
(1174,@d_russell,@c_mercedes,63,6,12,12,'12',0,78,'+43.353',NULL,57,6,'1:15.773',158.541,@st_finished),
(1174,@d_hulkenberg,@c_audi,27,13,13,13,'13',0,78,'+44.102',NULL,15,11,'1:16.332',157.380,@st_finished),
(1174,@d_colapinto,@c_alpine,43,14,14,14,'14',0,78,'+48.964',NULL,74,10,'1:16.316',157.413,@st_finished),
(1174,@d_perez,@c_cadillac,11,18,15,15,'15',0,78,'+49.153',NULL,78,14,'1:16.891',156.236,@st_finished),
(1174,@d_sainz,@c_williams,55,12,16,16,'16',0,70,'Collision damage',NULL,52,18,'1:18.022',153.971,@st_collision),
(1174,@d_leclerc,@c_ferrari,16,4,NULL,'R',17,0,64,'Accident',NULL,53,9,'1:15.964',158.143,@st_accident),
(1174,@d_stroll,@c_aston,18,22,NULL,'R',18,0,56,'Accident',NULL,37,20,'1:18.845',152.364,@st_accident),
(1174,@d_norris,@c_mclaren,1,8,NULL,'R',19,0,43,'Battery',NULL,34,17,'1:17.670',154.669,@st_battery),
(1174,@d_bearman,@c_haas,87,19,NULL,'R',20,0,27,'Brakes',NULL,23,19,'1:18.475',153.083,@st_brakes),
(1174,@d_bottas,@c_cadillac,77,20,NULL,'R',21,0,15,'Brakes',NULL,8,21,'1:20.494',149.243,@st_brakes),
(1174,@d_verstappen,@c_red_bull,3,2,NULL,'R',22,0,0,'Engine',NULL,NULL,NULL,NULL,NULL,@st_engine);

/* =========================
   PIT STOPS
   ========================= */
INSERT INTO pitstops (raceId, driverId, stop, lap, time, duration, milliseconds) VALUES
-- Australia
(1169,@d_colapinto,1,9,'15:16:40','27.733',NULL),(1169,@d_norris,1,11,'15:19:21','18.266',NULL),
(1169,@d_ocon,1,11,'15:19:26','18.570',NULL),(1169,@d_gasly,1,11,'15:19:27','18.672',NULL),
(1169,@d_sainz,1,11,'15:19:35','19.859',NULL),(1169,@d_lawson,1,11,'15:19:42','19.112',NULL),
(1169,@d_alonso,1,11,'15:19:50','25.895',NULL),(1169,@d_stroll,1,11,'15:20:00','36.686',NULL),
(1169,@d_russell,1,12,'15:20:57','17.794',NULL),(1169,@d_antonelli,1,12,'15:20:59','20.985',NULL),
(1169,@d_albon,1,12,'15:21:28','18.118',NULL),(1169,@d_bottas,1,12,'15:22:42','30.387',NULL),
(1169,@d_lindblad,1,18,'15:30:28','18.506',NULL),(1169,@d_verstappen,1,18,'15:30:29','19.070',NULL),
(1169,@d_bearman,1,18,'15:30:30','18.774',NULL),(1169,@d_bortoleto,1,18,'15:30:35','18.916',NULL),
(1169,@d_perez,1,18,'15:31:24','21.371',NULL),(1169,@d_leclerc,1,25,'15:40:29','17.664',NULL),
(1169,@d_stroll,2,26,'15:43:52','33.182',NULL),(1169,@d_hamilton,1,28,'15:44:45','17.741',NULL),
(1169,@d_bortoleto,2,33,'15:52:30','22.619',NULL),(1169,@d_albon,2,33,'15:53:04','18.404',NULL),
(1169,@d_sainz,2,33,'15:53:09','25.939',NULL),(1169,@d_lawson,2,33,'15:53:16','18.190',NULL),
(1169,@d_norris,2,34,'15:53:48','17.649',NULL),(1169,@d_verstappen,2,41,'16:03:37','18.078',NULL),
(1169,@d_perez,2,43,'16:08:53','18.951',NULL),(1169,@d_sainz,3,45,'16:10:48','34.615',NULL),
(1169,@d_colapinto,2,46,'16:12:15','18.561',NULL),(1169,@d_stroll,4,39,'16:21:43','22.469',NULL),
-- China
(1170,@d_hadjar,1,1,'15:06:01','23.062',NULL),(1170,@d_verstappen,1,9,'15:19:07','23.678',NULL),
(1170,@d_lawson,1,9,'15:19:07','22.721',NULL),(1170,@d_sainz,1,9,'15:19:10','23.106',NULL),
(1170,@d_antonelli,1,10,'15:20:25','23.005',NULL),(1170,@d_russell,1,10,'15:20:32','23.390',NULL),
(1170,@d_hamilton,1,10,'15:20:33','22.433',NULL),(1170,@d_leclerc,1,10,'15:20:36','25.633',NULL),
(1170,@d_gasly,1,10,'15:20:42','23.539',NULL),(1170,@d_bearman,1,10,'15:20:59','22.967',NULL),
(1170,@d_bottas,1,10,'15:21:20','27.795',NULL),(1170,@d_hadjar,2,10,'15:21:40','25.748',NULL),
(1170,@d_perez,1,11,'15:23:41','26.213',NULL),(1170,@d_ocon,1,29,'15:54:41','25.997',NULL),
(1170,@d_alonso,1,31,'15:58:29','23.291',NULL),(1170,@d_colapinto,1,32,'15:59:34','23.195',NULL),
(1170,@d_hulkenberg,1,35,'16:04:32','37.358',NULL),(1170,@d_lindblad,1,42,'16:16:19','23.290',NULL),
(1170,@d_ocon,2,46,'16:23:06','47.067',NULL),
-- Japan
(1171,@d_norris,1,16,'14:39:31','23.316',NULL),(1171,@d_bearman,1,16,'14:39:59','25.081',NULL),
(1171,@d_leclerc,1,17,'14:41:04','22.992',NULL),(1171,@d_colapinto,1,17,'14:41:34','23.649',NULL),
(1171,@d_piastri,1,18,'14:42:34','23.444',NULL),(1171,@d_lindblad,1,18,'14:43:08','26.335',NULL),
(1171,@d_ocon,1,19,'14:44:42','24.629',NULL),(1171,@d_hadjar,1,19,'14:44:44','23.698',NULL),
(1171,@d_bottas,1,19,'14:45:33','25.129',NULL),(1171,@d_russell,1,21,'14:47:19','22.937',NULL),
(1171,@d_perez,1,21,'14:48:37','27.307',NULL),(1171,@d_stroll,1,21,'14:48:49','25.083',NULL),
(1171,@d_alonso,1,21,'14:48:57','26.458',NULL),(1171,@d_antonelli,1,22,'14:49:12','23.288',NULL),
(1171,@d_hamilton,1,22,'14:49:21','22.891',NULL),(1171,@d_gasly,1,22,'14:49:37','24.304',NULL),
(1171,@d_verstappen,1,22,'14:49:41','24.490',NULL),(1171,@d_lawson,1,22,'14:50:03','24.165',NULL),
(1171,@d_bortoleto,1,22,'14:50:04','24.630',NULL),(1171,@d_sainz,1,22,'14:50:11','24.396',NULL),
(1171,@d_albon,1,22,'14:50:19','24.600',NULL),(1171,@d_hulkenberg,1,23,'14:52:12','23.999',NULL),
(1171,@d_alonso,2,23,'14:53:15','24.014',NULL),(1171,@d_stroll,2,24,'14:54:49','23.501',NULL),
(1171,@d_albon,2,45,'15:30:35','23.072',NULL),(1171,@d_albon,6,49,'15:38:36','24.337',NULL),
-- Miami
(1172,@d_hulkenberg,1,1,'13:05:50','33.710',NULL),(1172,@d_verstappen,1,6,'13:14:17','22.547',NULL),
(1172,@d_bottas,1,6,'13:14:37','23.529',NULL),(1172,@d_russell,1,20,'13:40:08','22.042',NULL),
(1172,@d_leclerc,1,21,'13:41:39','23.386',NULL),(1172,@d_bottas,2,21,'13:42:17','23.827',NULL),
(1172,@d_stroll,1,21,'13:42:19','22.630',NULL),(1172,@d_antonelli,1,26,'13:49:18','22.128',NULL),
(1172,@d_bearman,1,26,'13:49:52','23.474',NULL),(1172,@d_norris,1,27,'13:50:50','22.565',NULL),
(1172,@d_hamilton,1,27,'13:51:09','23.779',NULL),(1172,@d_albon,1,27,'13:51:26','23.016',NULL),
(1172,@d_piastri,1,28,'13:52:37','23.024',NULL),(1172,@d_sainz,1,28,'13:52:57','23.595',NULL),
(1172,@d_lindblad,1,28,'13:53:19','22.731',NULL),(1172,@d_perez,1,29,'13:55:05','23.228',NULL),
(1172,@d_colapinto,1,31,'13:57:31','23.093',NULL),(1172,@d_ocon,1,31,'13:57:51','24.027',NULL),
(1172,@d_bortoleto,1,32,'13:59:31','23.986',NULL),(1172,@d_stroll,2,37,'14:08:15','22.090',NULL),
(1172,@d_alonso,1,41,'14:14:24','23.160',NULL),
-- Canada
(1173,@d_piastri,1,1,'16:11:10','24.121',NULL),(1173,@d_norris,1,2,'16:12:29','23.418',NULL),
(1173,@d_hulkenberg,1,2,'16:12:41','24.952',NULL),(1173,@d_bortoleto,1,2,'16:12:43','28.178',NULL),
(1173,@d_sainz,1,2,'16:12:44','24.751',NULL),(1173,@d_perez,1,2,'16:12:46','25.737',NULL),
(1173,@d_bottas,1,3,'16:14:15','28.257',NULL),(1173,@d_bottas,2,9,'16:22:48','24.847',NULL),
(1173,@d_piastri,2,12,'16:26:00','36.627',NULL),(1173,@d_stroll,1,14,'16:29:04','24.249',NULL),
(1173,@d_norris,2,15,'16:29:45','28.859',NULL),(1173,@d_perez,2,15,'16:30:22','25.153',NULL),
(1173,@d_ocon,1,16,'16:31:27','24.833',NULL),(1173,@d_bortoleto,2,18,'16:34:08','24.766',NULL),
(1173,@d_hulkenberg,2,20,'16:36:38','31.024',NULL),(1173,@d_alonso,1,20,'16:36:49','24.709',NULL),
(1173,@d_colapinto,1,30,'16:49:08','25.640',NULL),(1173,@d_lawson,1,30,'16:49:23','24.177',NULL),
(1173,@d_perez,3,29,'16:49:21','24.984',NULL),(1173,@d_bottas,3,29,'16:50:37','24.413',NULL),
(1173,@d_gasly,1,30,'16:49:29','25.644',NULL),(1173,@d_antonelli,1,31,'16:49:51','25.153',NULL),
(1173,@d_verstappen,1,31,'16:49:57','25.199',NULL),(1173,@d_hamilton,1,31,'16:50:08','25.936',NULL),
(1173,@d_leclerc,1,31,'16:50:10','30.114',NULL),(1173,@d_hadjar,1,31,'16:50:12','24.902',NULL),
(1173,@d_ocon,2,30,'16:50:53','35.351',NULL),(1173,@d_stroll,2,49,'17:17:26','24.146',NULL),
(1173,@d_piastri,3,51,'17:18:13','36.103',NULL),(1173,@d_bottas,4,49,'17:18:16','31.102',NULL),
-- Monaco
(1174,@d_bottas,1,1,'15:04:43','26.759',NULL),(1174,@d_bearman,1,1,'15:04:43','32.127',NULL),
(1174,@d_bortoleto,1,1,'15:04:45','25.927',NULL),(1174,@d_alonso,1,3,'15:07:26','24.975',NULL),
(1174,@d_perez,1,4,'15:08:42','27.138',NULL),(1174,@d_stroll,1,4,'15:08:49','24.803',NULL),
(1174,@d_ocon,1,9,'15:15:21','25.482',NULL),(1174,@d_hulkenberg,1,12,'15:19:14','24.810',NULL),
(1174,@d_hamilton,1,28,'15:39:15','24.138',NULL),(1174,@d_russell,1,31,'15:43:44','24.029',NULL),
(1174,@d_hadjar,1,32,'15:45:03','24.784',NULL),(1174,@d_leclerc,1,35,'15:48:22','25.377',NULL),
(1174,@d_colapinto,1,35,'15:49:39','25.797',NULL),(1174,@d_antonelli,1,37,'15:50:33','24.136',NULL),
(1174,@d_albon,1,43,'16:00:11','25.553',NULL),(1174,@d_bortoleto,2,43,'16:01:08','24.690',NULL),
(1174,@d_lawson,1,44,'16:01:16','25.622',NULL),(1174,@d_gasly,1,45,'16:02:15','25.547',NULL),
(1174,@d_piastri,1,48,'16:06:06','24.244',NULL),(1174,@d_sainz,1,52,'16:12:20','25.662',NULL),
(1174,@d_piastri,2,59,'16:20:53','31.421',NULL),(1174,@d_hamilton,2,60,'16:20:54','31.227',NULL),
(1174,@d_leclerc,2,60,'16:20:59','34.907',NULL),(1174,@d_alonso,2,58,'16:21:07','26.334',NULL),
(1174,@d_antonelli,2,61,'16:22:12','26.878',NULL),(1174,@d_russell,2,60,'16:22:14','35.258',NULL),
(1174,@d_perez,3,59,'16:23:24','26.005',NULL),(1174,@d_bortoleto,4,59,'16:23:41','24.824',NULL);

/* =========================
   STANDINGS GENERATED FROM 2026 RESULTS + SPRINTS
   ========================= */
INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT standingRaceId, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT 1169 AS standingRaceId, driverId, points, wins,
         ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) AS points, SUM(wins) AS wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END AS wins
      FROM results r JOIN races ra ON ra.raceId = r.raceId
      WHERE ra.year = 2026 AND ra.round <= 1
      UNION ALL
      SELECT sr.driverId, sr.points, 0
      FROM sprintResults sr JOIN races ra ON ra.raceId = sr.raceId
      WHERE ra.year = 2026 AND ra.round <= 1
    ) x
    GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT standingRaceId, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT 1169 AS standingRaceId, constructorId, points, wins,
         ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) AS points, SUM(wins) AS wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END AS wins
      FROM results r JOIN races ra ON ra.raceId = r.raceId
      WHERE ra.year = 2026 AND ra.round <= 1
      UNION ALL
      SELECT sr.constructorId, sr.points, 0
      FROM sprintResults sr JOIN races ra ON ra.raceId = sr.raceId
      WHERE ra.year = 2026 AND ra.round <= 1
    ) x
    GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1170, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 2
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 2
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1170, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 2
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 2
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1171, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 3
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 3
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1171, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 3
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 3
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1172, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 4
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 4
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1172, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 4
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 4
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1173, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 5
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 5
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1173, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 5
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 5
    ) x GROUP BY constructorId
  ) y
) ranked;

INSERT INTO driverStandings (raceId, driverId, points, position, positionText, wins)
SELECT 1174, driverId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT driverId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, driverId ASC) AS pos
  FROM (
    SELECT driverId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.driverId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 6
      UNION ALL SELECT sr.driverId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 6
    ) x GROUP BY driverId
  ) y
) ranked;

INSERT INTO constructorStandings (raceId, constructorId, points, position, positionText, wins)
SELECT 1174, constructorId, points, pos, CAST(pos AS CHAR), wins
FROM (
  SELECT constructorId, points, wins, ROW_NUMBER() OVER (ORDER BY points DESC, wins DESC, constructorId ASC) AS pos
  FROM (
    SELECT constructorId, SUM(points) points, SUM(wins) wins
    FROM (
      SELECT r.constructorId, r.points, CASE WHEN r.position = 1 THEN 1 ELSE 0 END wins FROM results r JOIN races ra ON ra.raceId=r.raceId WHERE ra.year=2026 AND ra.round <= 6
      UNION ALL SELECT sr.constructorId, sr.points, 0 FROM sprintResults sr JOIN races ra ON ra.raceId=sr.raceId WHERE ra.year=2026 AND ra.round <= 6
    ) x GROUP BY constructorId
  ) y
) ranked;

COMMIT;
