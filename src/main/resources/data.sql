
INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image, points)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL, 0);


INSERT INTO Category(name,historic,quiz) VALUES ('News',false,false);

INSERT INTO Category(name,historic,quiz) VALUES ('Quiz', false, true);

INSERT INTO Category(name,historic,quiz) VALUES ('Historic', true, false);

INSERT INTO Category(name,historic,quiz) VALUES ('Anecdotes',false,false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Example Post Title', 'Example Post Subtitle', 'This is an example article content.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);

INSERT INTO QuizType (code,imagePath) VALUES
('Stats', 'f1-2013-11-bel-parrilla-trasera.jpg'),
('Regulations', 'fia.jpg'),
('Pictures', 'coches-alta-velocidad-compiten-circuito-carreras-formula-concept-car-racing-formula-deportes-alta-velocidad-conductores-competitivos-circuitos-carreras_918839-378206.jpg');

-- Traducciones al español (es)
INSERT INTO QuizTypeTranslation (quizTypeId, language, name) VALUES
(1, 'es', 'Estadísticas'),
(2, 'es', 'Reglamento'),
(3, 'es', 'Imágenes');

-- Traducciones al inglés (en)
INSERT INTO QuizTypeTranslation (quizTypeId, language, name) VALUES
(1, 'en', 'Statistics'),
(2, 'en', 'Regulations'),
(3, 'en', 'Pictures');


-- Asociadas a QuizType 'Stats'
INSERT INTO QuizCategory (code, quizTypeId) VALUES
('Scores', 2),
('Penalty', 2),
('Driver', 1),
('Team', 1),
('LegendarySeason', 1),
('Duels', 1),
('Circuit', 1),
('GenericStats', 1),
('Procedures', 2),
('ParcFerme', 2),
('Safety', 2),
('Tyres', 2),
('SafetyCar', 2),
('Qualifying', 2),
('Sprint', 2),
('RedFlag', 2),
('Drivers', 2),
('Technical', 2),
('PracticalCase', 2),
('DescriptiveImages', 3);

-- Español (es)
INSERT INTO QuizCategoryTranslation (quizCategoryId, language, name) VALUES
(1, 'es', 'Puntuaciones'),
(2, 'es', 'Sanciones'),
(3, 'es', 'Pilotos'),
(4, 'es', 'Escuderías'),
(5, 'es', 'Temporadas Legendarias'),
(6, 'es', 'Duelos'),
(7, 'es', 'Circuito'),
(8, 'es', 'Estadisticas Genericas'),
(9, 'es', 'Procedimientos'),
(10, 'es', 'Parque Cerrado'),
(11, 'es', 'Seguridad'),
(12, 'es', 'Neumaticos'),
(13, 'es', 'Coche de seguridad'),
(14, 'es', 'Clasificacion'),
(15, 'es', 'Sprint'),
(16, 'es', 'Bandera Roja'),
(17, 'es', 'Pilotos'),
(18, 'es', 'Tecnica'),
(19, 'es', 'Casos practicos'),
(20, 'es', 'Imagenes Descriptivas');

-- Inglés (en)
INSERT INTO QuizCategoryTranslation (quizCategoryId, language, name) VALUES
(1, 'en', 'Scores'),
(2, 'en', 'Penalty'),
(3, 'en', 'Drivers'),
(4, 'en', 'Teams'),
(5, 'en', 'Legendary Seasons'),
(6, 'en', 'Duels'),
(7, 'en', 'Circuit'),
(8, 'en', 'Generic Stats'),
(9, 'en', 'Procedures'),
(10, 'en', 'Parc Ferme'),
(11, 'en', 'Safety'),
(12, 'en', 'Tyres'),
(13, 'en', 'Safety Car'),
(14, 'en', 'Qualifying'),
(15, 'en', 'Sprint'),
(16, 'en', 'Red Flag'),
(17, 'en', 'Drivers'),
(18, 'en', 'Technical'),
(19, 'en', 'Practical case'),
(20, 'en', 'Descriptive Images');





INSERT INTO Award(award,requiredPoints, image)
VALUES ('PS5', 5, 'ps5-product-thumbnail-01-en-14sep21.jpg');

INSERT INTO Award(award,requiredPoints, image)
VALUES ('Thrustmaster T150', 8, 'UTH_T150-racing-wheel-PS4-PC-1-7.jpg');


INSERT INTO Award(award,requiredPoints, image)
VALUES ('PC Gaming', 12, '819cOVjBRRL.jpg');





---------PREGUNTAS Y RESPUESTAS -----------------------------------------------------------------------------

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the name of this team?', 'bmwsauberF1-92006586-d799-422b-88d2-fdbc9fac1d9f.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes AMG Petronas', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW Sauber', true, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 1);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which team did Nico Hulkenberg never race for?',
'oficial-hulkenberg-sustituye-a-vettel-para-el-gp-de-barein-2cafb8d1-1c37-4975-92e4-eb7e08504aed.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 2);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who never raced for Ferrari?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Felipe Massa', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', true, 3);

INSERT INTO Question (name, imagePath, knowledgequestionlevel,language)
VALUES ('Which driver has NEVER been part of the Red Bull family? (Red Bull, Toro Rosso/Alpha Tauri, Red Bull Academy)', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Daniel Kvyat', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Isack Hadjar', false, 4);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which circuit is this?', 'images-76ce60ff-33a7-424b-9259-57adc1a37f48.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Monza', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', true, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Istanbul Park', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungaroring', false, 5);


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver raced with this car?', 'images-80a199ac-fb13-44c3-9811-0204b7fcb9a9.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Hulkenberg', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kamui Kobayashi', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 6);
-- Pregunta 1
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cómo se llama este equipo?', 'bmwsauberF1-92006586-d799-422b-88d2-fdbc9fac1d9f.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes AMG Petronas', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW Sauber', true, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 7);

-- Pregunta 2
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Para qué equipo nunca corrió Nico Hulkenberg?',
'oficial-hulkenberg-sustituye-a-vettel-para-el-gp-de-barein-2cafb8d1-1c37-4975-92e4-eb7e08504aed.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 8);

-- Pregunta 3
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién nunca corrió para Ferrari?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Felipe Massa', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Pérez', true, 9);

-- Pregunta 4
INSERT INTO Question (name, imagePath, knowledgequestionlevel,language)
VALUES ('¿Qué piloto NUNCA ha formado parte de la familia Red Bull? (Red Bull, Toro Rosso/Alpha Tauri, Academia Red Bull)', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Daniel Kvyat', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Isack Hadjar', false, 10);

-- Pregunta 5
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué circuito es este?', 'images-76ce60ff-33a7-424b-9259-57adc1a37f48.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Monza', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', true, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Istanbul Park', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungaroring', false, 11);

-- Pregunta 6
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto compitió con este coche?', 'images-80a199ac-fb13-44c3-9811-0204b7fcb9a9.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Hülkenberg', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kamui Kobayashi', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Räikkönen', false, 12);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the Ice Man?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Alonso', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Raikkonen', true, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Niki Lauda', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vettel', false, 13);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which team has Fernando Alonso never been part of?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Mclaren', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 14);

-- Pregunta 9
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('When was F1 created?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1980', false, 15, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1950', true, 15, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1948', false, 15, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1943', false, 15, 'en');

-- Pregunta 10
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the Team Principal of Mercedes?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zak Brown', false, 16, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toto Wolff', true, 16, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Christian Horner', false, 16, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Andrea Stella', false, 16, 'en');

-- Pregunta 11
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who won the world championship in 2023?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', true, 17, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 17, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 17, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sergio Perez', false, 17, 'en');

-- Pregunta 12
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In 2023, Max Verstappen surpassed Sebastian Vettel''s record for consecutive victories. What was that figure?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('9', true, 18, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10', false, 18, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8', false, 18, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11', false, 18, 'en');

-- Pregunta 13
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the driver with the most races in F1 history?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 19, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 19, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 19, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Rubens Barrichello', false, 19, 'en');

-- Pregunta 14
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is DRS used for?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('To have more aerodynamics', false, 20, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To reduce drag', true, 20, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To give more power', false, 20, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To assist in braking', false, 20, 'en');

-- Pregunta 15
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Currently, F1 cars have been using V6 Turbo hybrid engines since 2014. Which element of current engines will be removed for the 2026 regulation?', null, 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('ICE', false, 21, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('MGU-H', true, 21, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('MGU-K', false, 21, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Battery', false, 21, 'en');

-- Pregunta 16
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Ferrari is the biggest team in F1 history. But, when was the last time they won the world championship?', 'carlos-sainz_1h2hvmfieomji1fks4uq8ylzup.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', false, 22, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2006', false, 22, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', false, 22, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', true, 22, 'en');

-- Pregunta 17
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the youngest driver to win the F1 world championship?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 23, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 23, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 23, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 23, 'en');

-- Pregunta 18
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In which year did Williams win their last race to date?', null, 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2012', true, 24, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2015', false, 24, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2004', false, 24, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2003', false, 24, 'en');

-- Pregunta 19
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Of the teams currently on the grid, which has been around the shortest time?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Racing Bulls', false, 25, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sauber', false, 25, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alpine', false, 25, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Haas', true, 25, 'en');

-- Pregunta 20
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In which year did Michael Schumacher get his first F1 victory?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1994', false, 26, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2000', false, 26, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1992', true, 26, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1998', false, 26, 'en');

-- Pregunta 7
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el Hombre de Hielo?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('Alonso', false, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Raikkonen', true, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Niki Lauda', false, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vettel', false, 27);

-- Pregunta 8
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué equipo nunca ha estado Fernando Alonso?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId) VALUES ('McLaren', false, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 28);

-- Pregunta 9
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuándo se creó la Fórmula 1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1980', false, 29, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1950', true, 29, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1948', false, 29, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1943', false, 29, 'es');

-- Pregunta 10
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el director del equipo Mercedes?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zak Brown', false, 30, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toto Wolff', true, 30, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Christian Horner', false, 30, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Andrea Stella', false, 30, 'es');

-- Pregunta 11
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién ganó el campeonato mundial en 2023?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', true, 31, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 31, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 31, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sergio Pérez', false, 31, 'es');

-- Pregunta 12
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En 2023, Max Verstappen superó el récord de victorias consecutivas de Sebastian Vettel. ¿Cuál fue esa cifra?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('9', true, 32, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10', false, 32, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8', false, 32, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11', false, 32, 'es');

-- Pregunta 13
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el piloto con más carreras en la historia de la F1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 33, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 33, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 33, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Rubens Barrichello', false, 33, 'es');

-- Pregunta 14
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Para qué se usa el DRS?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para tener más aerodinámica', false, 34, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para reducir la resistencia', true, 34, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para dar más potencia', false, 34, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para asistir en la frenada', false, 34, 'es');

-- Pregunta 15
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Actualmente, los coches de F1 usan motores híbridos V6 Turbo desde 2014. ¿Qué elemento será eliminado con el reglamento de 2026?', null, 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('ICE', false, 35, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('MGU-H', true, 35, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('MGU-K', false, 35, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Batería', false, 35, 'es');

-- Pregunta 16
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Ferrari es el equipo más grande en la historia de la F1. Pero, ¿cuándo fue la última vez que ganaron el campeonato del mundo?', 'carlos-sainz_1h2hvmfieomji1fks4uq8ylzup.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', false, 36, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2006', false, 36, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', false, 36, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', true, 36, 'es');

-- Pregunta 17
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el piloto más joven en ganar el campeonato mundial de F1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 37, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 37, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 37, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 37, 'es');

-- Pregunta 18
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año ganó Williams su última carrera hasta la fecha?', null, 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2012', true, 38, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2015', false, 38, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2004', false, 38, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2003', false, 38, 'es');

-- Pregunta 19
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('De los equipos que están actualmente en la parrilla, ¿cuál lleva menos tiempo?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Racing Bulls', false, 39, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sauber', false, 39, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alpine', false, 39, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Haas', true, 39, 'es');

-- Pregunta 20
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año consiguió Michael Schumacher su primera victoria en F1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1994', false, 40, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2000', false, 40, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1992', true, 40, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1998', false, 40, 'es');

-- Pregunta 21
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is Alonso''s last win to date in F1?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 2013', true, 41, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2013', false, 41, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2014', false, 41, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany 2012', false, 41, 'en');

-- Pregunta 22
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In 2026, with the new regulations we will going to have a new engine. Which new engine is coming to F1?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('General Motors', false, 42, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toyota', false, 42, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Audi', true, 42, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('BMW', false, 42, 'en');

-- Pregunta 23
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which circuit is this?', 'racefansdotnet-start-istanbul.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Istambul Park', true, 43, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull Ring', false, 43, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring', false, 43, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zaandvort', false, 43, 'en');

-- Pregunta 24
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Mclaren did a 1-2 in the Hungarian GP in 2024. When was the last time Mclaren achieved that?', '4007762-81292888-2560-1440.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 2012', false, 44, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2021', true, 44, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Miami 2024', false, 44, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canada 2010', false, 44, 'en');

-- Pregunta 25
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In which country did the 2020 season start?', '15938651546549.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia', false, 45, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Imola', false, 45, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Great Britain', false, 45, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria', true, 45, 'en');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many days does a Gran Prix last ', '15938651546549.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', false, 46, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 46, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', true, 46, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('4', false, 46, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which is the team with the most starts in F1? ', '58.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mclaren', false, 47, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 47, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 47, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 47, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first Formula 1 Grand Prix won by Lewis Hamilton?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadian GP 2007', true, 48, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italian GP 2010', false, 48, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spanish GP 2008', false, 48, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('German GP 2009', false, 48, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who holds the record for the most Formula 1 race wins?', 'article-1377757-0BAA374500000578-340_634x432.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 49, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 49, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 49, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 49, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which team has the most Formula 1 race wins in history?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 50, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 50, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 50, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 50, 'en');

-- Pregunta 21
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la última victoria de Alonso hasta la fecha en F1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 2013', true, 51, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2013', false, 51, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2014', false, 51, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania 2012', false, 51, 'es');

-- Pregunta 22
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En 2026, con el nuevo reglamento, tendremos un nuevo motor. ¿Qué motor llegará a la F1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('General Motors', false, 52, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toyota', false, 52, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Audi', true, 52, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('BMW', false, 52, 'es');

-- Pregunta 23
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué circuito es este?', 'racefansdotnet-start-istanbul.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Istanbul Park', true, 53, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull Ring', false, 53, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring', false, 53, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zandvoort', false, 53, 'es');

-- Pregunta 24
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('McLaren hizo un 1-2 en el GP de Hungría 2024. ¿Cuándo fue la última vez que lograron eso?', '4007762-81292888-2560-1440.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2012', false, 54, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2021', true, 54, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Miami 2024', false, 54, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadá 2010', false, 54, 'es');

-- Pregunta 25
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué país comenzó la temporada 2020?', '15938651546549.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia', false, 55, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Imola', false, 55, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña', false, 55, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria', true, 55, 'es');

-- Pregunta 26
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos días dura un Gran Premio?', '15938651546549.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', false, 56, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 56, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', true, 56, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('4', false, 56, 'es');

-- Pregunta 27
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es el equipo con más participaciones en F1?', '58.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 57, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 57, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 57, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 57, 'es');

-- Pregunta 28
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el primer Gran Premio que ganó Lewis Hamilton?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Canadá 2007', true, 58, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Italia 2010', false, 58, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de España 2008', false, 58, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Alemania 2009', false, 58, 'es');

-- Pregunta 29
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién tiene el récord de más victorias en F1?', 'article-1377757-0BAA374500000578-340_634x432.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 59, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 59, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 59, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 59, 'es');

