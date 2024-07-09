DROP TABLE IF EXISTS UserAward;
DROP TABLE IF EXISTS Award;
DROP TABLE IF EXISTS UserAnswer;
DROP TABLE IF EXISTS Answer;
DROP TABLE IF EXISTS QuizQuestions;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Quiz;
DROP TABLE IF EXISTS Assessment;
DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS UserNotification;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Event;
DROP TABLE IF EXISTS Post;
DROP TABLE IF EXISTS Podium;
DROP TABLE IF EXISTS Circuit;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Users;



-- Crear las tablas con las restricciones de clave foránea adecuadas
CREATE TABLE Users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(60) NOT NULL,
    firstName VARCHAR(60) NOT NULL,
    lastName VARCHAR(60),
    password VARCHAR(60) NOT NULL,
    email VARCHAR(60) NOT NULL,
    journalist BOOLEAN DEFAULT FALSE,
    image BLOB,
    points BIGINT
);




CREATE TABLE Category (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    historic BOOLEAN DEFAULT FALSE,
    quiz BOOLEAN DEFAULT FALSE,

    CONSTRAINT NameIsUniqueKey UNIQUE (name)
);

CREATE TABLE Post(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title LONGTEXT NOT NULL,
    subtitle LONGTEXT NOT NULL,
    image varbinary(max),
    article LONGTEXT NOT NULL,
    creationDate DATETIME,
    userId BIGINT NOT NULL,
    categoryId BIGINT NOT NULL,

    CONSTRAINT UserIdFK FOREIGN KEY (userId) REFERENCES Users (id),
    CONSTRAINT CategoryIdFK FOREIGN KEY (categoryId) REFERENCES Category (id)
);

CREATE TABLE Comment(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    content LONGTEXT NOT NULL,
    userId BIGINT NOT NULL,
    parent_comment BIGINT,
    postId BIGINT NOT NULL,

    CONSTRAINT UserIdCommentFK FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE,
    CONSTRAINT ParentCommentFK FOREIGN KEY (parent_comment) REFERENCES Comment (id) ON DELETE CASCADE,
    CONSTRAINT  PostIdCommentFK FOREIGN KEY (postId) REFERENCES Post (id) ON DELETE CASCADE
);

CREATE TABLE Assessment(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    points BIGINT,
    userId BIGINT,
    CONSTRAINT UserIdAssessmentFK FOREIGN KEY (userId) REFERENCES Users (id) ON DELETE CASCADE
);

CREATE TABLE Quiz(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    maxLength INT DEFAULT 10,
    date DATETIME NOT NULL,
    knowledgeLevel BIGINT NOT NULL,
    assessmentId BIGINT,
    points BIGINT,

    CONSTRAINT AssessmentFK FOREIGN KEY (assessmentId) REFERENCES Assessment (id) ON DELETE CASCADE
);

CREATE TABLE Question(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name LONGTEXT NOT NULL,
    imagePath VARCHAR(2048),
    knowledgequestionlevel BIGINT NOT NULL
);

CREATE TABLE QuizQuestions(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quizId BIGINT,
    questionId BIGINT,
    CONSTRAINT QuizQuestionFK FOREIGN KEY (quizId) REFERENCES Quiz (id) ON DELETE CASCADE,
    CONSTRAINT QuestionForQuizFK FOREIGN KEY (questionId) REFERENCES Question (id) ON DELETE CASCADE

);

CREATE TABLE Answer(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name LONGTEXT NOT NULL,
    correct BOOLEAN,
    questionId BIGINT NOT NULL,

    CONSTRAINT QuestionFK FOREIGN KEY (questionId) REFERENCES Question (id) ON DELETE CASCADE
);
CREATE TABLE UserAnswer (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId BIGINT NOT NULL,
    questionId BIGINT NOT NULL,
    answerId BIGINT NOT NULL,
    quizId BIGINT NOT NULL,
    answerDate DATETIME NOT NULL,

    CONSTRAINT UserAnswerUserIdFK FOREIGN KEY (userId) REFERENCES Users (id),
    CONSTRAINT QuestionIdFK FOREIGN KEY (questionId) REFERENCES Question (id),
    CONSTRAINT AnswerIdFK FOREIGN KEY (answerId) REFERENCES Answer (id),
    CONSTRAINT QuizIdFK FOREIGN KEY (quizId) REFERENCES Quiz (id)
);

CREATE TABLE Award(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    award varchar(60) NOT NULL,
    requiredPoints BIGINT NOT NULL,
    userId BIGINT,
    CONSTRAINT AwardUserIdFK FOREIGN KEY (userId) REFERENCES Users (id)
);