-- Pregunta 30
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué equipo tiene más victorias en la historia de la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 60, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 60, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 60, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 60, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the longest track in Formula 1 history?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('SpaFrancorchamps Circuit', false, 61, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Autodromo Hermanos Rodríguez', false, 61, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuit Gilles Villeneuve', false, 61, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring', true, 61, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which race track is by far the longest regularly used for Formula 1 Grand Prix races?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuit de Spa-Francorchamps', true, 62, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Autódromo José Carlos Pace', false, 62, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuit Gilles Villeneuve', false, 62, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring', false, 62, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which racing team in Formula 1 are associated with bright red cars?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 63, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 63, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', false, 63, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 63, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which successful F1 team owner built his cars in the woodshed of the family''s timber business?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ken Tyrrell', true, 64, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bernie Ecclestone', false, 64, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Flavio Briatore', false, 64, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ron Dennis', false, 64, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which year did Michael Schumacher win his first ever drivers championship in Formula One?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1990', false, 65, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1994', true, 65, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1992', false, 65, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1993', false, 65, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How do wind effects influence a F1 car''s performance?', 'images17.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Wind effects can alter the balance of the car, especially in fast corners.', true, 66, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Wind can cause lateral slides if not handled correctly.', false, 66, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Wind affects engine efficiency.', false, 66, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Wind influences the direction of the car during overtaking maneuvers.', false, 66, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the key difference between Q1, Q2, and Q3 classification systems in F1?', 'pierre-gasly-alphatauri-at02-i.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q1 determines who advances to the next round of qualification.', true, 67, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q2 decides the final positions in the starting grid.', false, 67, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q3 sets the initial order of the race.', false, 67, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q1 and Q2 define the drivers who participate in the race.', false, 67, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Why is overtaking so difficult in F1?', '15289134275279.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Due to the dirty air ejected by the car being chased.', true, 68, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Thanks to the team strategy to stay ahead.', false, 68, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Thanks to the FIA regulation that penalizes overtaking.', false, 68, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Because there are few clear opportunities to overtake on most tracks.', false, 68, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first country outside Europe to host a Formula 1 race?', NULL, 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil', false, 69, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('South Africa', false, 69, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia', true, 69, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('United States', false, 69, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who won the Spanish Grand Prix in 1966, marking the first victory for a British constructor since the introduction of free engine regulations?', NULL, 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jim Clark', true, 70, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jackie Stewart', false, 70, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('John Surtees', false, 70, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Graham Hill', false, 70, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which constructor has won the Formula 1 Constructors World Championship in the minimum number of seasons since its debut?', '360_F_471722307_raSMYjGlXua2GMuZoEHDEVNYSTLBOlni.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mclaren', false, 71, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull Racing', true, 71, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 71, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Scuderia Ferrari', false, 71, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which of these statements about tires in F1 is true?', 'Cuatro-neumaticos-Pirelli-de-carreras.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hard tires always offer more durability than soft tires.', false, 72, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Soft tires always offer more grip than hard tires.', false, 72, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('There is a specific type of tire called "intermediates" designed for mixed wet and dry conditions.', true, 72, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('All Formula 1 cars use tires of the same brand and specification.', false, 72, 'en');

-- Pregunta 31
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es el circuito más largo en la historia de la Fórmula 1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuito de Spa-Francorchamps', false, 73, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Autódromo Hermanos Rodríguez', false, 73, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuito Gilles Villeneuve', false, 73, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring', true, 73, 'es');

-- Pregunta 32
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué circuito es, con diferencia, el más largo usado regularmente en la Fórmula 1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuito de Spa-Francorchamps', true, 74, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Autódromo José Carlos Pace', false, 74, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Circuito Gilles Villeneuve', false, 74, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring', false, 74, 'es');

-- Pregunta 33
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué equipo de F1 está asociado con coches de color rojo brillante?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 75, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 75, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', false, 75, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 75, 'es');

-- Pregunta 34
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué exitoso dueño de equipo de F1 construyó sus coches en un cobertizo de madera de la empresa familiar?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ken Tyrrell', true, 76, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bernie Ecclestone', false, 76, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Flavio Briatore', false, 76, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ron Dennis', false, 76, 'es');

-- Pregunta 35
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año ganó Michael Schumacher su primer campeonato de pilotos en Fórmula 1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1990', false, 77, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1994', true, 77, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1992', false, 77, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1993', false, 77, 'es');

-- Pregunta 36
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cómo influyen los efectos del viento en el rendimiento de un coche de F1?', 'images17.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los efectos del viento pueden alterar el equilibrio del coche, especialmente en curvas rápidas.', true, 78, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El viento puede causar deslizamientos laterales si no se maneja bien.', false, 78, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El viento afecta la eficiencia del motor.', false, 78, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El viento influye en la dirección del coche al adelantar.', false, 78, 'es');

-- Pregunta 37
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la diferencia clave entre los sistemas de clasificación Q1, Q2 y Q3 en F1?', 'pierre-gasly-alphatauri-at02-i.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q1 determina quién avanza a la siguiente ronda de clasificación.', true, 79, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q2 decide las posiciones finales de la parrilla.', false, 79, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q3 establece el orden inicial de carrera.', false, 79, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Q1 y Q2 definen qué pilotos pueden competir.', false, 79, 'es');

-- Pregunta 38
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Por qué es tan difícil adelantar en F1?', '15289134275279.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Por el aire sucio que expulsa el coche que va delante.', true, 80, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Por la estrategia del equipo para mantenerse al frente.', false, 80, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Por las normas de la FIA que penalizan los adelantamientos.', false, 80, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Porque hay pocas oportunidades claras de adelantar en la mayoría de los circuitos.', false, 80, 'es');

-- Pregunta 39
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el primer país fuera de Europa en albergar una carrera de Fórmula 1?', NULL, 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil', false, 81, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sudáfrica', false, 81, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia', true, 81, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Estados Unidos', false, 81, 'es');

-- Pregunta 40
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién ganó el Gran Premio de España en 1966, marcando la primera victoria de un constructor británico bajo las nuevas regulaciones de motores?', NULL, 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jim Clark', true, 82, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jackie Stewart', false, 82, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('John Surtees', false, 82, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Graham Hill', false, 82, 'es');

-- Pregunta 41
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué constructor ganó el Campeonato de Constructores de F1 en el menor número de temporadas desde su debut?', '360_F_471722307_raSMYjGlXua2GMuZoEHDEVNYSTLBOlni.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 83, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull Racing', true, 83, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 83, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Scuderia Ferrari', false, 83, 'es');

-- Pregunta 42
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál de estas afirmaciones sobre neumáticos en F1 es verdadera?', 'Cuatro-neumaticos-Pirelli-de-carreras.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los neumáticos duros siempre ofrecen más durabilidad que los blandos.', false, 84, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los neumáticos blandos siempre ofrecen más agarre que los duros.', false, 84, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hay un tipo de neumático llamado "intermedios" diseñado para condiciones mixtas de lluvia y seco.', true, 84, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todos los coches de F1 usan neumáticos de la misma marca y especificación.', false, 84, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who holds the record for the most pole positions in a single season?', 'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_1.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 85, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 85, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 85, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 85, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which team has won the Constructors World Championship the most times?', 'desktop-wallpaper-f1-team-logos-formula1-f1-2021-teams.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mclaren', false, 86, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 86, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 86, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', false, 86, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('The Spanish Grand Prix is currently hold in Montmelo. Who was the first driver to win there?', 'fotos-gp-espana-f1-202287138-1653075223_6.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 87, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 87, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 87, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nigel Mansell', true, 87, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In what year did the current points system for F1 racing get introduced?', '450_1000.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1989', false, 88, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1995', false, 88, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2003', false, 88, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', true, 88, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many races make up the official F1 calendar?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('16', false, 89, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20', false, 89, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('24', true, 89, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('26', false, 89, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which country hosts the Circuit of Spa-Francorchamps?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('France', false, 90, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany', false, 90, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Belgium', true, 90, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy', false, 90, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which F1 circuit sees the highest average speeds during a race?', null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', true, 91, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spa-Francorchamps', false, 91, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', false, 91, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 91, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In 1998 F1 stopped using slick tyres. When were slick tires introduced to F1 racing back again?', 'f4b6d415-a39e-4797-a0b7-4806d5c9f923_source-aspect-ratio_default_0.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', false, 92, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2013', false, 92, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', true, 92, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2016', false, 92, 'en');

-- Pregunta 43
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién tiene el récord de más poles en una sola temporada?', 'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_1.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 93, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 93, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 93, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 93, 'es');

-- Pregunta 44
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué equipo ha ganado más veces el Campeonato de Constructores?', 'desktop-wallpaper-f1-team-logos-formula1-f1-2021-teams.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 94, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 94, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 94, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', false, 94, 'es');

-- Pregunta 45
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('El GP de España se celebra actualmente en Montmeló. ¿Quién fue el primer piloto en ganar allí?', 'fotos-gp-espana-f1-202287138-1653075223_6.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 95, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 95, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 95, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nigel Mansell', true, 95, 'es');

-- Pregunta 46
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año se introdujo el actual sistema de puntuación de F1?', '450_1000.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1989', false, 96, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1995', false, 96, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2003', false, 96, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', true, 96, 'es');

-- Pregunta 47
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas carreras conforman el calendario oficial de F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('16', false, 97, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20', false, 97, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('24', true, 97, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('26', false, 97, 'es');

-- Pregunta 48
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué país alberga el Circuito de Spa-Francorchamps?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia', false, 98, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania', false, 98, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bélgica', true, 98, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia', false, 98, 'es');

-- Pregunta 49
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué circuito tiene las velocidades medias más altas durante una carrera?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', true, 99, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spa-Francorchamps', false, 99, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', false, 99, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 99, 'es');

-- Pregunta 50
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En 1998, la F1 dejó de usar neumáticos lisos. ¿Cuándo se volvieron a introducir?', 'f4b6d415-a39e-4797-a0b7-4806d5c9f923_source-aspect-ratio_default_0.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', false, 100, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2013', false, 100, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', true, 100, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2016', false, 100, 'es');


-- Pregunta 51
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which city hosted the first night race ever held in Formula One?', 'gettyimages-499135626-612x612.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapore', true, 101, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu Dhabi', false, 101, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Shanghai', false, 101, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sakir', false, 101, 'en');

-- Pregunta 52
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first Formula 1 Grand Prix held in Asia?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malaysian Grand Prix (1999)', false, 102, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapore Grand Prix (2008)', false, 102, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Chinese Grand Prix (2004)', false, 102, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japanese Grand Prix (1976)', true, 102, 'en');

-- Pregunta 53
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many times has the Scuderia Ferrari team won the Italian Grand Prix?', 'ferrari-sonrie-monza-sancion-carlos-sainz-incluida-todo-funciona-bien-202289708-1662749006_1.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('14 times', false, 103, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('21 times', false, 103, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('19 times', true, 103, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('15 times', false, 103, 'en');

-- Pregunta 54
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many times has the Williams team won the Canadian Grand Prix?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5 times', false, 104, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('7 times', true, 104, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3 times', false, 104, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11 times', false, 104, 'en');

-- Pregunta 55
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What year were air brake systems introduced in F1?', 'upmac1f.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2014', false, 105, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2005', false, 105, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 105, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2011', true, 105, 'en');

-- Pregunta 56
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many times has the Renault team won the French Grand Prix?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5 times', true, 106, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3 times', false, 106, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8 times', false, 106, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('12 times', false, 106, 'en');

-- Pregunta 57
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first year in which the brake caliper system was used?', 'upmac1f.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1983', false, 107, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1976', true, 107, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1990', false, 107, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1968', false, 107, 'en');

-- Pregunta 58
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first Formula 1 Grand Prix in which the use of lead-free fuels was allowed?', '1366_2000.jpeg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('South Africa 1992', true, 108, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 1987', false, 108, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 1999', false, 108, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2002', false, 108, 'en');

-- Pregunta 59
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the first Formula 1 Grand Prix in which the use of KERS (Kinetic Energy Recovery System) was allowed?', 'salida-alemania.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bahrein 2010', false, 109, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2011', false, 109, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2012', false, 109, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2009', true, 109, 'en');

-- Pregunta 60
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the main purpose behind the regulatory changes proposed by the "Weickershof Protocol" for F1 between 1995 and 1999?', null, 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To improve safety during races', false, 110, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To limit team budgets', true, 110, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To introduce new technical regulations', false, 110, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To promote sustainability in the sport', false, 110, 'en');

-- Pregunta 61
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the result of the technical transition in F1 in 1998?', 'gp-australia-1998-hakkinen-coulthard-soymotor.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('An increase in competitiveness among teams', true, 111, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Less safety cars', false, 111, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The introduction of new materials in the chassis of cars', false, 111, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The elimination of certain advanced technologies', false, 111, 'en');

-- Pregunta 62
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What was the main objective behind the introduction of the brake-by-wire system in F1?', 'brake-by-wire-el-ultimo-rompecabezas-de-la-f1-201521101_3.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To reduce the weight of the cars', false, 112, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To improve energy efficiency', false, 112, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To increase braking capacity under high temperature conditions', true, 112, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To facilitate quick tire replacement', false, 112, 'en');


-- Pregunta 63
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver has the highest average points per race over the last decade in Formula 1?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 113, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 113, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', true, 113, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 113, 'en');

-- Pregunta 64
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What percentage of races have been won by Mercedes since their entry into Formula 1 in 2010?', 'Schumacher_Mercedes_Jerez_(cropped).jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Less than 20%', false, 114, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Between 20% and 40%', false, 114, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Between 40% and 60%', true, 114, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('More than 60%', false, 114, 'en');

-- Pregunta 65
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which team has the record for the most consecutive wins in a single season?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mclaren', false, 115, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', false, 115, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 115, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', true, 115, 'en');

-- Pregunta 66
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver has the biggest amount of podiums achieved for their teams, compared to all his team-mates?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 116, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 116, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 116, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 116, 'en');

-- Pregunta 67
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many teams participate in Formula 1?', 'f1-australia-salida1_hd_32675.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10 teams', true, 117, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('7 teams', false, 117, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8 teams', false, 117, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11 teams', false, 117, 'en');

-- Pregunta 68
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the average maximum speed of F1 cars?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Over 320 km/h', true, 118, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Between 250 and 300 km/h', false, 118, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Less than 250 km/h', false, 118, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Exactly 350 km/h', false, 118, 'en');

-- Pregunta 69
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many points are awarded to the winner of a Formula 1 race?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('15 points', false, 119, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('25 points', true, 119, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20 points', false, 119, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10 points', false, 119, 'en');

-- Pregunta 70
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which organization regulates Formula 1?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIM', false, 120, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FINA', false, 120, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIBA', false, 120, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIA', true, 120, 'en');

-- Pregunta 71
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In Formula 1, what is the primary goal of a pit stop strategy during a race?', 'sergio-perez-red-bull-racing-r.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To minimize the time spent in the pits', true, 121, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To maximize the number of stops', false, 121, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To maintain the current position in the race', false, 121, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To gain positions relative to competitors', false, 121, 'en');

-- Pregunta 72
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the significance of choosing the right tire compound during a pit stop strategy?', '006_small.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It affects the cars handling', false, 122, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It determines the number of stops needed', false, 122, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It influences the cars speed', false, 122, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('All of the above', true, 122, 'en');

-- Pregunta 73
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What factors influence the decision to adopt a one-stop, two-stop, or three-stop strategy in Formula 1?', '5d2c1cab0ce69448248b4d2b-f1-2019-gp-gran-bretana-victoria-una-sola-parada-boxes.jpeg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Tire degradation rates', false, 123, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Track conditions', false, 123, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Car setup', false, 123, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('All of the above', true, 123, 'en');

-- Pregunta 51
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué ciudad organizó la primera carrera nocturna de la Fórmula 1?', 'gettyimages-499135626-612x612.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapur', true, 124, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu Dabi', false, 124, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Shanghái', false, 124, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sakhir', false, 124, 'es');

-- Pregunta 52
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el primer Gran Premio de Fórmula 1 celebrado en Asia?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Malasia (1999)', false, 125, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Singapur (2008)', false, 125, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de China (2004)', false, 125, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Japón (1976)', true, 125, 'es');

-- Pregunta 53
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas veces ha ganado el equipo Ferrari el Gran Premio de Italia?', 'ferrari-sonrie-monza-sancion-carlos-sainz-incluida-todo-funciona-bien-202289708-1662749006_1.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('14 veces', false, 126, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('21 veces', false, 126, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('19 veces', true, 126, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('15 veces', false, 126, 'es');

-- Pregunta 54
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas veces ha ganado el equipo Williams el Gran Premio de Canadá?', null, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5 veces', false, 127, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('7 veces', true, 127, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3 veces', false, 127, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11 veces', false, 127, 'es');

-- Pregunta 55
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año se introdujeron los sistemas de freno por aire en la F1?', 'upmac1f.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2014', false, 128, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2005', false, 128, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 128, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2011', true, 128, 'es');

-- Pregunta 56
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas veces ha ganado el equipo Renault el Gran Premio de Francia?', null, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5 veces', true, 129, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3 veces', false, 129, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8 veces', false, 129, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('12 veces', false, 129, 'es');

-- Pregunta 57
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año se utilizó por primera vez el sistema de pinzas de freno?', 'upmac1f.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1983', false, 130, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1976', true, 130, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1990', false, 130, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1968', false, 130, 'es');

-- Pregunta 58
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué Gran Premio se permitió por primera vez el uso de combustibles sin plomo en la F1?', '1366_2000.jpeg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sudáfrica 1992', true, 131, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 1987', false, 131, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 1999', false, 131, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2002', false, 131, 'es');

-- Pregunta 59
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué Gran Premio se permitió por primera vez el uso del sistema KERS?', 'salida-alemania.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Baréin 2010', false, 132, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2011', false, 132, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2012', false, 132, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2009', true, 132, 'es');

-- Pregunta 60
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el objetivo principal del "Protocolo Weickershof" para la F1 entre 1995 y 1999?', null, 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mejorar la seguridad en carrera', false, 133, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Limitar los presupuestos de los equipos', true, 133, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Introducir nuevas regulaciones técnicas', false, 133, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Promover la sostenibilidad en el deporte', false, 133, 'es');

-- Pregunta 61
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el resultado de la transición técnica de la F1 en 1998?', 'gp-australia-1998-hakkinen-coulthard-soymotor.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Un aumento de la competitividad entre equipos', true, 134, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Menos coches de seguridad', false, 134, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Introducción de nuevos materiales en el chasis', false, 134, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Eliminación de tecnologías avanzadas', false, 134, 'es');

-- Pregunta 62
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el objetivo principal del sistema brake-by-wire en la F1?', 'brake-by-wire-el-ultimo-rompecabezas-de-la-f1-201521101_3.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Reducir el peso de los coches', false, 135, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mejorar la eficiencia energética', false, 135, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Aumentar la capacidad de frenado a altas temperaturas', true, 135, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Facilitar el cambio rápido de neumáticos', false, 135, 'es');

-- Pregunta 63
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene el mayor promedio de puntos por carrera en la última década?', null, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 136, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 136, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', true, 136, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 136, 'es');

-- Pregunta 64
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué porcentaje de carreras ha ganado Mercedes desde su entrada en la F1 en 2010?', 'Schumacher_Mercedes_Jerez_(cropped).jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Menos del 20%', false, 137, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Entre el 20% y 40%', false, 137, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Entre el 40% y 60%', true, 137, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Más del 60%', false, 137, 'es');

-- Pregunta 65
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué equipo tiene el récord de más victorias consecutivas en una sola temporada?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 138, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', false, 138, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 138, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', true, 138, 'es');

-- Pregunta 66
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto ha conseguido más podios respecto a sus compañeros en cada equipo?', null, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 139, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 139, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 139, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 139, 'es');

-- Pregunta 67
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos equipos participan en la Fórmula 1?', 'f1-australia-salida1_hd_32675.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10 equipos', true, 140, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('7 equipos', false, 140, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8 equipos', false, 140, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11 equipos', false, 140, 'es');

-- Pregunta 68
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la velocidad máxima promedio de los coches de F1?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Más de 320 km/h', true, 141, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Entre 250 y 300 km/h', false, 141, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Menos de 250 km/h', false, 141, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Exactamente 350 km/h', false, 141, 'es');

-- Pregunta 69
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos puntos se otorgan al ganador de una carrera de F1?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('15 puntos', false, 142, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('25 puntos', true, 142, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20 puntos', false, 142, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10 puntos', false, 142, 'es');

-- Pregunta 70
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué organización regula la Fórmula 1?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIM', false, 143, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FINA', false, 143, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIBA', false, 143, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('FIA', true, 143, 'es');

-- Pregunta 71
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es el objetivo principal de una estrategia de parada en boxes durante una carrera de F1?', 'sergio-perez-red-bull-racing-r.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Minimizar el tiempo en boxes', true, 144, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Maximizar el número de paradas', false, 144, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mantener la posición en pista', false, 144, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ganar posiciones respecto a rivales', false, 144, 'es');

-- Pregunta 72
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué importancia tiene elegir el compuesto de neumático correcto durante una parada en boxes?', '006_small.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Afecta el manejo del coche', false, 145, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Determina el número de paradas necesarias', false, 145, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Influye en la velocidad del coche', false, 145, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', true, 145, 'es');

-- Pregunta 73
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué factores influyen en adoptar una estrategia de una, dos o tres paradas en F1?', '5d2c1cab0ce69448248b4d2b-f1-2019-gp-gran-bretana-victoria-una-sola-parada-boxes.jpeg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Tasa de degradación de neumáticos', false, 146, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Condiciones de pista', false, 146, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Configuración del coche', false, 146, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', true, 146, 'es');


-- Pregunta 74
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In a two-stop strategy, why might a team choose to start on the medium tire compound instead of the soft?', 'starting-grid-1.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Medium tires offer better grip in the beginning of the race', false, 147, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Starting on medium tires allows for a more flexible first stint', false, 147, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Starting on medium tires allows for a more flexible strategy', true, 147, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Medium tires are cheaper', false, 147, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('All of the above', false, 147, 'en');

-- Pregunta 75
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the advantage of using a three-stop strategy in Formula 1?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It allows for fresher tires at the end of the race', true, 148, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It provides more opportunities for overtaking', false, 148, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It minimizes the risk of tire failure', false, 148, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('It ensures a consistent pace throughout the race', false, 148, 'en');

-- Pregunta 76
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Consider a Formula 1 race where the weather forecast predicts heavy rain towards the latter stages of the race. In the given scenario, what would be the optimal pit stop strategy for maximizing the chances of winning the Formula 1 race, considering the dynamic weather conditions, tyre selection, car performance, safety risks, and competitor strategies?', 'analisis-gp-brasil-f1-2023-soymotor.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Stick to the initial plan of starting on intermediate tyres and hope for the best, minimizing pit stops to save time', false, 149, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Switch to extreme wet tyres as soon as light rain starts, prioritizing performance in wet conditions despite the risk of early tyre degradation', false, 149, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Delay the switch to extreme wet tyres until the very end of the race, hoping to maintain speed in the dry conditions and then capitalize on the performance boost in the heavy rain', true, 149, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Continuously monitor track conditions and adjust tyre strategy accordingly, focusing on maintaining a balance between speed and tyre life to stay ahead of competitors', false, 149, 'en');

-- Pregunta 77
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In a Formula 1 race, drivers find themselves in a unique situation where the race is being held in extremely hot conditions, causing the asphalt to heat up significantly. This leads to increased tire degradation and reduced grip. Given this scenario, how would you strategize pit stops for the drivers considering all started on softs?', 'captura-4643897367.jpg', 3, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Stick rigidly to the hard compound tyres throughout the entire race, relying on the durability of these tyres to maintain a steady pace', false, 150, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Make an early switch to medium compound tyres to benefit from improved grip and performance, despite the potential for faster tire degradation.', true, 150, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Delay the switch to medium compound tyres until the very end of the race, attempting to preserve the hard compound tires for as long as possible to avoid unnecessary pit stops', false, 150, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Trying to use the hard tyres as much time as possible to have more consistent lap times during the race', false, 150, 'en');

-- Pregunta 78
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Overtake Under Yellow Flags During a race, there is an accident on the track, and yellow flags are deployed. A driver attempts to make a pass while the yellow flags are out. How is the sporting regulations applied in this situation?', 'a-marshal-holds-a-yellow-flag-1.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES
('Passing is allowed as long as the other car goes very slow and it does not put the driver being passed at risk', true, 151, 'en'),
('Passing under yellow flags is prohibited to avoid additional risks', false, 151, 'en'),
('Passing is allowed but the passing driver must yield position in the next corner', false, 151, 'en'),
('Passing is allowed without restrictions', false, 151, 'en');

-- Pregunta 74
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En una estrategia a dos paradas, ¿por qué un equipo podría elegir comenzar con el compuesto medio en lugar del blando?', 'starting-grid-1.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los neumáticos medios ofrecen mejor agarre al inicio de la carrera', false, 152, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Comenzar con neumáticos medios permite un primer stint más flexible', false, 152, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Comenzar con neumáticos medios permite una estrategia más flexible', true, 152, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los neumáticos medios son más baratos', false, 152, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', false, 152, 'es');

-- Pregunta 75
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la ventaja de usar una estrategia a tres paradas en Fórmula 1?', null, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Permite tener neumáticos más frescos al final de la carrera', true, 153, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Proporciona más oportunidades para adelantar', false, 153, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Minimiza el riesgo de fallos en los neumáticos', false, 153, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Asegura un ritmo constante durante toda la carrera', false, 153, 'es');

-- Pregunta 76
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En una carrera de Fórmula 1 donde se pronostica lluvia intensa en las etapas finales, ¿cuál sería la estrategia óptima de paradas en boxes para maximizar las posibilidades de victoria considerando clima, neumáticos, rendimiento, riesgos y estrategias de rivales?', 'analisis-gp-brasil-f1-2023-soymotor.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Seguir con el plan inicial de arrancar con intermedios y esperar lo mejor, minimizando las paradas', false, 154, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cambiar a neumáticos de lluvia extrema tan pronto comience la llovizna', false, 154, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Retrasar el cambio a neumáticos de lluvia extrema hasta el final de la carrera para aprovechar el rendimiento en seco', true, 154, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monitorear continuamente las condiciones y ajustar neumáticos buscando un equilibrio entre velocidad y durabilidad', false, 154, 'es');

-- Pregunta 77
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En una carrera de F1 con condiciones extremadamente calurosas que aumentan la degradación y reducen el agarre, ¿cómo planificarías las paradas si todos comienzan con blandos?', 'captura-4643897367.jpg', 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Usar exclusivamente neumáticos duros para toda la carrera confiando en su durabilidad', false, 155, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hacer un cambio temprano a neumáticos medios para beneficiarse del mejor agarre', true, 155, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Retrasar el cambio a medios hasta el final para conservar los duros lo más posible', false, 155, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Usar los duros el mayor tiempo posible para tener vueltas más constantes', false, 155, 'es');

-- Pregunta 78
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Adelantamiento bajo banderas amarillas: durante una carrera hay un accidente y se ondean banderas amarillas. Un piloto intenta adelantar. ¿Cómo se aplica el reglamento deportivo?', 'a-marshal-holds-a-yellow-flag-1.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Se permite adelantar si el coche adelantado va muy lento y no hay riesgo', true, 156, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Adelantar bajo amarilla está prohibido para evitar riesgos', false, 156, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Se permite adelantar pero se debe ceder la posición en la siguiente curva', false, 156, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Se permite adelantar sin restricciones', false, 156, 'es');


-- Pregunta 79
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Collision While Racing Two drivers collide during a race but manage to continue racing. What action should the stewards take regarding this incident?', 'el-red-bull-de-max-verstappen-vuela-tras-el-toque-DMCHB3HIH5HSZOMSUQAMPNPYXQ.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES
('No action, as both drivers continued racing', false, 157, 'en'),
('Warn both drivers about future incidents', false, 157, 'en'),
('Investigate for potential penalties due to dangerous driving', true, 157, 'en'),
('Disqualify both drivers from the race', false, 157, 'en');

-- Pregunta 80
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Driver Forced Off Track forces another off the track during a close battle. What is the appropriate response from the stewards?', 'images22.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES
('No action, as it was part of the racing', false, 158, 'en'),
('Investigate the driver who forced the other off track and reprimand the driver forced off track ', false, 158, 'en'),
('Investigate for potential penalties due to forcing another driver off track in both cases', true, 158, 'en'),
('Disqualify the driver who forced the other off track', false, 158, 'en');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Defensive Driving During Braking A driver defends against an attack by moving during braking, which leads to contact with another driver. What is the correct course of action by the stewards?', 'verstappen-norris-635x358.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Disqualify the driver who moved under braking', false, 159, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Put a several penalty to the driver who moved under breaking', true, 159, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Put just a reprimand for that action', false, 159, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Just a racing incident', false, 159, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which was Ayrton Senna`s first car in F1?', NULL, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mclaren', false, 160, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lotus', false, 160, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toleman', true, 160, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', false, 160, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which was Michael Schumacher`s first car in F1?', NULL, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', false, 161, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', true, 161, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Benetton', false, 161, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 161, 'en');

-- Pregunta 79
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Colisión en carrera: dos pilotos colisionan pero logran continuar. ¿Qué deben hacer los comisarios?', 'el-red-bull-de-max-verstappen-vuela-tras-el-toque-DMCHB3HIH5HSZOMSUQAMPNPYXQ.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No hacer nada, ya que ambos continuaron', false, 162, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Advertir a ambos pilotos sobre incidentes futuros', false, 162, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Investigar por posible conducción peligrosa', true, 162, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Descalificar a ambos pilotos', false, 162, 'es');

-- Pregunta 80
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Conductor empuja fuera de pista a otro durante una batalla cerrada. ¿Cuál es la respuesta adecuada de los comisarios?', 'images22.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No hacer nada, fue parte de la carrera', false, 163, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Investigar al piloto que empujó y reprender al que fue sacado de pista', false, 163, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Investigar posibles sanciones por sacar a otro de pista en ambos casos', true, 163, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Descalificar al piloto que empujó al otro', false, 163, 'es');

-- Pregunta 81
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Conducción defensiva bajo frenada: un piloto se mueve mientras frena y causa contacto. ¿Qué deben hacer los comisarios?', 'verstappen-norris-635x358.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Descalificar al piloto que se movió frenando', false, 164, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Imponer una penalización severa al piloto que se movió bajo frenada', true, 164, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Solo una reprimenda por esa acción', false, 164, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fue solo un incidente de carrera', false, 164, 'es');

-- Pregunta 82
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el primer coche de Ayrton Senna en F1?', NULL, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 165, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lotus', false, 165, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toleman', true, 165, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', false, 165, 'es');