CREATE TABLE Circuit(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120),
    distance BIGINT NOT NULL,
    numberLaps BIGINT NOT NULL,
    teamSuccess VARCHAR(120) NOT NULL,
    image varbinary(max),
    categoryId BIGINT NOT NULL,
    CONSTRAINT CategoryIdCircuitMapFK FOREIGN KEY (categoryId) REFERENCES Category (id) ON DELETE CASCADE
);

CREATE TABLE Podium(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date LONGTEXT NOT NULL,
    winner LONGTEXT NOT NULL,
    teamWinner LONGTEXT NOT NULL,
    secondPlace LONGTEXT,
    thirdPlace LONGTEXT,
    image varbinary(max),
    circuitId BIGINT NOT NULL,
    CONSTRAINT CircuitIdPodiumFK FOREIGN KEY (circuitId) REFERENCES Circuit (id) ON DELETE CASCADE
);


CREATE TABLE UserAward(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId BIGINT,
    awardId BIGINT NOT NULL,

    CONSTRAINT AwardUserFK FOREIGN KEY (userId) REFERENCES Users (id),
    CONSTRAINT AwardUserAwardIdFK FOREIGN KEY (awardId) REFERENCES Award (id)
);


CREATE TABLE Event (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(255),
    imageUrl VARCHAR(1024),
    CONSTRAINT UniqueEventName UNIQUE (name)
);


CREATE TABLE Notification (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    message TEXT NOT NULL,
    createdAt DATE NOT NULL,
    eventId BIGINT,
    FOREIGN KEY (eventId) REFERENCES Event(id)
);

CREATE TABLE UserNotification (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    notificationId BIGINT NOT NULL,
    userId BIGINT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    eventId BIGINT NOT NULL,
    FOREIGN KEY (notificationId) REFERENCES Notification(id),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (eventId) REFERENCES Event(id)
);




INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image, points)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL, 0);


INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);

INSERT INTO Category(name,historic,quiz) VALUES ('Quiz', false, true);

INSERT INTO Category(name,historic,quiz) VALUES ('Historia', true, false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Example Post Title', 'Example Post Subtitle', 'This is an example article content.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);


INSERT INTO Award(award,requiredPoints)
VALUES ('PS5', 5);

INSERT INTO Award(award,requiredPoints)
VALUES ('Thrustmaster T150', 8);

INSERT INTO Question (name, imagePath,knowledgequestionlevel)
VALUES ('¿Cuál es el nombre de esta escuderia?','src/main/resources/static/images/bmwsauberF1-92006586-d799-422b-88d2-fdbc9fac1d9f.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes AMG Petronas', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW Sauber', true, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 1);



INSERT INTO Question (name, imagePath,knowledgequestionlevel)
VALUES ('¿En que equipo no ha corrido Nico Hülkenberg?','/static/images/oficial-hulkenberg-sustituye-a-vettel-para-el-gp-de-barein-2cafb8d1-1c37-4975-92e4-eb7e08504aed.jpg',2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 2);

INSERT INTO Question (name, imagePath,knowledgequestionlevel)
VALUES ('¿Quién no ha corrido nunca para Ferrari?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Felipe Massa', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', true, 3);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Qué piloto NO ha pertenecido nunca ha la familia Red Bull? (Red Bull, Toro Rosso/Alpha Tauri, Red Bull Academy)',null,2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Daniel Kvyat', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Isack Hadjar', false, 4);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Que circuito es este?','static/images/images-76ce60ff-33a7-424b-9259-57adc1a37f48.jpg',1);

INSERT INTO Answer (name, correct, questionId) VALUES  ('Monza', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', true, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Istanbul Park', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungaroring', false, 5);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Qué 2 pilotos corrieron con este coche?','static/images/images-80a199ac-fb13-44c3-9811-0204b7fcb9a9.jpg', 3);


INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Hulkenberg', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vitaly Petrov', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 6);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Quien es el hombre de hielo?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Alonso', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Raikkonen', true, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Niki Lauda', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vettel', false, 7);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿En qué escudería no ha estado Fernando Alonso?',null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mclaren', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 8);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Cuándo se creó la F1?',null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('1980', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1950', true, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1948', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1943', false, 9);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Quien es el Team Principal del equipo Mercedes?',null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Zak Brown', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toto Wolff', true, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Christian Horner', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Andrea Stella', false, 10);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Quien ganó el mundial del año 2023?',null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', true, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', false, 11);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('En el año 2023, Max Verstappen superó el record de victorias' ||
        'consecutivas que tenía anteriormente Sebastian Vettel. ¿Cual fue esa cifra?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('9', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('10', true, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('8', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('11', false, 12);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Quien es el piloto con mas carreras disputadas en la historia de la F1?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Michael Schumacher', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', true, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 13);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Para que se usa el DRS?',null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Para tener más aerodinamica', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para reducir el drag', true, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para dar más potencia', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para ayudar en la frenada', false, 14);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Actualmente, los F1 actuales utlizan motores V6 Turbo híbridos desde el año 2014. ¿Que elemento de los motores ' ||
        'actuales se va a eliminar para el reglamento del año 2026?',null, 3);