-- Pregunta 83
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue el primer coche de Michael Schumacher en F1?', NULL, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', false, 166, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', true, 166, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Benetton', false, 166, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 166, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which is Fernando Alonso`s first win in F1?', NULL, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('France 2004', false, 167, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 2003', false, 167, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2005', false, 167, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2003', true, 167, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which was Ayrton Senna`s first win in F1?', NULL, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Donnington 1993', false, 168, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Portugal 1985', true, 168, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monaco 1984', false, 168, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 1988', false, 168, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which driver holds the record for more races having podiums but not winning in F1?', NULL, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lando Norris', false, 169, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Romain Grosjean', false, 169, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nick Heidfeld', true, 169, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sergio Perez', false, 169, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('What is the primary difference between the deployment of the Safety Car and the Red Flag during Formula 1 races?', '16474210250936.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The Safety Car is used when there are adverse weather conditions, while the Red Flag indicates a temporary halt in the race due to track hazards', false, 170, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The Red Flag means the race has been completely stopped, whereas the Safety Car slows down the cars but allows the race to continue', true, 170, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The Safety Car is activated for significant accidents on the track, while the Red Flag is shown at the end of the race to signal the official conclusion', false, 170, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Both serve to indicate the same type of situation; only the colors change', false, 170, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which driver has the biggest amount of pole positions in F1 history?', 'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_2.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 171, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 171, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 171, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 171, 'en');

-- Pregunta 84
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue la primera victoria de Fernando Alonso en F1?', NULL, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 2004', false, 172, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 2003', false, 172, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2005', false, 172, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2003', true, 172, 'es');

-- Pregunta 85
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue la primera victoria de Ayrton Senna en F1?', NULL, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Donington 1993', false, 173, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Portugal 1985', true, 173, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mónaco 1984', false, 173, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 1988', false, 173, 'es');

-- Pregunta 86
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene el récord de más podios sin haber ganado una carrera en F1?', NULL, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lando Norris', false, 174, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Romain Grosjean', false, 174, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nick Heidfeld', true, 174, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sergio Pérez', false, 174, 'es');

-- Pregunta 87
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la diferencia principal entre el Safety Car y la Bandera Roja en Fórmula 1?', '16474210250936.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El Safety Car se usa con lluvia, mientras la Bandera Roja detiene la carrera por peligros en pista', false, 175, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('La Bandera Roja significa carrera detenida, el Safety Car ralentiza pero permite continuar', true, 175, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El Safety Car se usa en accidentes grandes, la Bandera Roja al final de la carrera', false, 175, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ambos indican lo mismo, sólo cambia el color', false, 175, 'es');

-- Pregunta 88
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene la mayor cantidad de poles en la historia de F1?', 'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_2.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 176, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 176, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 176, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 176, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which driver has the biggest amount of podiums in F1 history?', '38fb463a6228ca4c1a6724f0eb3b04590518d237.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alain Prost', false, 177, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 177, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 177, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 177, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which driver was the first one to win the f1 world championship?', NULL, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Giuseppe Farina', true, 178, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Juan Manuel Fangio', false, 178, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jim Clark', false, 178, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alberto Ascari', false, 178, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Which drivers holds the record for winning a championship with the biggest age?', NULL, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alberto Ascari', false, 179, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Giuseppe Farina', false, 179, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Juan Manuel Fangio', true, 179, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Niki Lauda', false, 179, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Name the car', 'Rubens_Barrichello_2006_USA.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Honda', true, 180, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Super Aguri', false, 180, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 180, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', false, 180, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Since Ferrari won their last championship to date, which driver has taken the biggest amount of wins for the scuderia?', '1200px-Kimi_Raikkonen_won_2007_Brazil_GP.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 181, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Charles Leclerc', false, 181, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 181, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 181, 'en');

-- Pregunta 89
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene la mayor cantidad de podios en la historia de la F1?', '38fb463a6228ca4c1a6724f0eb3b04590518d237.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alain Prost', false, 182, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 182, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', false, 182, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', true, 182, 'es');

-- Pregunta 90
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto fue el primero en ganar el campeonato mundial de F1?', NULL, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Giuseppe Farina', true, 183, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Juan Manuel Fangio', false, 183, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jim Clark', false, 183, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alberto Ascari', false, 183, 'es');

-- Pregunta 91
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto ostenta el récord de haber ganado un campeonato con mayor edad?', NULL, 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alberto Ascari', false, 184, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Giuseppe Farina', false, 184, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Juan Manuel Fangio', true, 184, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Niki Lauda', false, 184, 'es');

-- Pregunta 92
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el coche', 'Rubens_Barrichello_2006_USA.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Honda', true, 185, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Super Aguri', false, 185, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 185, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', false, 185, 'es');

-- Pregunta 93
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Desde que Ferrari ganó su último campeonato hasta hoy, ¿qué piloto ha conseguido más victorias para la Scuderia?', '1200px-Kimi_Raikkonen_won_2007_Brazil_GP.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', true, 186, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Charles Leclerc', false, 186, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 186, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 186, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Name track and year for this moment', 'hamilton_vettel_glock_brasil_2008_soy_motor.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fuji 2007', false, 187, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 2008', true, 187, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea 2010', false, 187, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 2009', false, 187, 'en');
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language) VALUES ('Name track and year for this moment', '709607-21389434-2560-1440.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu dhabi 2007', false, 188, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2008', false, 188, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bahrein 2008', true, 188, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu Dhabi 2009', false, 188, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'image23.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japan 1989', true, 189, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 1991', false, 189, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 1988', false, 189, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 1990', false, 189, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'cui-png2.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea 2011', false, 190, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2012', true, 190, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japan 2013', false, 190, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea 2010', false, 190, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', '15644308053724.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring 2020', false, 191, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2018', false, 191, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Great Britian 2018', false, 191, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany 2019', true, 191, 'en');

-- Pregunta 94
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'hamilton_vettel_glock_brasil_2008_soy_motor.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fuji 2007', false, 192, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2008', true, 192, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea 2010', false, 192, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2009', false, 192, 'es');

-- Pregunta 95
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '709607-21389434-2560-1440.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu Dabi 2007', false, 193, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2008', false, 193, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Baréin 2008', true, 193, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Abu Dabi 2009', false, 193, 'es');

-- Pregunta 96
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'image23.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japón 1989', true, 194, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 1991', false, 194, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 1988', false, 194, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 1990', false, 194, 'es');

-- Pregunta 97
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'cui-png2.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea 2011', false, 195, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2012', true, 195, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japón 2013', false, 195, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea 2010', false, 195, 'es');

-- Pregunta 98
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '15644308053724.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring 2020', false, 196, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2018', false, 196, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña 2018', false, 196, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania 2019', true, 196, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', '_103266921_hamilton_vettel_getty1.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka 2018', false, 197, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2018', true, 197, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2019', false, 197, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('France 2019', false, 197, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track', 'sddefault.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring', false, 198, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Magny Cours', false, 198, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', false, 198, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hockenheim', true, 198, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In which year F1 started to put color on tyres to distinguish the different compounds?', 'ede47cd9-7902-4751-8c24-46e2a3b7a386_source-aspect-ratio_default_0.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 199, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2005', false, 199, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2011', false, 199, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', true, 199, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track', 'lewishamiltongpchina2008.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 200, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Shanghai', true, 200, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea', false, 200, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('India', false, 200, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track and year for this moment', '1366_2000.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2013', false, 201, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea 2011', false, 201, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('India 2013', true, 201, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 2012', false, 201, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('During a Formula 1 race, a major accident occurs that results in significant debris scattered across the track, posing a substantial risk to the drivers. The driver who had the accident is okay. The race director needs to decide on the appropriate action. Which of the following options accurately reflects the correct procedure according to the FIA Sporting Regulations?', 'asi-fue-el-accidente-de-carlos-V6JX6ICWVVCLTE44QGHEEUIUQQ.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Deploy the Safety Car to slow down the field and allow marshals to clear the debris', true, 202, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Immediately halt the race by displaying the red flag due to the severity of the accident', false, 202, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Continue the race under caution without deploying the Safety Car', false, 202, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES    ('Allow the drivers to decide whether to slow down or not', false, 202, 'en');

-- Pregunta 99
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '_103266921_hamilton_vettel_getty1.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka 2018', false, 203, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2018', true, 203, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2019', false, 203, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 2019', false, 203, 'es');

-- Pregunta 100
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', 'sddefault.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring', false, 204, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Magny-Cours', false, 204, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', false, 204, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hockenheim', true, 204, 'es');

-- Pregunta 101
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué año la F1 comenzó a usar colores en los neumáticos para distinguir los compuestos?', 'ede47cd9-7902-4751-8c24-46e2a3b7a386_source-aspect-ratio_default_0.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 205, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2005', false, 205, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2011', false, 205, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', true, 205, 'es');

-- Pregunta 102
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', 'lewishamiltongpchina2008.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 206, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Shanghái', true, 206, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea', false, 206, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('India', false, 206, 'es');

-- Pregunta 103
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '1366_2000.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2013', false, 207, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea 2011', false, 207, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('India 2013', true, 207, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2012', false, 207, 'es');

-- Pregunta 104
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Durante una carrera de F1 ocurre un accidente que deja muchos restos en pista. El piloto está bien, pero hay riesgo para los demás. Según el reglamento deportivo FIA, ¿cuál es la acción correcta del director de carrera?', 'asi-fue-el-accidente-de-carlos-V6JX6ICWVVCLTE44QGHEEUIUQQ.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Desplegar el Safety Car para ralentizar el pelotón y permitir limpiar la pista', true, 208, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Detener la carrera de inmediato con bandera roja por la gravedad del accidente', false, 208, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Continuar bajo precaución sin desplegar Safety Car', false, 208, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Permitir que los pilotos decidan si reducir la velocidad o no', false, 208, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Heavy rain continues to fall during a Formula 1 race, making the track unsafe for racing. The race director must determine the correct course of action. Which of the following options aligns with the FIA Sporting Regulations?', 'images24.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Deploy the Safety Car to slow down the field and wait for the rain to subside', false, 209, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Immediately halt the race by displaying the red flag due to the unsafe track conditions', true, 209, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Continue the race under caution without deploying the Safety Car or the red flag', false, 209, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Allow the drivers to decide whether to continue racing or not', false, 209, 'en');

-- Pregunta 106
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which country hosted the first Formula 1 Grand Prix in history?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('France', false, 210, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy', false, 210, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('United Kingdom', true, 210, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany', false, 210, 'en');

-- Pregunta 107
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What circuit has hosted the most Grand Prix in the history of Formula 1?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', false, 211, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', true, 211, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spa-Francorchamps', false, 211, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 211, 'en');

-- Pregunta 108
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many times has the Spanish Grand Prix been the host of the inaugural race of a new Formula 1 championship?', 'formula-1-european-gp-1997-jac-2.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', true, 212, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 212, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', false, 212, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Never', false, 212, 'en');

-- Pregunta 109
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the highest number of points obtained by a driver in a single season?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher 2002', false, 213, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen 2023', true, 213, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton 2019', false, 213, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel 2013', false, 213, 'en');

-- Pregunta 110
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many times has Fernando Alonso raced the Australian GP?', 'fernando-alonso-aston-martin-a-3.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('19 times', false, 214, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('21 times', false, 214, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20 times', true, 214, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('17 times', false, 214, 'en');

-- Pregunta 111
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver', 'fernando-alonso-jaguar-r3-1.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pedro de la Rosa', false, 215, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Eddie Irvine', false, 215, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mark Webber', false, 215, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 215, 'en');

-- Pregunta 112
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver', 'Valentino-Rossi-piloto-F1-Ferrari-14.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Felipe Massa', false, 216, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 216, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 216, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No F1 driver', true, 216, 'en');

-- Pregunta 105
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Lluvia intensa continúa cayendo durante una carrera de Fórmula 1, haciendo que la pista sea insegura para competir. El director de carrera debe determinar el curso de acción correcto. ¿Cuál de las siguientes opciones se ajusta al Reglamento Deportivo de la FIA?', 'images24.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Desplegar el coche de seguridad para ralentizar el grupo y esperar que la lluvia disminuya', false, 217, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Detener inmediatamente la carrera mostrando la bandera roja debido a las condiciones inseguras de la pista', true, 217, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Continuar la carrera con precaución sin desplegar el coche de seguridad ni la bandera roja', false, 217, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Permitir que los pilotos decidan si desean continuar o no', false, 217, 'es');

-- Pregunta 106
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué país acogió el primer Gran Premio de Fórmula 1 de la historia?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia', false, 218, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia', false, 218, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Reino Unido', true, 218, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania', false, 218, 'es');

-- Pregunta 107
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué circuito ha albergado más Grandes Premios en la historia de la Fórmula 1?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza', false, 219, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', true, 219, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spa-Francorchamps', false, 219, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka', false, 219, 'es');

-- Pregunta 108
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas veces ha sido el Gran Premio de España la carrera inaugural de una temporada de Fórmula 1?', 'formula-1-european-gp-1997-jac-2.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', true, 220, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 220, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', false, 220, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nunca', false, 220, 'es');

-- Pregunta 109
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la mayor cantidad de puntos obtenidos por un piloto en una sola temporada?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher 2002', false, 221, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen 2023', true, 221, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton 2019', false, 221, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel 2013', false, 221, 'es');

-- Pregunta 110
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas veces ha competido Fernando Alonso en el GP de Australia?', 'fernando-alonso-aston-martin-a-3.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('19 veces', false, 222, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('21 veces', false, 222, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('20 veces', true, 222, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('17 veces', false, 222, 'es');

-- Pregunta 111
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', 'fernando-alonso-jaguar-r3-1.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pedro de la Rosa', false, 223, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Eddie Irvine', false, 223, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mark Webber', false, 223, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', true, 223, 'es');

-- Pregunta 112
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', 'Valentino-Rossi-piloto-F1-Ferrari-14.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Felipe Massa', false, 224, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 224, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 224, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No es un piloto de F1', true, 224, 'es');


-- Pregunta 113
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('F1 left USA in 2007. When was the first United States Grand Prix held after its reintroduction to the Formula 1 calendar?', 'USGP_F1_COTA_3_US_Grand_Prix_Formula_1_at_COTA_2d7014fd-e1cb-4c62-89d0-1e468ab9929c.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', false, 225, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 225, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2013', false, 225, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2012', true, 225, 'en');

-- Pregunta 114
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many drivers compete in each Grand Prix of a Formula One season?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('20', true, 226, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('24', false, 226, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('18', false, 226, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('22', false, 226, 'en');

-- Pregunta 115
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many Grand Prix Starts did Jackie Stewart have during his professional career?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('100', true, 227, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('150', false, 227, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('125', false, 227, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('110', false, 227, 'en');


-- Pregunta 116
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many Grand Prix Starts did world champion Michael Schumacher have during his career before 2007?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('250', false, 228, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('260', false, 228, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('270', false, 228, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('280', true, 228, 'en');

-- Pregunta 117 (duplicada en la base original, pero diferente ID para consistencia)
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many Grand Prix Starts did world champion Michael Schumacher have during his career before 2007?', NULL, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('250', false, 229, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('260', false, 229, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('270', false, 229, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('280', true, 229, 'en');

-- Pregunta 118
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name year and track for this moment?', 'BeaF-8xIcAAYBbM.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Valencia 2010', true, 230, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapur 2012', false, 230, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Korea 2011', false, 230, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canada 2009', false, 230, 'en');

-- Pregunta 119
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the team', '9.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', false, 231, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bar honda', false, 231, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', true, 231, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toleman', false, 231, 'en');

-- Pregunta 120
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('If the circuit is in wet conditions for the whole race and the drivers start with intermediate tyres, they need to do a pit stop?', '14885385788381.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Yes, as the rules say that every car must do one pit stop during a race at least', false, 232, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Yes, as non stopping can be very dangerous', false, 232, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('They can not pit if they want', true, 232, 'en');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('They need to put the wet tyres in the next stint', false, 232, 'en');

-- Pregunta 121
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'article-2351820-1A95E98F000005DC-265_634x286.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2012', false, 233, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2013', true, 233, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austin 2012', false, 233, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canada 2010', false, 233, 'en');

-- Pregunta 113
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('La F1 salió de EE. UU. en 2007. ¿Cuándo fue el primer Gran Premio de Estados Unidos tras su reintroducción al calendario de F1?', 'USGP_F1_COTA_3_US_Grand_Prix_Formula_1_at_COTA_2d7014fd-e1cb-4c62-89d0-1e468ab9929c.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('2010', false, 234, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2009', false, 234, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2013', false, 234, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2012', true, 234, 'es');

-- Pregunta 114
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos pilotos compiten en cada Gran Premio de una temporada de Fórmula 1?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('20', true, 235, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('24', false, 235, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('18', false, 235, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('22', false, 235, 'es');

-- Pregunta 115
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas salidas en Grandes Premios tuvo Jackie Stewart durante su carrera profesional?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('100', true, 236, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('150', false, 236, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('125', false, 236, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('110', false, 236, 'es');

-- Pregunta 116
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas salidas en Grandes Premios tuvo el campeón mundial Michael Schumacher durante su carrera antes de 2007?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('250', false, 237, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('260', false, 237, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('270', false, 237, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('280', true, 237, 'es');

-- Pregunta 117
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas salidas en Grandes Premios tuvo el campeón mundial Michael Schumacher durante su carrera antes de 2007?', NULL, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('250', false, 238, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('260', false, 238, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('270', false, 238, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('280', true, 238, 'es');

-- Pregunta 118
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Nombre del circuito y año de este momento?', 'BeaF-8xIcAAYBbM.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Valencia 2010', true, 239, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapur 2012', false, 239, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Corea 2011', false, 239, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadá 2009', false, 239, 'es');

-- Pregunta 119
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del equipo', '9.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', false, 240, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bar honda', false, 240, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', true, 240, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toleman', false, 240, 'es');

-- Pregunta 120
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Si el circuito está en condiciones de lluvia durante toda la carrera y los pilotos comienzan con neumáticos intermedios, ¿deben hacer una parada en boxes?', '14885385788381.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Sí, porque el reglamento dice que cada coche debe hacer al menos una parada en carrera', false, 241, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Sí, porque no parar puede ser muy peligroso', false, 241, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Pueden no parar si quieren', true, 241, 'es');
INSERT INTO Answer (name, correct, questionId, language)
VALUES ('Tienen que usar neumáticos de lluvia en el siguiente stint', false, 241, 'es');

-- Pregunta 121
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del circuito y año de este momento', 'article-2351820-1A95E98F000005DC-265_634x286.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2012', false, 242, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone 2013', true, 242, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austin 2012', false, 242, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadá 2010', false, 242, 'es');


-- Pregunta 122
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'COKcBbWVAAAi53b.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza 2015', true, 243, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2014', false, 243, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2015', false, 243, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka 2015', false, 243, 'en');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', '2da5e299e491fc1eae59abe0ff97ee1f.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 2007', false, 244, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Britain 2008', false, 244, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canada 2008', true, 244, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malaysia 2007', false, 244, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the team', '15185392040281.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 245);
INSERT INTO Answer (name, correct, questionId) VALUES ('BAR', true, 245);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 245);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 245);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the team', '219.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Arrows', false, 246);
INSERT INTO Answer (name, correct, questionId) VALUES ('Stewart', false, 246);
INSERT INTO Answer (name, correct, questionId) VALUES ('Prost GP', false, 246);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', true, 246);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Before 2024, when was the last time Mclaren won the championship?', 'f1-mclarens-india-inline.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('2007', false, 247);
INSERT INTO Answer (name, correct, questionId) VALUES ('2008', false, 247);
INSERT INTO Answer (name, correct, questionId) VALUES ('1999', false, 247);
INSERT INTO Answer (name, correct, questionId) VALUES ('1998', true, 247);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('When was the last time Mclaren won the championship to date?', 'f1-mclarens-india-inline.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('2007', false, 248);
INSERT INTO Answer (name, correct, questionId) VALUES ('2008', false, 248);
INSERT INTO Answer (name, correct, questionId) VALUES ('1999', false, 248);
INSERT INTO Answer (name, correct, questionId) VALUES ('1998', true, 248);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many teams competed in the inaugural Formula 1 World Championship season in 1950?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('14', true, 249);
INSERT INTO Answer (name, correct, questionId) VALUES ('12', false, 249);
INSERT INTO Answer (name, correct, questionId) VALUES ('11', false, 249);
INSERT INTO Answer (name, correct, questionId) VALUES ('13', false, 249);

-- Pregunta 122
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del circuito y año de este momento', 'COKcBbWVAAAi53b.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Monza 2015', true, 250, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2014', false, 250, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2015', false, 250, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suzuka 2015', false, 250, 'es');

-- Pregunta 123
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del circuito y año de este momento', '2da5e299e491fc1eae59abe0ff97ee1f.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 2007', false, 251, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña 2008', false, 251, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadá 2008', true, 251, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2007', false, 251, 'es');

-- Pregunta 124
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del equipo', '15185392040281.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sauber', false, 252, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('BAR', true, 252, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', false, 252, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Minardi', false, 252, 'es');

-- Pregunta 125
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del equipo', '219.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', false, 253, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Stewart', false, 253, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Prost GP', false, 253, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', true, 253, 'es');

-- Pregunta 126
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Antes de 2024, ¿cuándo fue la última vez que McLaren ganó el campeonato?', 'f1-mclarens-india-inline.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', false, 254, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', false, 254, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1999', false, 254, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1998', true, 254, 'es');

-- Pregunta 127
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuándo fue la última vez que McLaren ganó el campeonato hasta la fecha?', 'f1-mclarens-india-inline.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2007', false, 255, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2008', false, 255, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1999', false, 255, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1998', true, 255, 'es');

-- Pregunta 128
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos equipos compitieron en la temporada inaugural del Campeonato Mundial de Fórmula 1 en 1950?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('14', true, 256, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('12', false, 256, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11', false, 256, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('13', false, 256, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which car manufacturer has produced engines for the most constructors championships in Formula 1?', null, 3, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Ford', false, 257);
INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes', false, 257);
INSERT INTO Answer (name, correct, questionId) VALUES ('Ferrari', true, 257);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 257);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver holds the record for the most wins at the Monaco Grand Prix?', 'gp-monaco-1996-carrera-mas-caotica-historia-f1.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Ayrton Senna', true, 258);
INSERT INTO Answer (name, correct, questionId) VALUES ('Michael Schumacher', false, 258);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 258);
INSERT INTO Answer (name, correct, questionId) VALUES ('Alain Prost', false, 258);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver who did NOT win a grand prix in the 2012 season', 'f0777c49a212574fd31ea18b515392a9.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Pastor Maldonado', false, 259);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 259);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Rosberg', false, 259);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', true, 259);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver won the last Malaysian GP in F1?', 'SalidaGPMalasia2009.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 260);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 260);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Rosberg', false, 260);
INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', true, 260);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the maximum power output allowed for a Formula 1 engine?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('900', false, 261);
INSERT INTO Answer (name, correct, questionId) VALUES ('1000', false, 261);
INSERT INTO Answer (name, correct, questionId) VALUES ('1100', true, 261);
INSERT INTO Answer (name, correct, questionId) VALUES ('1200', false, 261);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many gears does a modern Formula 1 car have?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('5', false, 262);
INSERT INTO Answer (name, correct, questionId) VALUES ('6', false, 262);
INSERT INTO Answer (name, correct, questionId) VALUES ('7', false, 262);
INSERT INTO Answer (name, correct, questionId) VALUES ('8', true, 262);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many liters of fuel must a Formula 1 car carry for a race distance of 305 kilometers?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('150', true, 263);
INSERT INTO Answer (name, correct, questionId) VALUES ('100', false, 263);
INSERT INTO Answer (name, correct, questionId) VALUES ('200', false, 263);
INSERT INTO Answer (name, correct, questionId) VALUES ('250', false, 263);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the team', 'caterham-f1.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Jordan', false, 264);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 264);
INSERT INTO Answer (name, correct, questionId) VALUES ('Caterham', true, 264);
INSERT INTO Answer (name, correct, questionId) VALUES ('Benetton', false, 264);

-- Pregunta 129
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué fabricante de automóviles ha producido motores para la mayor cantidad de campeonatos de constructores en la Fórmula 1?', null, 3, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ford', false, 265, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mercedes', false, 265, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ferrari', true, 265, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Renault', false, 265, 'es');

-- Pregunta 130
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene el récord de más victorias en el Gran Premio de Mónaco?', 'gp-monaco-1996-carrera-mas-caotica-historia-f1.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', true, 266, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', false, 266, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 266, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alain Prost', false, 266, 'es');

-- Pregunta 131
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto NO ganó un Gran Premio en la temporada 2012?', 'f0777c49a212574fd31ea18b515392a9.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pastor Maldonado', false, 267, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 267, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nico Rosberg', false, 267, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Romain Grosjean', true, 267, 'es');

-- Pregunta 132
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto ganó el último Gran Premio de Malasia en la F1?', 'SalidaGPMalasia2009.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 268, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 268, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nico Rosberg', false, 268, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Max Verstappen', true, 268, 'es');

-- Pregunta 133
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la potencia máxima permitida para un motor de Fórmula 1?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('900', false, 269, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1000', false, 269, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1100', true, 269, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('1200', false, 269, 'es');

-- Pregunta 134
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas marchas tiene un coche moderno de Fórmula 1?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5', false, 270, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('6', false, 270, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('7', false, 270, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8', true, 270, 'es');

-- Pregunta 135
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos litros de combustible debe llevar un coche de Fórmula 1 para una distancia de carrera de 305 kilómetros?', null, 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('150', true, 271, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('100', false, 271, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('200', false, 271, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('250', false, 271, 'es');

-- Pregunta 136
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del equipo', 'caterham-f1.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jordan', false, 272, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sauber', false, 272, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Caterham', true, 272, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Benetton', false, 272, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the team', 'f1-spyker-2007.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Midland', false, 273);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 273);
INSERT INTO Answer (name, correct, questionId) VALUES ('Spyker', true, 273);
INSERT INTO Answer (name, correct, questionId) VALUES ('Arrows', false, 273);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver', 'Pedro_de_la_Rosa_2005_Britain.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId) VALUES ('Nick Heidfeld', false, 274);
INSERT INTO Answer (name, correct, questionId) VALUES ('Pedro de la Rosa', true, 274);
INSERT INTO Answer (name, correct, questionId) VALUES ('Juan Pablo Montoya', false, 274);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 274);


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which drink is sprayed by winning drivers at the end of a Formula One race?', 'podio_japon_2017_soy_motor.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Champagne', true, 275, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Water', false, 275, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Milk', false, 275, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Other drink', false, 275, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the significance of the yellow and red striped flag in Formula 1?', '1_foDYHEmOHMtHrSZgpP5q3A.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Caution required', true, 276, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pit lane closed', false, 276, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Danger ahead', false, 276, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('End of the race', false, 276, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the meaning of this flag?', '15929284269004.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Caution required', false, 277, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pit lane closed', false, 277, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Danger ahead', false, 277, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('End of the race', true, 277, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the meaning of this flag?', 'comisarios-bandera-amarilla-2021-soymotor.jpg', 278, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Caution required', false, 278, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pit lane closed', false, 278, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Danger ahead', true, 278, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('End of the race', false, 278, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What does performing an "undercut" mean in a Formula 1 race?', 'Undercut-F1.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Changing tires earlier than the other car to try to pass him', true, 279, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Waiting until the very last lap to change tires', false, 279, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Performing a pit stop after the leader to capitalize on their lead', false, 279, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Not changing tires at all during the race', false, 279, 'en');

-- Pregunta 137
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del equipo', 'f1-spyker-2007.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Midland', false, 280, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Force India', false, 280, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spyker', true, 280, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Arrows', false, 280, 'es');

-- Pregunta 138
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombre del piloto', 'Pedro_de_la_Rosa_2005_Britain.jpg', 2, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nick Heidfeld', false, 281, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pedro de la Rosa', true, 281, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Juan Pablo Montoya', false, 281, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Raikkonen', false, 281, 'es');

-- Pregunta 139
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué bebida se rocía por los pilotos ganadores al final de una carrera de Fórmula 1?', 'podio_japon_2017_soy_motor.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Champán', true, 282, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Agua', false, 282, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Leche', false, 282, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Otra bebida', false, 282, 'es');

-- Pregunta 140
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué significa la bandera de rayas rojas y amarillas en la Fórmula 1?', '1_foDYHEmOHMtHrSZgpP5q3A.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Precaución requerida', true, 283, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cierre del pit lane', false, 283, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Peligro por delante', false, 283, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fin de la carrera', false, 283, 'es');

-- Pregunta 141
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué significa esta bandera?', '15929284269004.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Precaución requerida', false, 284, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cierre del pit lane', false, 284, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Peligro por delante', false, 284, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fin de la carrera', true, 284, 'es');

-- Pregunta 142
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué significa esta bandera?', 'comisarios-bandera-amarilla-2021-soymotor.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Precaución requerida', false, 285, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cierre del pit lane', false, 285, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Peligro por delante', true, 285, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fin de la carrera', false, 285, 'es');

-- Pregunta 143
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué significa hacer un "undercut" en una carrera de Fórmula 1?', 'Undercut-F1.jpg', 1, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cambiar neumáticos antes que el otro coche para intentar adelantarlo', true, 286, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Esperar hasta la última vuelta para cambiar neumáticos', false, 286, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hacer la parada en boxes después del líder para aprovechar su ventaja', false, 286, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No cambiar neumáticos durante la carrera', false, 286, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What does performing an "overcut" mean in a Formula 1 race?', 'screenshot-2018-04-03-13-56-50.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Changing tyres after the other car to try to do the overtake', true, 287, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Waiting until the very last lap to change tyres', false, 287, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Performing a pit stop before the leader to capitalize on their lead', false, 287, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Not changing tires at all during the race', false, 287, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué hace performing an "overcut" significa en una carrera de Fórmula 1?', 'screenshot-2018-04-03-13-56-50.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cambiar neumáticos después que el otro coche para intentar adelantarlo', true, 288, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Esperar hasta la última vuelta para cambiar neumáticos', false, 288, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Parar en boxes antes que el líder para aprovechar la ventaja', false, 288, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('No cambiar neumáticos en toda la carrera', false, 288, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the primary function of the Virtual Safety Car (VSC) in Formula 1?', 'virtual-safety-car-3432279.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To bring all cars to a complete stop', false, 289, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To reduce the speed of all cars equally to allow for safe recovery of incidents or debris', true, 289, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To enforce a mandatory pit stop for all drivers', false, 289, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To introduce a temporary caution period without slowing down the cars', false, 289, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la función principal del Virtual Safety Car (VSC) en la Fórmula 1?', 'virtual-safety-car-3432279.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Detener por completo todos los coches', false, 290, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Reducir la velocidad de todos los coches por igual para permitir una recuperación segura de incidentes o escombros', true, 290, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Imponer una parada obligatoria en boxes para todos los pilotos', false, 290, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Introducir un período de precaución temporal sin reducir la velocidad de los coches', false, 290, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which is Sebastian Vettel`s first win in F1?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2009', false, 291, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2008', true, 291, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2007', false, 291, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Great Britian 2009', false, 291, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which is Max Verstappen`s first win in F1?', null, 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malaysia 2017', false, 292, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 2016', true, 292, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mexico 2017', false, 292, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brazil 2016', false, 292, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name year and track for this moment', '_45650053_07lewisgravel512.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2007', false, 293, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malaysia 2008', false, 293, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2007', true, 293, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2008', false, 293, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name year and track for this moment', 'FYqwDVvXkAMHGtB.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2015', false, 294, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2014', true, 294, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Spain 2014', false, 294, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany 2014', false, 294, 'en');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Ferrari achieved a 1-2 finish at the 2024 Australian GP. When was the last time they did that?', 'carlos-sainz-ferrari-sf-24-2.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bahrein 2022', true, 295, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2022', false, 295, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapore 2019', false, 295, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2017', false, 295, 'en');

-- Pregunta 146
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue la primera victoria de Sebastian Vettel en la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2009', false, 296, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2008', true, 296, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2007', false, 296, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña 2009', false, 296, 'es');

-- Pregunta 147
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál fue la primera victoria de Max Verstappen en la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2017', false, 297, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 2016', true, 297, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('México 2017', false, 297, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2016', false, 297, 'es');

-- Pregunta 148
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '_45650053_07lewisgravel512.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2007', false, 298, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2008', false, 298, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2007', true, 298, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2008', false, 298, 'es');

-- Pregunta 149
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'FYqwDVvXkAMHGtB.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2015', false, 299, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2014', true, 299, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('España 2014', false, 299, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania 2014', false, 299, 'es');

-- Pregunta 150
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Ferrari logró un 1-2 en el GP de Australia 2024. ¿Cuándo fue la última vez que lo consiguió antes de eso?', 'carlos-sainz-ferrari-sf-24-2.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Baréin 2022', true, 300, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 2022', false, 300, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Singapur 2019', false, 300, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2017', false, 300, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the only driver that holds the record for being on the podium in every race of a single season?', null, 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 301, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', true, 301, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 301, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 301, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'Kepernyofoto-2024-02-09-8.31.33-e1707464078190.png', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nurburgring 2006', false, 302, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Great Britian 2005', false, 302, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('France 2006', false, 302, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2006', true, 302, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'racefansdotnet-20180903-103054-68.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2019', false, 303, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2018', true, 303, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2018', false, 303, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 2019', false, 303, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', '5f983feff4709d5867dcc940.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2012', false, 304, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2010', false, 304, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2013', false, 304, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2011', true, 304, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'coulthard-mschumacher-francuska-2000-1024x674.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany 1999', false, 305, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2001', false, 305, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('France 2000', true, 305, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungary 1998', false, 305, 'en');

-- Pregunta 151
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el único piloto que ha subido al podio en todas las carreras de una misma temporada?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 306, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Michael Schumacher', true, 306, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sebastian Vettel', false, 306, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ayrton Senna', false, 306, 'es');

-- Pregunta 152
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'Kepernyofoto-2024-02-09-8.31.33-e1707464078190.png', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nürburgring 2006', false, 307, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña 2005', false, 307, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 2006', false, 307, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2006', true, 307, 'es');

-- Pregunta 153
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'racefansdotnet-20180903-103054-68.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2019', false, 308, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2018', true, 308, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2018', false, 308, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2019', false, 308, 'es');

-- Pregunta 154
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', '5f983feff4709d5867dcc940.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2012', false, 309, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2010', false, 309, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2013', false, 309, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2011', true, 309, 'es');

-- Pregunta 155
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'coulthard-mschumacher-francuska-2000-1024x674.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania 1999', false, 310, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2001', false, 310, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 2000', true, 310, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 1998', false, 310, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'gp-de-belgica-2004-siete-veces-michael-schumacher-2024103232-1720946726_3.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2003', false, 311, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Germany 2004', false, 311, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('France 2003', false, 311, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Belgium 2004', true, 311, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'images25.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japan 2005', true, 312, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japan 2006', false, 312, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2004', false, 312, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Belgium 2005', false, 312, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment', 'image26.jpg', 1, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2020', false, 313, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2019', false, 313, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italy 2021', true, 313, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2021', false, 313, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who holds the record for winning a Grand Prix with the biggest amount of pit stops?', null, 2, 'en');

INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 314);
INSERT INTO Answer (name, correct, questionId) VALUES ('Alain Prost', false, 314);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 314);
INSERT INTO Answer (name, correct, questionId) VALUES ('Jenson Button', true, 314);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Verstappen overtook Hamilton for the 2021 championship on the last lap. But can you remember in which corner of the Abu Dhabi track was the overtake done?',
        '7vsxuxdpdc5a1.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES ('7', false, 315);
INSERT INTO Answer (name, correct, questionId) VALUES ('9', false, 315);
INSERT INTO Answer (name, correct, questionId) VALUES ('5', true, 315);
INSERT INTO Answer (name, correct, questionId) VALUES ('12', false, 315);

-- Pregunta 156
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'gp-de-belgica-2004-siete-veces-michael-schumacher-2024103232-1720946726_3.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2003', false, 316, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alemania 2004', false, 316, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 2003', false, 316, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bélgica 2004', true, 316, 'es');