INSERT INTO Answer (name, correct, questionId) VALUES ('ICE', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-H', true, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-K', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('Bateria', false, 15);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Ferrari es el equipo mas grande de la historia de la F1. Pero, ¿cuando fue la ultima vez que ganaron el mundial?','static/images/carlos-sainz_1h2hvmfieomji1fks4uq8ylzup.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('2010', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2006', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2007', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2008', true, 16);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿Quien es el piloto más joven en ganar el mundial de F1?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', true, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', false, 17);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿En qué año ganó Williams su última carrera hasta la fecha?',null, 3);

INSERT INTO Answer (name, correct, questionId) VALUES ('2012', true, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2015', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2004', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2003', false, 18);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('De los equipos que hay actualmente en la parrilla, ¿cual es el que lleva menos tiempo?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Racing Bulls', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Alpine', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Haas', true, 19);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('¿En qué año ganó Michael Schumacher su primera victoria en F1?',null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('1994', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('2000', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1992', true, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1998', false, 20);


INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Bahrein',5412,57,'Ferrari', '/static/images/Bahrain_Circuit.jpg',2);


INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Saudi Arabia',6200,50,'Red Bull', '/static/images/jeddah.jpg',2);


INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Australia',5300,58,'Ferrari', '/static/images/Australia_Circuit.jpg',2);

INSERT INTO Circuit(name,distance, numberLaps, teamSuccess, image, categoryId)
VALUES('Japan',5807,53,'Red Bull','/static/images/Suzuka.jpg',2);

INSERT INTO Podium(winner,date, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','RedBull','Perez','Sainz',null,1);

INSERT INTO Podium(winner,date, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','RedBull','Perez','Alonso',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Charles Leclerc', '2022','Ferrari','Sainz','Hamilton',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2021','Mercedes','Verstappen','Bottas',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton','2020','Mercedes','Verstappen','Albon',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2019','Mercedes','Bottas','Leclerc',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2018','Ferrari','Bottas','Hamilton',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2017','Ferrari','Hamilton','Bottas',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Raikkonen','Hamilton',null,1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis  Hamilton', '2015','Mercedes','Raikkonen','Rosberg', null, 1);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','RedBull','Sergio Perez','Charles Leclerc', null, 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','RedBull','Sergio Perez','Fernando Alonso', null, 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2022','RedBull','Charles Leclerc','Carlos Sainz', null, 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2021','Mercedes','Max Verstappen','Valtteri Bottas', null, 2);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Carlos Sainz', '2024','Ferrari','Charles Leclerc','Lando Norris', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','Red Bull','Lewis Hamilton','Fernando Alonso', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Charles Leclerc', '2022','Ferrari','George Russell','Lewis Hamilton', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Valtteri Bottas', '2019','Mercedes','Lewis Hamilton','Max Verstappen', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2018','Ferrari','Lewis Hamilton','Kimi Raikkonen', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', '2017','Ferrari','Lewis Hamilton','Valtteri Bottas', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Lewis Hamilton','Sebastian Vettel', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2015','Mercedes','Nico Rosberg','Sebastian Vettel', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2024','Red Bull','Sergio Perez','Carlos Sainz', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2023','Red Bull','Lando Norris','Oscar Piastri', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', '2022','Red Bull','Sergio Perez','Charles Leclerc', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Valtteri Bottas', '2019','Mercedes','Sebastian Vettel','Lewis Hamilton', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2018','Mercedes','Valtteri Bottas','Max Verstappen', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2017','Mercedes','Max Verstappen','Daniel Ricciardo', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', '2016','Mercedes','Max Verstappen','Lewis Hamilton', null, 3);

INSERT INTO Podium(winner, date,teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', '2015','Mercedes','Nico Rosberg','Sebastian Vettel', null, 3);

INSERT INTO Event (name,description,date,location,imageUrl) VALUES ('Bahrein GP', 'First round of the F1 season','2024-07-05','Bahrein',null);