-- Pregunta 157
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'images25.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japón 2005', true, 317, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Japón 2006', false, 317, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2004', false, 317, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bélgica 2005', false, 317, 'es');

-- Pregunta 158
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'image26.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2020', false, 318, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2019', false, 318, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Italia 2021', true, 318, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Austria 2021', false, 318, 'es');

-- Pregunta 159
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién ostenta el récord de ganar un Gran Premio con la mayor cantidad de paradas en boxes?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fernando Alonso', false, 319, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alain Prost', false, 319, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Lewis Hamilton', false, 319, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jenson Button', true, 319, 'es');

-- Pregunta 160
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Verstappen adelantó a Hamilton por el campeonato de 2021 en la última vuelta. ¿Recuerdas en qué curva del circuito de Abu Dabi se hizo el adelantamiento?', '7vsxuxdpdc5a1.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('7', false, 320, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('9', false, 320, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5', true, 320, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('12', false, 320, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In 2010, Mclaren put on their car the F-Duct. What was it used for?', '1200px-hamilton_canadian_gp_2010_with_f-duct.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('To generate additional downforce under braking', false, 321, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To manage the cars balance during high-speed corners', false, 321, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To manage the tyres in a better way', false, 321, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To reduce drag on the straigths', true, 321, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Brawn GP used in 2009 a double diffuser on their car. What was it used for?',
        'Brawn-GP-raised-eyebrows-in-2009-with-their-double-diffuser-3921320.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId,language)
VALUES
    ('For increasing the car`s top speed', false, 322, 'en');
INSERT INTO Answer (name, correct, questionId,language) VALUES ('For generating more downforce at the rear of the car', false, 322, 'en');
INSERT INTO Answer (name, correct, questionId,language) VALUES ('For increasing aerodynamic level of the car without increasing drag', true, 322, 'en');
INSERT INTO Answer (name, correct, questionId,language) VALUES ('To improve the car`s hydraulic system', false, 322, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Renault used a sistem called mass damper in their 2006 F1 car. What was it used for?',
        'Screenshot-2021-11-02-at-16.57.04.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('To absorb energy from the suspension during high-frequency vibrations', true, 323, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To adjust the car`s ride height dynamically', false, 323, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To alter the car`s aerodynamic profile during the race', false, 323, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('To store energy generated by the car`s motion', false, 323, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What does understeer refer to in the context of Formula 1 car dynamics?',
        'GS7PpavXoAEFq3Z.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car turns more sharply than intended', false, 324, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The car turns less sharply than intended', true, 324, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The car drifts sideways through corners', false, 324, 'en');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('The car slides forward upon braking', false, 324, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which factor primarily contributes to understeer in a Formula 1 car?',
        null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Low front wing angle', false, 325, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Too hard front suspension', false, 325, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Incorrect camber settings', false, 325, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('All of the above', true, 325, 'en');

-- Pregunta 161
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En 2010, McLaren incorporó el F-Duct en su coche. ¿Para qué se utilizaba?', '1200px-hamilton_canadian_gp_2010_with_f-duct.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para generar mayor carga aerodinámica al frenar', false, 326, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para gestionar el equilibrio del coche en curvas rápidas', false, 326, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para gestionar mejor los neumáticos', false, 326, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para reducir la resistencia aerodinámica en las rectas', true, 326, 'es');

-- Pregunta 162
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Brawn GP utilizó un doble difusor en 2009. ¿Para qué servía?', 'Brawn-GP-raised-eyebrows-in-2009-with-their-double-diffuser-3921320.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para aumentar la velocidad punta del coche', false, 327, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para generar más carga aerodinámica en la parte trasera', false, 327, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para aumentar el nivel aerodinámico sin aumentar la resistencia', true, 327, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para mejorar el sistema hidráulico del coche', false, 327, 'es');

-- Pregunta 163
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Renault utilizó un sistema llamado "mass damper" en su coche de F1 en 2006. ¿Para qué se utilizaba?', 'Screenshot-2021-11-02-at-16.57.04.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para absorber la energía de la suspensión durante vibraciones de alta frecuencia', true, 328, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para ajustar dinámicamente la altura del coche', false, 328, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para modificar el perfil aerodinámico durante la carrera', false, 328, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Para almacenar energía generada por el movimiento del coche', false, 328, 'es');

-- Pregunta 164
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿A qué se refiere el término "subviraje" en la dinámica de un coche de Fórmula 1?', 'GS7PpavXoAEFq3Z.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche gira más de lo deseado', false, 329, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche gira menos de lo deseado', true, 329, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche derrapa de lado en las curvas', false, 329, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche se desliza hacia adelante al frenar', false, 329, 'es');

-- Pregunta 165
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué factor contribuye principalmente al subviraje en un coche de Fórmula 1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ángulo del alerón delantero bajo', false, 330, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suspensión delantera demasiado dura', false, 330, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alineación incorrecta de las ruedas (camber)', false, 330, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', true, 330, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What does oversteer refer to in the context of Formula 1 car dynamics?',
        'images27.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car turns more sharply than intended', true, 331, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car turns less sharply than intended', false, 331, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car drifts sideways through corners', false, 331, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car slides forward upon braking', false, 331, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which factor primarily contributes to oversteer in a Formula 1 car?',
        null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Excessive front wing angle', false, 332, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Too soft front suspension', false, 332, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Incorrect camber settings', false, 332, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('All of the above', true, 332, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name track and year for this moment',
        'F_01_672-458_resize.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Brazil 2013', false, 333, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Brazil 2012', true, 333, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Brazil 2011', false, 333, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('None of them', false, 333, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        'images28.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Johnny Herbert', false, 334, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Martin Brandle', false, 334, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Jos Verstappen', true, 334, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Jean Alesi', false, 334, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        '5780b6e54afc966e5bc5e647401e24f01da31d7243f15.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Esteban Gutierrez', false, 335);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Charles Leclerc', true, 335);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pietro Fittipaldi', false, 335);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Romain Grosjean', false, 335);

-- Pregunta 166
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿A qué se refiere el término "sobreviraje" en la dinámica de un coche de Fórmula 1?', 'images27.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche gira más de lo deseado', true, 336, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche gira menos de lo deseado', false, 336, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche derrapa de lado en las curvas', false, 336, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche se desliza hacia adelante al frenar', false, 336, 'es');

-- Pregunta 167
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué factor contribuye principalmente al sobreviraje en un coche de Fórmula 1?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ángulo del alerón delantero excesivo', false, 337, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Suspensión delantera demasiado blanda', false, 337, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Alineación incorrecta de las ruedas (camber)', false, 337, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', true, 337, 'es');

-- Pregunta 168
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito y el año de este momento', 'F_01_672-458_resize.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2013', false, 338, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2012', true, 338, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Brasil 2011', false, 338, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ninguno de ellos', false, 338, 'es');

-- Pregunta 169
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', 'images28.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Johnny Herbert', false, 339, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Martin Brundle', false, 339, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jos Verstappen', true, 339, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jean Alesi', false, 339, 'es');

-- Pregunta 170
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', '5780b6e54afc966e5bc5e647401e24f01da31d7243f15.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Esteban Gutiérrez', false, 340, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Charles Leclerc', true, 340, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Pietro Fittipaldi', false, 340, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Romain Grosjean', false, 340, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        'h2rqBGj3DSwn-Zim8kbtF59KUcUTvlICdAjUHt8QpOI.jpg', 2, 'en');
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 341);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Salo', false, 341);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', false, 341);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', true, 341);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        'renault-f1-team-renault-r24-villeneuve-7647.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jacques Villeneuve', true, 342);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jarno Trulli', false, 342);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Giancarlo Fisichella', false, 342);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Heikki Kovalainen', false, 342);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many drivers get points at the end of a race?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('9', false, 343);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('10', true, 343);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('11', false, 343);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8', false, 343);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the team principal of Red Bull Racing?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toto Wolff', false, 344);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Zak Brown', false, 344);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mike Krack', false, 344);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Christian Horner', true, 344);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Who is the team principal of Ferrari?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toto Wolff', false, 345);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Zak Brown', false, 345);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Frederic Vasseur', true, 345);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Christian Horner', false, 345);

-- Pregunta 171
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', 'h2rqBGj3DSwn-Zim8kbtF59KUcUTvlICdAjUHt8QpOI.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mika Häkkinen', false, 346, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mika Salo', false, 346, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('David Coulthard', false, 346, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kimi Räikkönen', true, 346, 'es');

-- Pregunta 172
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', 'renault-f1-team-renault-r24-villeneuve-7647.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jacques Villeneuve', true, 347, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jarno Trulli', false, 347, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Giancarlo Fisichella', false, 347, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Heikki Kovalainen', false, 347, 'es');

-- Pregunta 173
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos pilotos reciben puntos al final de una carrera?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('9', false, 348, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('10', true, 348, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('11', false, 348, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8', false, 348, 'es');

-- Pregunta 174
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el jefe de equipo de Red Bull Racing?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toto Wolff', false, 349, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zak Brown', false, 349, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mike Krack', false, 349, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Christian Horner', true, 349, 'es');

-- Pregunta 175
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Quién es el jefe de equipo de Ferrari?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Toto Wolff', false, 350, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Zak Brown', false, 350, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Frédéric Vasseur', true, 350, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Christian Horner', false, 350, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('In which team has Sergio Perez never been at?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 351);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Red Bull', false, 351);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sauber', false, 351);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Williams', true, 351);


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('When did Hamilton take his first win for Mercedes?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Malaysia 2014', false, 352, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('China 2014', false, 352, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Great Britian 2013', false, 352, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Hungary 2013', true, 352, 'en');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many championships does a F1 season have?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', false, 353);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', true, 353);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('4', false, 353);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 353);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many points does a Sprint winner get?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7', false, 354);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('9', false, 354);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8', true, 354);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('6', false, 354);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Before a race it is always said that the parc ferme is closed. What does it mean?',
        null, 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The car that breaks it gets a fine', false, 355, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A period during the race weekend where a car that breaks the rule gets penalized with a drive-through penalty', false, 355, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A period during the race weekend where a car that breaks the rule gets restarted from the back of the grid', false, 355, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A period during the race weekend when teams are restricted in modifying their cars ensuring fairness consistency', true, 355, 'en');

-- Pregunta 176
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿En qué equipo nunca ha corrido Sergio Pérez?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('McLaren', false, 356, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Red Bull', false, 356, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sauber', false, 356, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Williams', true, 356, 'es');

-- Pregunta 177
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuándo consiguió Hamilton su primera victoria con Mercedes?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Malasia 2014', false, 357, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('China 2014', false, 357, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Gran Bretaña 2013', false, 357, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungría 2013', true, 357, 'es');

-- Pregunta 178
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos campeonatos se disputan en una temporada de F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', false, 358, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', true, 358, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('4', false, 358, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5', false, 358, 'es');

-- Pregunta 179
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos puntos obtiene el ganador de una Sprint?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('7', false, 359, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('9', false, 359, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('8', true, 359, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('6', false, 359, 'es');

-- Pregunta 180
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Antes de una carrera siempre se dice que el "parc fermé" está cerrado. ¿Qué significa eso?', null, 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('El coche que lo rompe recibe una multa', false, 360, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Un periodo durante el fin de semana de carrera en el que un coche que rompe las reglas recibe un drive-through', false, 360, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Un periodo durante el fin de semana de carrera en el que un coche que rompe las reglas debe salir desde el final de la parrilla', false, 360, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Un periodo del fin de semana en el que los equipos no pueden modificar los coches, para asegurar igualdad y consistencia', true, 360, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is the Parc Fermé in Formula 1 and why is it used?',
        'the-cars-in-parc-ferme-after-t.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A rule that requires all cars to maintain the same speed throughout the race', false, 361, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A regulation that limits the number of pit stops a team can make during a race', false, 361, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A regulation that allows teams to practice starts at the end of the pit lane', false, 361, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('A regulation that allows an space in the pit lane for the FIA in order to check if every car complies with the regulations', true, 361, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What happens during the Q1 session?',
        'c1c6dad8-aea4-425d-b9a2-c369f73c27b5_16-9-discover-aspect-ratio_default_0.jpg', 3, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The 15 fastest cars go through to the next session', false, 362, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('The last 5 cars get out of the next session', false, 362, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('All of the above', false, 362, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('None of the above', true, 362, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What is a grand chelem?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('When a driver gets win and pole position in the same race', false, 363, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('When a driver gets win and fastest lap in the same race', false, 363, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('When a driver gets win, fastest lap, pole positions and leads every single lap in the same race', true, 363, 'en');


INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('When a driver gets win, fastest lap and leads every single lap in the same race', false, 363, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which driver holds the record for the biggest amount of races until he got his first F1 win?',
        '65c504f09bce1cad3dcbba833d8ee852.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Carlos Sainz', false, 364);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jenson Button', false, 364);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sergio Perez', true, 364);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', false, 364);



INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which is the longest race ever held in F1?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Singapore GP 2012', false, 365, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Singapore GP 2010', false, 365, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Dallas GP 1984', false, 365, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Canada 2011', true, 365, 'en');

-- Pregunta 181
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué es el Parc Fermé en la Fórmula 1 y por qué se utiliza?', 'the-cars-in-parc-ferme-after-t.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Una norma que requiere que todos los coches mantengan la misma velocidad durante la carrera', false, 366, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Una regulación que limita el número de paradas en boxes durante una carrera', false, 366, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Una regulación que permite a los equipos practicar salidas al final del pit lane', false, 366, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Una regulación que habilita un espacio en el pit lane para que la FIA compruebe que todos los coches cumplen con las normativas', true, 366, 'es');

-- Pregunta 182
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué ocurre durante la sesión de clasificación Q1?', 'c1c6dad8-aea4-425d-b9a2-c369f73c27b5_16-9-discover-aspect-ratio_default_0.jpg', 3, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los 15 coches más rápidos pasan a la siguiente sesión', false, 367, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Los últimos 5 coches quedan eliminados de la siguiente sesión', false, 367, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Todas las anteriores', false, 367, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ninguna de las anteriores', true, 367, 'es');

-- Pregunta 183
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué es un "grand chelem"?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cuando un piloto gana y logra la pole en la misma carrera', false, 368, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cuando un piloto gana y logra la vuelta rápida en la misma carrera', false, 368, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cuando un piloto gana, hace la vuelta rápida, consigue la pole y lidera todas las vueltas de la carrera', true, 368, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Cuando un piloto gana, hace la vuelta rápida y lidera toda la carrera', false, 368, 'es');

-- Pregunta 184
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué piloto tiene el récord del mayor número de carreras antes de conseguir su primera victoria en F1?', '65c504f09bce1cad3dcbba833d8ee852.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Carlos Sainz', false, 369, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jenson Button', false, 369, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sergio Pérez', true, 369, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Damon Hill', false, 369, 'es');

-- Pregunta 185
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la carrera más larga de la historia de la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Singapur 2012', false, 370, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Singapur 2010', false, 370, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('GP de Dallas 1984', false, 370, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Canadá 2011', true, 370, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many laps does the Monaco GP have?',
        '15274979049260.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('71', false, 371);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('80', false, 371);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('78', true, 371);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('72', false, 371);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('At the 2024 Monaco GP we had 0 overtakes during the race. When was the other time that this happened?',
        'XPB_1282060_HiRes.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Valencia 2009', true, 372, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Dallas 1984', false, 372, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Monaco 2021', false, 372, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Las Vegas 1982', false, 372, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Which race is the shortest one in F1 history?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Australia 1991', false, 373, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Belgium 2021', true, 373, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('South Africa 1979', false, 373, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('France 1972', false, 373, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track',
        '00000224_018-753x494.jpg', 2, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Buenos Aires', false, 374, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Hungaroring', false, 374, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Magny Cours', true, 374, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Fuji', false, 374, 'en');

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track',
        'Captura de pantalla 2024-08-18 123450.png', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hockenheim', false, 375);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungaroring', false, 375);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Interlagos', false, 375);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', true, 375);

-- Pregunta 186
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas vueltas tiene el GP de Mónaco?', '15274979049260.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('71', false, 376, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('80', false, 376, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('78', true, 376, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('72', false, 376, 'es');

-- Pregunta 187
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('En el GP de Mónaco 2024 no hubo adelantamientos durante la carrera. ¿Cuándo fue la otra vez que esto ocurrió?', 'XPB_1282060_HiRes.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Valencia 2009', true, 377, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Dallas 1984', false, 377, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mónaco 2021', false, 377, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Las Vegas 1982', false, 377, 'es');

-- Pregunta 188
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuál es la carrera más corta de la historia de la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Australia 1991', false, 378, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Bélgica 2021', true, 378, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Sudáfrica 1979', false, 378, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Francia 1972', false, 378, 'es');

-- Pregunta 189
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', '00000224_018-753x494.jpg', 2, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Buenos Aires', false, 379, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungaroring', false, 379, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Magny-Cours', true, 379, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Fuji', false, 379, 'es');

-- Pregunta 190
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', 'Captura de pantalla 2024-08-18 123450.png', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hockenheim', false, 380, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungaroring', false, 380, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Interlagos', false, 380, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', true, 380, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track',
        'british-mclaren-formula-one-racing-team-driver-lewis-news-photo-1650209247.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hockenheim', false, 381);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungaroring', false, 381);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Interlagos', true, 381);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', false, 381);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the track',
        'salida-gp-espana-jerez-1997.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jarama', false, 382);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jerez', true, 382);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kyalami', false, 382);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Buenos Aires', false, 382);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many qualifying sessions does F1 have?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', false, 383);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 383);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3', true, 383);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('4', false, 383);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        '1997hidarr03.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', true, 384);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nigel Mansell', false, 384);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', false, 384);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 384);

INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Name the driver',
        'a637c951f5abb3d146fc1931d48735df.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', false, 385);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jacques Villeneuve', false, 385);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', true, 385);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 385);


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many points does a driver get for the fastest lap of a race?',
        null, 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', false, 386);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('0', true, 386);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 386);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 386);

-- Pregunta 191
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', 'british-mclaren-formula-one-racing-team-driver-lewis-news-photo-1650209247.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hockenheim', false, 387, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Hungaroring', false, 387, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Interlagos', true, 387, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Silverstone', false, 387, 'es');

-- Pregunta 192
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra el circuito', 'salida-gp-espana-jerez-1997.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jarama', false, 388, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Jerez', true, 388, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Kyalami', false, 388, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Buenos Aires', false, 388, 'es');

-- Pregunta 193
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántas sesiones de clasificación tiene la F1?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', false, 389, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 389, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', true, 389, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('4', false, 389, 'es');

-- Pregunta 194
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('Nombra al piloto', '1997hidarr03.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('Damon Hill', true, 390, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Nigel Mansell', false, 390, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('David Coulthard', false, 390, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Mika Hakkinen', false, 390, 'es');

-- Pregunta 195
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos puntos obtiene un piloto por la vuelta rápida de una carrera?', null, 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('1', false, 391, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('0', true, 391, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 391, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5', false, 391, 'es');


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('How many different compounds are in F1?',
        'images29.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3', false, 392);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 392);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 392);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('6', true, 392);


INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('What does the pole position give?',
        'F1-poleposition-Max-Verstappen-Red-Bull-Racing-parc-ferme-Bahrain-Grand-Prix-2023.jpg', 1, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Fastest time', false, 393, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('First place for the start of the race', false, 393, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('Fastest time and first place for the start of the race', true, 393, 'en');

INSERT INTO Answer (name, correct, questionId, language)
VALUES
    ('None of the above', false, 393, 'en');

-- Pregunta 196
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Cuántos compuestos diferentes hay en la F1?', 'images29.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('3', false, 394, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('2', false, 394, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('5', false, 394, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('6', true, 394, 'es');

-- Pregunta 197
INSERT INTO Question (name, imagePath, knowledgequestionlevel, language)
VALUES ('¿Qué otorga la pole position?', 'F1-poleposition-Max-Verstappen-Red-Bull-Racing-parc-ferme-Bahrain-Grand-Prix-2023.jpg', 1, 'es');

INSERT INTO Answer (name, correct, questionId, language) VALUES ('El tiempo más rápido', false, 395, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Primera posición en la parrilla de salida', false, 395, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('El tiempo más rápido y la primera posición para la salida de la carrera', true, 395, 'es');
INSERT INTO Answer (name, correct, questionId, language) VALUES ('Ninguna de las anteriores', false, 395, 'es');



UPDATE Question SET quizCategoryId = 20 WHERE id IN (
 1, 5, 6, 7, 11, 12, 43, 53,160,165,180,185,187,188,189,190,191,192,193,194,195,196,197,198,200,201,203,204,206,207,215,
   216, 223, 224, 230, 239, 233, 242, 243, 250, 244, 251, 274, 293,294, 298, 299, 302, 307, 303, 308,
       304, 309, 305, 310, 311, 316, 312, 313, 317, 318, 333, 334,335,338, 339, 340, 341, 342, 346,347,
       374, 375, 376, 377, 378,379, 380, 381, 382, 384, 385, 387, 388, 390);


UPDATE Question SET quizCategoryId = 18 WHERE id IN (
66, 68, 78,80, 105, 107, 109, 110, 111, 112, 118,128,130,131,132,135,217,321, 326, 322, 327, 323, 328, 324, 329, 325,
330, 331, 336, 332, 337);


UPDATE Question SET quizCategoryId = 9 WHERE id IN (46, 56, 69,
73, 74, 121,122,123,144,145,146,147,148,149,150,152,153,154,155,232, 241, 276, 283, 277, 284, 278, 285, 279, 286, 287,
288, 289, 290, 315,355, 360, 361, 366, 362, 367,383, 389);

UPDATE Question SET quizCategoryId = 10 WHERE id IN (
133,134,151,156,157,158,159,162,163,164,170,175,202,208,209);


UPDATE Question SET quizCategoryId = 6 WHERE id IN (
320);

UPDATE Question SET quizCategoryId = 19 WHERE id IN (
319);

UPDATE Question SET quizCategoryId = 12 WHERE id IN(
72, 84, 92, 100,199,205);



UPDATE Question SET quizCategoryId = 7 WHERE id IN (61, 62, 63,
81, 90, 91, 98, 99, 101, 102,124,125,210,211,212,218,219,220,225);

-- GenericStats
UPDATE Question SET quizCategoryId = 8 WHERE id IN (15, 17, 18, 19, 23, 29, 31, 32, 33, 37, 47, 49, 50, 57, 59, 60,
89, 97, 120,140,141,143, 229, 237, 238, 236, 235, 256, 249, 257, 265, 261, 269, 262, 270, 263, 271,275, 282, 314,
371, 372, 373, 364, 369, 365, 370, 354, 359, 343, 348, 391, 386, 392, 394, 393, 395);

-- Driver
UPDATE Question SET quizCategoryId = 3 WHERE id IN (
 2, 8, 13, 14, 26, 27, 28, 40, 41, 48, 51, 58, 65, 70, 77,82, 85, 87, 93, 95, 113, 116, 136,139,161,166,167,168,
 169,171,172,173,174,176,177,178,179,181,182,183,184,186,213,214,221,222,226,227,228,
 258, 266, 267, 260, 268, 281, 291, 296, 292, 297, 301, 306, 351,
 352,356, 357, 344, 349, 345, 350);
-- Technical
UPDATE Question SET quizCategoryId = 10 WHERE id IN (20, 21, 34, 35, 42, 52);

-- Qualifying
UPDATE Question SET quizCategoryId = 14 WHERE id IN (
67, 79);

-- Scores
UPDATE Question SET quizCategoryId = 1 WHERE id IN (
88, 96, 119,142);

-- Team
UPDATE Question SET quizCategoryId = 4 WHERE id IN (
3, 4, 9, 10,16, 22, 24, 25, 30, 36, 38, 39, 44, 54, 64, 71, 75, 76,
83, 86, 94, 103, 104, 106, 114, 115, 117,126,127,129,137,138,186,231, 240, 245, 252, 246, 253, 247, 254, 248, 255,
264, 272, 273, 280, 295, 300);

-- LegendarySeason
UPDATE Question SET quizCategoryId = 5 WHERE id IN (45, 55,259,363, 368);















-------------------------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------
INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Bahrein',5412,57,'Ferrari', 'Bahrain_Circuit.jpg',2);


INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Saudi Arabia',6200,50,'Red Bull', 'jeddah.jpg',2);


INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Australia',5300,58,'Ferrari', 'Australia_Circuit.jpg',2);

INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Japan',5807,53,'Red Bull','Suzuka.jpg',2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('China', 5451, 56, 'Mercedes', 'China_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Miami', 5400, 57, 'Red Bull', 'Miami.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Emilia Romagna', 4909, 63, 'Ferrari', 'Imola.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Monaco', 3400, 78, 'Mclaren', 'Monoco_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Spain', 4657, 66, 'Ferrari', 'Spain_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Canada', 4361, 70, 'Ferrari', 'Canada_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Austria', 4318, 71, 'Red Bull', 'Austria_Circuit.jpg', 2);


INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Great Britain', 5891, 52, 'Ferrari', 'Great_Britain_Circuit.jpg', 2);


INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Hungary', 4381, 70, 'Mclaren', 'Hungary_Circuit.jpg', 2);


INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Belgium', 7004, 44, 'Ferrari', 'Belgium_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Netherlands', 4259, 72, 'Ferrari', 'Netherlands_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Italy', 5793, 53, 'Ferrari', 'Italy_Circuit.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Azerbaijan', 6003, 51, 'Red Bull', 'Baku_Circuit.jpg', 2);

-- Insertando circuito de Singapur
INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Singapore', 4940, 61, 'Ferrari', 'Singapore_Circuit.jpg', 2);


-- Insertando circuito de Estados Unidos
INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('United States', 5513, 56, 'Mercedes', 'USA_Circuit.jpg', 2);

-- Insertando circuito de México
INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Mexico', 4304, 71, 'Red Bull', 'Mexico_Circuit.jpg', 2);

-- Insertando circuito de Brasil
INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Brazil', 4309, 71, 'Ferrari', 'Brasil.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Las Vegas', 6201, 50, 'Red Bull', 'Vegas.jpg', 2);

INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Qatar', 5419, 57, 'Red Bull', 'Qatar.jpg', 2);

-- Insertando circuito de Abu Dhabi
INSERT INTO Circuit(name, distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Abu Dhabi', 5281, 55, 'Red Bull', 'Abu_Dhabi_Circuit.jpg', 2);


INSERT INTO Podium(winner,date, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','Red Bull','Perez','Sainz','17093981925136.jpg',1);

INSERT INTO Podium(winner,date, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','Red Bull','Perez','Alonso','images.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Charles Leclerc', '2022','Ferrari','Sainz','Hamilton','OMNI2NNSDZCYZMCPMHXLPCOQNE.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2021','Mercedes','Verstappen','Bottas','16172011568663.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton','2020','Mercedes','Verstappen','Albon','lewis-hamilton-2151739.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2019','Mercedes','Bottas','Leclerc','hamilton-bahrein-2019.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2018','Ferrari','Bottas','Hamilton','victoria-vettel-gp-bahrein.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2017','Ferrari','Hamilton','Bottas','14923709613710.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Raikkonen','Hamilton','images2.jpg',1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2015','Mercedes','Raikkonen','Rosberg','5fa278007fde0.jpg' , 1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','Red Bull','Sergio Perez','Charles Leclerc', 'img2.rtve.jpg', 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sergio Perez', '2023','Red Bull','Max Verstappen','Fernando Alonso', 'GettyImages-1474638493.jpg', 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2022','Red Bull','Charles Leclerc','Carlos Sainz', 'unnamed.jpg', 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2021','Mercedes','Max Verstappen','Valtteri Bottas', '16387363862558.jpg', 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Carlos Sainz', '2024','Ferrari','Charles Leclerc','Lando Norris', 'nba-plain--47dab8bf-3ef4-4eb9-8f9c-eda2990f5252.png', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','Red Bull','Lewis Hamilton','Fernando Alonso', 'F1-AUSTRALIA_93806.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Charles Leclerc', '2022','Ferrari','George Russell','Lewis Hamilton', '625135306ceeb.r_d.1724-1149-3479.jpeg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Valtteri Bottas', '2019','Mercedes','Lewis Hamilton','Max Verstappen', '34913-n3.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2018','Ferrari','Lewis Hamilton','Kimi Raikkonen', '15219625763704.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2017','Ferrari','Lewis Hamilton','Valtteri Bottas', 'f1-australian-gp-2017-race-winner-sebastian-vettel-ferrari-sf70h.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Lewis Hamilton','Sebastian Vettel', 'f1-gp-australia-2016-rosberg-gana-primera_1.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2015','Mercedes','Nico Rosberg','Sebastian Vettel', 'f1-australian-gp-2015-lewis-hamilton-mercedes-amg-f1-w06.jpg', 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','Red Bull','Sergio Perez','Carlos Sainz', '796930333_236274274_1706x640.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','Red Bull','Lando Norris','Oscar Piastri', 'images4.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2022','Red Bull','Sergio Perez','Charles Leclerc', 'max-verstappen-red-bull-racing.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Valtteri Bottas', '2019','Mercedes','Sebastian Vettel','Lewis Hamilton', 'images5.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2018','Mercedes','Valtteri Bottas','Max Verstappen', 'hamilton_suzuka2018-1.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2017','Mercedes','Max Verstappen','Daniel Ricciardo', 'f1-japanese-gp-2017-lewis-hamilton-mercedes-benz-f1-w08-takes-the-chequered-flag-at-the-en-5817568.jpg', 4);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Max Verstappen','Lewis Hamilton', 'formula-1-gp-japon-2016-rosberg-domina-suzuka_1.jpg', 4);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2024', 'Red Bull', 'Lando Norris', 'Sergio Perez', '6624d1c194742.jpeg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes', 'Valtteri Bottas', 'Sebastian Vettel', 'lewis_hamilton_2019_china.jpg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Daniel Ricciardo', '2018', 'Ferrari', 'Valtteri Bottas', 'Kimi Raikkonen', 'sebastian_vettel_2018_china.jpg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Red Bull', 'Sebastian Vettel', 'Max Verstappen', 'daniel_ricciardo_2017_china.jpg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2016', 'Mercedes', 'Sebastian Vettel', 'Daniil Kvyat', 'nico_rosberg_2016_china.jpg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2015', 'Mercedes', 'Nico Rosberg', 'Sebastian Vettel', 'lewis_hamilton_2015_china.jpg', 5);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lando Norris', '2024', 'Mclaren', 'Max Verstappen', 'Charles Leclerc', 'lando-norris-llevo-gp-miami.jpg', 6);


INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull', 'Sergio Perez', 'Fernando Alonso', 'images6.jpg', 6);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull', 'Charles Leclerc', 'Carlos Sainz', 'images7.jpg', 6);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull', 'Charles Leclerc', 'Carlos Sainz', 'images7.jpg', 6);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2024', 'Red Bull', 'Lando Norris', 'Charles Leclerc', '69.jpg', 7);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull', 'Sergio Perez', 'Lando Norris', 'verstappen-arrasa-imola-2683245.jpg', 7);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull', 'Lewis Hamilton', 'Lando Norris', '16187597716549.jpg', 7);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2020', 'Mercedes', 'Valtteri Bottas', 'Daniel Ricciardo', 'lewis-hamilton-se-proclama-ganador-del-gp-de-f1-de-imola.jpeg', 7);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Charles Leclerc', '2024', 'Ferrari', 'Oscar Piastri', 'Carlos Sainz', 'leclerc-monaco-2024-winner.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull', 'Fernando Alonso', 'Esteban Ocon', '64736b8706cd0.r_d.966-1712-3866.jpeg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sergio Perez', '2022', 'Red Bull', 'Carlos Sainz', 'Max Verstappen', '62939be656a96.jpeg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull', 'Carlos Sainz', 'Lando Norris', '16217812688788.png', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes', 'Sebastian Vettel', 'Valtteri Bottas', '15588754308513.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Daniel Ricciardo', '2018', 'Red Bull', 'Sebastian Vettel', 'Lewis Hamilton', 'daniel-ricciardo-gp-monaco-2018.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2017', 'Ferrari', 'Kimi Raikkonen', 'Daniel Ricciardo', 'images8.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes', 'Daniel Ricciardo', 'Sergio Perez', 'f1-2016-monaco-mercedes-hamilton-victoria.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2015', 'Mercedes', 'Sebastian Vettel', 'Lewis Hamilton', 'f1-2015-monaco-rosberg-mercedes-victoria.jpg', 8);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2024', 'Red Bull', 'Lando Norris', 'Lewis Hamilton', 'img24.rtve.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull', 'Lewis Hamilton', 'George Russell', '647ca0b69f16b.jpeg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull', 'Sergio Perez', 'George Russell', 'f1_416x234.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2021', 'Mercedes', 'Max Verstappen', 'Valtteri Bottas', '60e74b03277a9.jpeg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2020', 'Mercedes', 'Max Verstappen', 'Valtteri Bottas', 'YCMLNJ6XANIX7LA37KV2EIAGO4.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes', 'Valtteri Bottas', 'Max Verstappen', 'salida-gp-espana-2019.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes', 'Valtteri Bottas', 'Max Verstappen', '15262228901480.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes', 'Sebastian Vettel', 'Daniel Ricciardo', '60e728fca1f4e.jpeg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2016', 'Red Bull', 'Kimi Raikkonen', 'Sebastian Vettel', '14633209454616.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2015', 'Mercedes', 'Lewis Hamilton', 'Sebastian Vettel', '001_small.jpg', 9);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2024', 'Red Bull', 'Lando Norris', 'George Russell', 'gp-can-3-123924-1024x576.jpg', 10);


INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull', 'Fernando Alonso', 'Lewis Hamilton', 'f1-gp-canada-domenica-935.jpg', 10);


INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull', 'Carlos Sainz', 'Lewis Hamilton', '62af7d33eeaa0.r_d.2438-1665-921.jpeg', 10);


INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes', 'Sebastian Vettel', 'Charles Leclerc', 'FTVT32DOQYG6QN4CW3O2F3E4SI.jpg', 10);


INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2018', 'Ferrari', 'Valtteri Bottas', 'Max Verstappen', 'sebastian-vettel-clasificacion-canada.jpg', 10);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes', 'Valtteri Bottas', 'Daniel Ricciardo', 'hamilton-canada-clasificacion-f1-soymotor.jpg', 10);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes', 'Sebastian Vettel', 'Valtteri Bottas', '5fa2d1d4120ce.jpeg', 10);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2015', 'Mercedes', 'Nico Rosberg', 'Valtteri Bottas', '5fa2d1d4120ce.jpeg', 10);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('George Russell', '2024', 'Mercedes', 'Oscar Piastri', 'Carlos Sainz', '6c04bc52-3294-483d-add4-1f122587718a_1200x680.jpeg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull', 'Charles Leclerc', 'Sergio Perez', '64a18ce92e026.jpeg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Charles Leclerc', '2022', 'Ferrari', 'Max Verstappen', 'Lewis Hamilton', 'NAZ_e655bfc3b5d54a7e8166699123156887.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull', 'Valtteri Bottas', 'Lando Norris', '60e7539c0742c.jpeg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Valtteri Bottas', '2020', 'Mercedes', 'Charles Leclerc', 'Lando Norris', 'PGXYNMP4P5KDVFJVRTCZVF7ZFU.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2019', 'Red Bull', 'Charles Leclerc', 'Valtteri Bottas', 'max-verstappen-gran-premio-austria-2019.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2018', 'Red Bull','Kimi Raikkonen','Sebastian Vettel', 'max_verstappen-red_bull-carrera-gp-austria-2018.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Valtteri Bottas', '2017', 'Mercedes','Sebastian Vettel','Daniel Ricciardo', 'valtteri-bottas-hace-pole-austria.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Max Verstappen','Kimi Raikkonen', '14675636874942_990x0.jpg', 11);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2024', 'Mercedes','Max Verstappen','Lando Norris', 'GettyImages-2161010295.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lando Norris','Lewis Hamilton', '64aad147d8e9a.r_d.1859-2256-0.jpeg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Carlos Sainz', '2022', 'Ferrari','Sergio Perez','Lewis Hamilton', '62c1d08761fb9.jpeg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2021', 'Mercedes','Charles Leclerc','Valtteri Bottas', 'lewis-hamilton-mercedes-w12-1s.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2020', 'Mercedes','Max Verstappen','Charles Leclerc', '60e762a36aac6.jpeg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes','Valtteri Bottas','Charles Leclerc', '15631081847013.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2018', 'Ferrari','Lewis Hamilton','Kimi Raikkonen', 'DMRQ67NFY5RATQY4MIMXDDGGP4.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes','Valtteri Bottas','Kimi Raikkonen', 'ZMC3LQB4LFOQRJLIK3CRQXOLK4.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Max Verstappen','Nico Rosberg', '14681648212906_990x0.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2015', 'Mercedes','Nico Rosberg','Sebastian Vettel', 'images9.jpg', 12);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Oscar Piastri', '2024', 'Mclaren','Lando Norris','Lewis Hamilton', 'img4.rtve.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lando Norris','Sergio Perez', 'nba-plain--4a55a06a-cb26-4d67-83e3-3ff57cdbaea9.png', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Lewis Hamilton','George Russell', 'sporting-news-2022-photo-with-watermark-3ec90880-af89-417d-9ef3-3c333c5455ba.png', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Esteban Ocon', '2021', 'Alpine','Lewis Hamilton','Carlos Sainz', 'formula-1-hungarian-gp-2021-es-2.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2020', 'Mercedes','Max Verstappen','Valtteri Bottas', 'MN2SHZQEIZPGBCCQ55TE2YTT3U.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes','Max Verstappen','Sebastian Vettel', '2CNYO6I33RL3RIAXV6Y7D4P7HA.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Sebastian Vettel','Kimi Raikkonen', 'gp-hungria-f1-2018.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2017', 'Ferrari','Kimi Raikkonen','Valtteri Bottas', '15014222489730.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Nico Rosberg','Daniel Ricciardo', 'f1-gp-hungria-2016-hamilton-domina-mano-hierro_1.jpg', 13);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2024', 'Mercedes','Oscar Piastri','Charles Leclerc', 'NAZ_02017646930e4c1994e9106f0433428b.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Sergio Perez','Charles Leclerc', '16907270397230.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Sergio Perez','Carlos Sainz', '16616979678448.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull','George Russell','Lewis Hamilton', 'NAZ_36e2b7e062224ee38ad0cf42ffd97323.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2020', 'Mercedes','Valtteri Bottas','Max Verstappen', 'C3M2TCWVCRIETMLZT6IIZEZUMY.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Charles Leclerc', '2019', 'Ferrari','Lewis Hamilton','Valtteri Bottas', '15673364402578.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2018', 'Ferrari','Lewis Hamilton','Max Verstappen', '15352940634208.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes','Sebastian Vettel','Daniel Ricciardo', 'belgica-hamilton-vettel-2017-f1-soymotor.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2016', 'Mercedes','Daniel Ricciardo','Lewis Hamilton', 'X2ANIYID3BOXNFKVUZ6N7COUX4.jpg', 14);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Fernando Alonso','Pierre Gasly', 'GettyImages-1628172829.jpg', 15);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','George Russell','Charles Leclerc', 'images10.jpg', 15);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull','Lewis Hamilton','Valtteri Bottas', '6134d694ae4aa.r_d.963-634-6250.jpeg', 15);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Sergio Perez','Carlos Sainz', '64f49c3e81e86.r_d.3066-2034-3043.jpeg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Charles Leclerc','George Russell', '631dee4441565.jpeg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Daniel Ricciardo', '2021', 'Mclaren','Lando Norris','Valtteri Bottas', 'CRÃ“NICA-GP-DE-ITALIA-F1-2021.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Pierre Gasly', '2020', 'AlphaTauri','Carlos Sainz','Lance Stroll', 'gasly-monza-sabado-2020-soymotor.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Charles Leclerc', '2019', 'Ferrari','Valtteri Bottas','Lewis Hamilton', 'leclerc_thumb_425.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Kimi Raikkonen','Valtteri Bottas', 'formula-1-italian-gp-2018-race-2.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes','Valtteri Bottas','Sebastian Vettel', '15041688972205.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2016', 'Mercedes','Lewis Hamilton','Sebastian Vettel', 'mercedes-ferrari-italia-laf1.jpg', 16);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sergio Perez', '2023', 'Red Bull','Max Verstappen','Charles Leclerc', '644e62898c269.r_d.2685-1059-4000.jpeg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Sergio Perez','George Russell', 'images11.jpg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sergio Perez', '2021', 'Red Bull','Sebastian Vettel','Pierre Gasly', 'el-equipo-da-la-bienvenida-a-checo-al-otro-lado-de-la-bandera-de-cuadros.jpg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Valtteri Bottas', '2019', 'Mercedes','Lewis Hamilton','Sebastian Vettel', 'doblete-mercedes-baku.jpg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Kimi Raikkonen','Sergio Perez', '15250354089549.jpg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Daniel Ricciardo', '2017', 'Red Bull','Valtteri Bottas','Lance Stroll', 'daniel-ricciardo-red-bull-racing-azerbaiyÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n-f1-gran-premio-ganador.jpg', 17);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Carlos Sainz', '2023', 'Ferrari','Lando Norris','Lewis Hamilton', '3785978-77009488-2560-1440.jpg', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sergio Perez', '2022', 'Red Bull','Charles Leclerc','Carlos Sainz', 'nba-plain--a0d7b593-5a55-4812-b931-8545a64db065.png', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2019', 'Ferrari','Charles Leclerc','Max Verstappen', 'ferari.jpg', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Max Verstappen','Sebastian Vettel', '60e7c34f2c9e5.jpeg', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes','Daniel Ricciardo','Valtteri Bottas', 'victoria-lewis-hamilton-gp-singapur.jpg', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Nico Rosberg', '2016', 'Mercedes','Daniel Ricciardo','Lewis Hamilton', 'FSJ6ZKWFGZNQ7OZ2DPTG6RZJJM.jpg', 18);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lando Norris','Carlos Sainz', '653452d633f8e.r_d.3831-2554-586.jpeg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Lewis Hamilton','Charles Leclerc', 'ricciardo2017.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull','Lewis Hamilton','Sergio Perez', '3242112-66359508-2560-1440.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Valtteri Bottas', '2019', 'Mercedes','Lewis Hamilton','Max Verstappen', 'bottas-pole-eeuu.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Kimi Raikkonen', '2018', 'Ferrari','Max Verstappen','Lewis Hamilton', 'formula-1-united-states-gp-201-2.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2017', 'Mercedes','Sebastian Vettel','Kimi Raikkonen', 'lewis-hamilton-gana-austin.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Nico Rosberg','Daniel Ricciardo', '472XS5KCRRP4LNSSI5RL7FSDLQ.jpg', 19);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lewis Hamilton','Charles Leclerc', '653ed76848b50.r_d.4059-3018-823.jpeg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Lewis Hamilton','Sergio Perez', 'formula-1-mexico-city-gp-2022--2.jpg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull','Lewis Hamilton','Sergio Perez', '61883968f22bb.r_d.1767-1015-0.jpeg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes','Sebastian Vettel','Valtteri Bottas', 'gran-premio-de-mexico-f1-01-viernes-1572107970.jpg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2018', 'Red Bull','Sebastian Vettel','Kimi Raikkonen', 'images14.jpg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2017', 'Red Bull','Valtteri Bottas','Kimi Raikkonen', 'verstappen-red-bull-2017.jpg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Nico Rosberg','Daniel Ricciardo', 'WMMAJSFNRNNNLB263KN6C725KQ.jpg', 20);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lando Norris','Fernando Alonso', '6547e6216ba11.r_d.2680-2785-629.jpeg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('George Russell', '2022', 'Mercedes','Lewis Hamilton','Carlos Sainz', '6371467b63d71.r_d.3862-3443-1727.jpeg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2021', 'Mercedes','Max Verstappen','Valtteri Bottas', '61915711c5e7a.r_d.2479-2514-878.jpeg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2019', 'Red Bull','Pierre Gasly','Carlos Sainz', '15739239356031.jpg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Max Verstappen','Kimi Raikkonen', '15419540602472.jpg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Sebastian Vettel', '2017', 'Ferrari','Valtteri Bottas','Kimi Raikkonen', '32176-n3.jpg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Nico Rosberg','Max Verstappen', 'minuto_a_minuto_directo_carrera_brasil_f1_soymotor.jpg', 21);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Charles Leclerc','Sergio Perez', 'NAZ_976d02c9851e4cb383fc66fcf23d0714.jpg', 22);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Lando Norris','Oscar Piastri', '65204d929ab84.jpeg', 23);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2021', 'Mercedes','Max Verstappen','Fernando Alonso', 'LJYUJXPNYFLO5LCK3POR3HZTBY.jpg', 23);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2023', 'Red Bull','Charles Leclerc','George Russell', 'f5111bb8-6f9f-4a31-bb82-e581ff01fb6d_alta-libre-aspect-ratio_default_0.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2022', 'Red Bull','Charles Leclerc','Sergio Perez', 'pole-verstappen-abu-dhabi-2876011.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2021', 'Red Bull','Lewis Hamilton','Carlos Sainz', 'max-verstappen-of-the-netherlands-driving-the-red-bull-news-photo-1639586571.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Max Verstappen', '2020', 'Red Bull','Valtteri Bottas','Lewis Hamilton', '3SGEZYWNVBNIJH2BK722SZUODE.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2019', 'Mercedes','Max Verstappen','Charles Leclerc', 'images16.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2018', 'Mercedes','Sebastian Vettel','Max Verstappen', '01_Lewis-Hamilton_GP-Abu-Dhabi-2018-670x445.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Valtteri Bottas', '2017', 'Mercedes','Lewis Hamilton','Sebastian Vettel', '1-bottas-1-f1-abu-dhabi-2017.jpg', 24);

INSERT INTO Podium(winner, date, teamWinner, secondPlace, thirdPlace, image, circuitId)
VALUES('Lewis Hamilton', '2016', 'Mercedes','Nico Rosberg','Sebastian Vettel', 'nico_rosberg_mercedes_domingo_gp_abu_dhabi-2016.jpg', 24);


INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Chinese GP', '2nd round of the F1 season', '2025-03-23', 'Shanghai', 'GmPSckjbsAApnT1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Japanese GP', '3rd round of the F1 season', '2025-04-06', 'Suzuka', 'fposter,small,wall_texture,square_product,600x600.u3.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Bahrein GP', '4th round of the F1 season', '2025-04-13', 'Sakhir', 'formula-1-bahrain-grand-prix-2024-poster_ss5_p-201348077+u-v48ciqjppqwtzj3bi0bp+v-le3rrz5cbcwquxbrgx2q.jpg');


INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Saudi Arabian GP', '5th round of the F1 season', '2025-04-20', 'Jeddah', '1+Alpine+Saudi+Arabian+GP+1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Miami GP', '6th round of the F1 season', '2025-05-04', 'Miami', 'formula-1-miami-grand-prix-2023-limited-edition-poster_ss4_p-14416990+u-4demn26qp2aevlwzp8uc+v-1324295d5d6647a798c7bf368eee2af6.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Imola GP', '7th round of the F1 season', '2025-05-18', 'Imola', 'poster-gp-emilia-romagna-a4-a3-a2-posters-base-best-print-shop-1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Monaco GP', '8th round of the F1 season', '2025-05-25', 'Monaco', 'images30.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Spanish GP', '9th round of the F1 season', '2025-06-01', 'Barcelona', 'E0sxVjJWQAI783K.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Canadian GP', '10th round of the F1 season', '2025-06-15', 'Montreal', 'images31.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Austrian GP', '11th round of the F1 season', '2025-06-29', 'Styria', 'images32.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('British GP', '12th round of the F1 season', '2025-07-06', 'Silverstone', '3wkkh475qaad1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Belgian GP', '13th round of the F1 season', '2025-07-27', 'Belgium', '517c567d8d6e9f561c4eb73313a8d280.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Hungarian GP', '14th round of the F1 season', '2025-08-03', 'Hungary', 'FYrYQ9SXoAAR-v6-732x1024.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Dutch GP', '15th round of the F1 season', '2025-08-31', 'Netherlands', 'f768x1-8742_8869_154.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Italian GP', '16th round of the F1 season', '2025-09-07', 'Italy', '6744ae08e6a450e031b21a17e78fc0fa.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Azerbaijan GP', '17th round of the F1 season', '2025-09-21', 'Azerbaijan', 'ahav61hj4goa1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Singapore GP', '18th round of the F1 season', '2025-10-05', 'Singapore', 'singapore-f1-grand-prix-2022-race-poster-2K2RF46.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('USA GP', '19th round of the F1 season', '2025-10-19', 'Texas', 'flat,750x,075,f-pad,750x1000,f8f8f8.u3.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Mexican GP', '20th round of the F1 season', '2025-10-26','Mexico City' ,'0_vae50gfk.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Brazilian GP', '21th round of the F1 season', '2025-11-09', 'Brazil','3db56091204561.5e2b4deb5987d.png');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Las Vegas GP', '22th round of the F1 season', '2025-11-22', 'Las Vegas','il_570xN.5522041097_7lyw.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Qatar GP', '23th round of the F1 season', '2025-11-30', 'Qatar','the-official-poster-for-the-formula-1-qatar-airways-qatar-v0-j0jvcw0rumqb1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Abu Dhabi GP', '24th round of the F1 season', '2024-12-07', 'Abu Dhabi','abu-dhabi-f1-grand-prix-2023-race-poster-2T5R5KF.jpg');

