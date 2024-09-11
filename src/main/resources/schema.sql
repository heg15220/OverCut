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
    imagePath VARCHAR(255),
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
    image VARCHAR(255),
    userId BIGINT,
    CONSTRAINT AwardUserIdFK FOREIGN KEY (userId) REFERENCES Users (id)
);

CREATE TABLE Circuit(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120),
    distance BIGINT NOT NULL,
    numberLaps BIGINT NOT NULL,
    teamSuccess VARCHAR(120) NOT NULL,
    image VARCHAR(255),
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
    image VARCHAR(255),
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


INSERT INTO Category(name,historic,quiz) VALUES ('News',false,false);

INSERT INTO Category(name,historic,quiz) VALUES ('Quiz', false, true);

INSERT INTO Category(name,historic,quiz) VALUES ('Historic', true, false);

INSERT INTO Category(name,historic,quiz) VALUES ('Anecdotes',false,false);



INSERT INTO Award(award,requiredPoints, image)
VALUES ('PS5', 5, 'ps5-product-thumbnail-01-en-14sep21.jpg');

INSERT INTO Award(award,requiredPoints, image)
VALUES ('Thrustmaster T150', 8, 'UTH_T150-racing-wheel-PS4-PC-1-7.jpg');


INSERT INTO Award(award,requiredPoints, image)
VALUES ('PC Gaming', 12, '819cOVjBRRL.jpg');


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the name of this team?', 'bmwsauberF1-92006586-d799-422b-88d2-fdbc9fac1d9f.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes AMG Petronas', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW Sauber', true, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 1);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which team did Nico Hülkenberg never race for?', 'oficial-hulkenberg-sustituye-a-vettel-para-el-gp-de-barein-2cafb8d1-1c37-4975-92e4-eb7e08504aed.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 2);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who never raced for Ferrari?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Felipe Massa', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', true, 3);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver has NEVER been part of the Red Bull family? (Red Bull, Toro Rosso/Alpha Tauri, Red Bull Academy)', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Daniel Kvyat', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Isack Hadjar', false, 4);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which circuit is this?', 'images-76ce60ff-33a7-424b-9259-57adc1a37f48.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Monza', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', true, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Istanbul Park', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungaroring', false, 5);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver raced with this car?', 'images-80a199ac-fb13-44c3-9811-0204b7fcb9a9.jpg', 3);

INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Hulkenberg', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kamui Kobayashi', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 6);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the Ice Man?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Alonso', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Raikkonen', true, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Niki Lauda', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vettel', false, 7);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which team has Fernando Alonso never been part of?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mclaren', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 8);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('When was F1 created?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('1980', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1950', true, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1948', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1943', false, 9);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the Team Principal of Mercedes?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Zak Brown', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toto Wolff', true, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Christian Horner', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Andrea Stella', false, 10);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who won the world championship in 2023?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', true, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', false, 11);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In 2023, Max Verstappen surpassed Sebastian Vettel\s record for consecutive victories. What was that figure?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('9', true, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('10', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('8', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('11', false, 12);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the driver with the most races in F1 history?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Michael Schumacher', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', true, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 13);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is DRS used for?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('To have more aerodynamics', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('To reduce drag', true, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('To give more power', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('To assist in braking', false, 14);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Currently, F1 cars have been using V6 Turbo hybrid engines since 2014. Which element of current engines will be removed for the 2026 regulation?', null, 3);

INSERT INTO Answer (name, correct, questionId) VALUES ('ICE', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-H', true, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-K', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('Battery', false, 15);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Ferrari is the biggest team in F1 history. But, when was the last time they won the world championship?', 'carlos-sainz_1h2hvmfieomji1fks4uq8ylzup.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('2010', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2006', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2007', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2008', true, 16);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the youngest driver to win the F1 world championship?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', true, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', false, 17);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In which year did Williams win their last race to date?', null, 3);

INSERT INTO Answer (name, correct, questionId) VALUES ('2012', true, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2015', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2004', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2003', false, 18);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Of the teams currently on the grid, which has been around the shortest time?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Racing Bulls', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Alpine', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Haas', true, 19);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In which year did Michael Schumacher get his first F1 victory?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('1994', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('2000', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1992', true, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1998', false, 20);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is Alonso\s last win to date in F1?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Spain 2013', true, 21);
INSERT INTO Answer (name, correct, questionId) VALUES ('China 2013', false, 21);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungary 2014', false, 21);
INSERT INTO Answer (name, correct, questionId) VALUES ('Germany 2012', false, 21);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In 2026, with the new regulations we will going to have a new engine. Which new engine is coming to F1?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('General Motors', false, 22);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 22);
INSERT INTO Answer (name, correct, questionId) VALUES ('Audi', true, 22);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW', false, 22);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which circuit is this?', 'racefansdotnet-start-istanbul.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Istambul Park', true, 23);
INSERT INTO Answer (name, correct, questionId) VALUES ('Red Bull Ring', false, 23);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nurburgring', false, 23);
INSERT INTO Answer (name, correct, questionId) VALUES ('Zaandvort', false, 23);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Mclaren did a 1-2 in the Hungarian GP in 2024. When was the last time Mclaren achieved that?', '4007762-81292888-2560-1440.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Brazil 2012', false, 24);
INSERT INTO Answer (name, correct, questionId) VALUES ('Italy 2021', true, 24);
INSERT INTO Answer (name, correct, questionId) VALUES ('Miami 2024', false, 24);
INSERT INTO Answer (name, correct, questionId) VALUES ('Canada 2010', false, 24);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In which country did the 2020 season start?', '15938651546549.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Australia', false, 25);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', false, 25);
INSERT INTO Answer (name, correct, questionId) VALUES ('Great Britain', false, 25);
INSERT INTO Answer (name, correct, questionId) VALUES ('Austria', true, 25);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many days does a Gran Prix last ', '15938651546549.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('1', false, 26);
INSERT INTO Answer (name, correct, questionId) VALUES ('2', false, 26);
INSERT INTO Answer (name, correct, questionId) VALUES ('3', true, 26);
INSERT INTO Answer (name, correct, questionId) VALUES ('4', false, 26);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which is the team with the most starts in F1? ', '58.jpg', 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mclaren', false, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Ferrari', true, 27);
INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes', false, 27);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first Formula 1 Grand Prix won by Lewis Hamilton?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Canadian GP 2007', true, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('Italian GP 2010', false, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('Spanish GP 2008', false, 28);
INSERT INTO Answer (name, correct, questionId) VALUES ('German GP 2009', false, 28);

-- Pregunta 29
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who holds the record for the most Formula 1 race wins?', 'article-1377757-0BAA374500000578-340_634x432.jpg', 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', true, 29);
INSERT INTO Answer (name, correct, questionId) VALUES ('Ayrton Senna', false, 29);
INSERT INTO Answer (name, correct, questionId) VALUES ('Michael Schumacher', false, 29);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 29);

-- Pregunta 30
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which team has the most Formula 1 race wins in history?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('Ferrari', true, 30);
INSERT INTO Answer (name, correct, questionId) VALUES ('McLaren', false, 30);
INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes', false, 30);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 30);

-- Pregunta 31
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the longest track in Formula 1 history?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('SpaFrancorchamps Circuit', false, 31);
INSERT INTO Answer (name, correct, questionId) VALUES ('Autodromo Hermanos Rodríguez', false, 31);
INSERT INTO Answer (name, correct, questionId) VALUES ('Circuit Gilles Villeneuve', false, 31);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nurburgring', true, 31);

-- Pregunta 34
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which race track is by far the longest regularly used for Formula 1 Grand Prix races?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Circuit de Spa-Francorchamps', true, 32);
INSERT INTO Answer (name, correct, questionId) VALUES ('Autódromo José Carlos Pace', false, 32);
INSERT INTO Answer (name, correct, questionId) VALUES ('Circuit Gilles Villeneuve', false, 32);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nurburgring', false, 32);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which racing team in Formula 1 are associated with bright red cars?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('McLaren', false, 33);
INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes', false, 33);
INSERT INTO Answer (name, correct, questionId) VALUES ('Red Bull', false, 33);
INSERT INTO Answer (name, correct, questionId) VALUES ('Ferrari', true, 33);

-- Pregunta 37
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which successful F1 team owner built his cars in the woodshed of the family''s timber business?', null, 2);

INSERT INTO Answer (name, correct, questionId) VALUES ('Ken Tyrrell', true, 34);
INSERT INTO Answer (name, correct, questionId) VALUES ('Bernie Ecclestone', false, 34);
INSERT INTO Answer (name, correct, questionId) VALUES ('Flavio Briatore', false, 34);
INSERT INTO Answer (name, correct, questionId) VALUES ('Ron Dennis', false, 34);

-- Pregunta 38
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which year did Michael Schumacher win his first ever drivers championship in Formula One?', null, 1);

INSERT INTO Answer (name, correct, questionId) VALUES ('1990', false, 35);
INSERT INTO Answer (name, correct, questionId) VALUES ('1994', true, 35);
INSERT INTO Answer (name, correct, questionId) VALUES ('1992', false, 35);
INSERT INTO Answer (name, correct, questionId) VALUES ('1993', false, 35);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How do wind effects influence a F1 car\s performance?', 'images17.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Wind effects can alter the balance of the car, especially in fast corners.', true, 36);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Wind can cause lateral slides if not handled correctly.', false, 36);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Wind affects engine efficiency.', false, 36);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Wind influences the direction of the car during overtaking maneuvers.', false, 36);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the key difference between Q1, Q2, and Q3 classification systems in F1?', 'pierre-gasly-alphatauri-at02-i.jpg', 1);

-- Respuestas para la pregunta anterior
INSERT INTO Answer (name, correct, questionId)
VALUES ('Q1 determines who advances to the next round of qualification.', true, 37);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Q2 decides the final positions in the starting grid.', false, 37);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Q3 sets the initial order of the race.', false, 37);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Q1 and Q2 define the drivers who participate in the race.', false, 37);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Why is overtaking so difficult in F1?', '15289134275279.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Due to the dirty air ejected by the car being chased.', true, 38);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Thanks to the team strategy to stay ahead.', false, 38);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Thanks to the FIA regulation that penalizes overtaking.', false, 38);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Because there are few clear opportunities to overtake on most tracks.', false, 38);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first country outside Europe to host a Formula 1 race?', NULL, 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil', false, 39);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('South Africa', false, 39);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia', true, 39);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('United States', false, 39);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who won the Spanish Grand Prix in 1966, marking the first victory for a British constructor since the introduction of free engine regulations?', NULL, 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jim Clark', true, 40);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jackie Stewart', false, 40);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('John Surtees', false, 40);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Graham Hill', false, 40);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which constructor has won the Formula 1 Constructors World Championship in the minimum number of seasons since its debut?', '360_F_471722307_raSMYjGlXua2GMuZoEHDEVNYSTLBOlni.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 41);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Red Bull Racing', true, 41);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mercedes', false, 41);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Scuderia Ferrari', false, 41);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which of these statements about tires in F1 is true?', 'Cuatro-neumaticos-Pirelli-de-carreras.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hard tires always offer more durability than soft tires.', false, 42);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Soft tires always offer more grip than hard tires.', false, 42);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('There is a specific type of tire called "intermediates" designed for mixed wet and dry conditions.', true, 42);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All Formula 1 cars use tires of the same brand and specification.', false, 42);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who holds the record for the most pole positions in a single season?', 'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_1.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 43);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', true, 43);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 43);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', false, 43);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which team has won the Constructors World Championship the most times?', 'desktop-wallpaper-f1-team-logos-formula1-f1-2021-teams.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 44);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ferrari', true, 44);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mercedes', false, 44);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Red Bull', false, 44);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('The Spanish Grand Prix is currently hold in Montmelo. Who was the first driver to win there?', 'fotos-gp-espana-f1-202287138-1653075223_6.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', false, 45);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 45);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ayrton Senna', false, 45);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nigel Mansell', true, 45);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In what year did the current points system for F1 racing get introduced?', '450_1000.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1989', false, 46);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1995', false, 46);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2003', false, 46);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2010', true, 46);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many races make up the official F1 calendar?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('16', false, 47);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('20', false, 47);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('24', true, 47);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('26', false, 47);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which country hosts the Circuit of Spa-Francorchamps?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France', false, 48);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany', false, 48);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Belgium', true, 48);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy', false, 48);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which F1 circuit sees the highest average speeds during a race?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monza', true, 49);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spa-Francorchamps', false, 49);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', false, 49);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Suzuka', false, 49);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In 1998 F1 stopped using slick tyres. When were slick tires introduced to F1 racing back again?',
        'f4b6d415-a39e-4797-a0b7-4806d5c9f923_source-aspect-ratio_default_0.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2008', false, 50);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2013', false, 50);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2009', true, 50);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2016', false, 50);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which city hosted the first night race ever held in Formula One?', 'gettyimages-499135626-612x612.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapore', true, 51);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Abu Dhabi', false, 51);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Shanghai', false, 51);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sakir', false, 51);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first Formula 1 Grand Prix held in Asia?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malaysian Grand Prix (1999)', false, 52);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapore Grand Prix (2008)', false, 52);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Chinese Grand Prix (2004)', false, 52);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Japanese Grand Prix (1976)', true, 52);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many times has the Scuderia Ferrari team won the Italian Grand Prix?',
        'ferrari-sonrie-monza-sancion-carlos-sainz-incluida-todo-funciona-bien-202289708-1662749006_1.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('14 times', false, 53);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('21 times', false, 53);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('19 times', true, 53);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('15 times', false, 53);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many times has the Williams team won the Canadian Grand Prix?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5 times', false, 54);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7 times', true, 54);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3 times', false, 54);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('11 times', false, 54);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What year were air brake systems introduced in F1?', 'upmac1f.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2014', false, 55);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2005', false, 55);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2009', false, 55);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2011', true, 55);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many times has the Renault team won the French Grand Prix?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5 times', true, 56);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3 times', false, 56);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8 times', false, 56);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('12 times', false, 56);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first year in which the brake caliper system was used?', 'upmac1f.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1983', false, 57);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1976', true, 57);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1990', false, 57);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1968', false, 57);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first Formula 1 Grand Prix in which the use of lead-free fuels was allowed?', '1366_2000.jpeg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('South Africa 1992', true, 58);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 1987', false, 58);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 1999', false, 58);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 2002', false, 58);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the first Formula 1 Grand Prix in which the use of KERS (Kinetic Energy Recovery System) was allowed?', 'salida-alemania.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Bahrein 2010', false, 59);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone 2011', false, 59);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 2012', false, 59);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 2009', true, 59);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the main purpose behind the regulatory changes proposed by the "Weickershof Protocol" for F1 between 1995 and 1999?', null, 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To improve safety during races', false, 60);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To limit team budgets', true, 60);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To introduce new technical regulations', false, 60);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To promote sustainability in the sport', false, 60);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the result of the technical transition in F1 in 1998?',
        'gp-australia-1998-hakkinen-coulthard-soymotor.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('An increase in competitiveness among teams', true, 61);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Less safety cars', false, 61);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The introduction of new materials in the chassis of cars', false, 61);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The elimination of certain advanced technologies', false, 61);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What was the main objective behind the introduction of the brake-by-wire system in F1?',
        'brake-by-wire-el-ultimo-rompecabezas-de-la-f1-201521101_3.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To reduce the weight of the cars', false, 62);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To improve energy efficiency', false, 62);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To increase braking capacity under high temperature conditions', true, 62);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To facilitate quick tire replacement', false, 62);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver has the highest average points per race over the last decade in Formula 1?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 63);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', false, 63);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', true, 63);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', false, 63);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What percentage of races have been won by Mercedes since their entry into Formula 1 in 2010?',
        'Schumacher_Mercedes_Jerez_(cropped).jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Less than 20%', false, 64);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Between 20% and 40%', false, 64);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Between 40% and 60%', true, 64);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('More than 60%', false, 64);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which team has the record for the most consecutive wins in a single season?', null, 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 65);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ferrari', false, 65);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mercedes', false, 65);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Red Bull', true, 65);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver has the biggest amount of podiums achieved for their teams, compared to all his team-mates?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 66);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', true, 66);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', false, 66);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 66);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many teams participate in Formula 1?', 'f1-australia-salida1_hd_32675.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('10 teams', true, 67);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7 teams', false, 67);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8 teams', false, 67);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('11 teams', false, 67);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the average maximum speed of F1 cars?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Over 320 km/h', true, 68);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Between 250 and 300 km/h', false, 68);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Less than 250 km/h', false, 68);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Exactly 350 km/h', false, 68);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many points are awarded to the winner of a Formula 1 race?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('15 points', false, 69);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('25 points', true, 69);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('20 points', false, 69);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('10 points', false, 69);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which organization regulates Formula 1?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('FIM', false, 70);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('FINA', false, 70);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('FIBA', false, 70);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('FIA', true, 70);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In Formula 1, what is the primary goal of a pit stop strategy during a race?',
        'sergio-perez-red-bull-racing-r.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To minimize the time spent in the pits', true, 71);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To maximize the number of stops', false, 71);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To maintain the current position in the race', false, 71);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To gain positions relative to competitors', false, 71);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the significance of choosing the right tire compound during a pit stop strategy?', '006_small.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It affects the car\s handling', false, 72);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It determines the number of stops needed', false, 72);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It influences the car\s speed', false, 72);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', true, 72);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What factors influence the decision to adopt a one-stop, two-stop, or three-stop strategy in Formula 1?',
        '5d2c1cab0ce69448248b4d2b-f1-2019-gp-gran-bretana-victoria-una-sola-parada-boxes.jpeg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Tire degradation rates', false, 73);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Track conditions', false, 73);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Car setup', false, 73);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', true, 73);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In a two-stop strategy, why might a team choose to start on the medium tire compound instead of the soft?',
        'starting-grid-1.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Medium tires offer better grip in the beginning of the race', false, 74);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Starting on medium tires allows for a more flexible first stint', false, 74);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Starting on medium tires allows for a more flexible strategy', true, 74);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Medium tires are cheaper', false, 74);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', false, 74);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the advantage of using a three-stop strategy in Formula 1?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It allows for fresher tires at the end of the race', true, 75);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It provides more opportunities for overtaking', false, 75);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It minimizes the risk of tire failure', false, 75);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('It ensures a consistent pace throughout the race', false, 75);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Consider a Formula 1 race where the weather forecast predicts heavy rain towards the latter stages of the race.' ||
        'In the given scenario, what would be the optimal pit stop strategy for maximizing the chances of winning' ||
        ' the Formula 1 race, considering the dynamic weather conditions, tyre selection, car performance, safety' ||
        ' risks, and competitor strategies?', 'analisis-gp-brasil-f1-2023-soymotor.jpg', 3);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Stick to the initial plan of starting on intermediate tyres and hope for the best, minimizing pit' ||
     ' stops to save time', false, 76);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Switch to extreme wet tyres as soon as light rain starts, prioritizing performance in wet condition' ||
     's despite the risk of early tyre degradation', false, 76);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Delay the switch to extreme wet tyres until the very end of the race, hoping to maintain speed in the dry con' ||
     'ditions and then capitalize on the performance boost in the heavy rain', true, 76);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Continuously monitor track conditions and adjust tyre strategy accordingly, focusing on' ||
     ' maintaining a balance between speed and tyre life to stay ahead of competitors', false, 76);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In a Formula 1 race, drivers find themselves in a unique situation where the race is ' ||
        'being held in extremely hot conditions, causing the asphalt to heat up significantly. ' ||
        'This leads to increased tire degradation and reduced grip. Given this scenario, how would you strategize' ||
        ' pit stops for the drivers considering all started on softs?', 'captura-4643897367.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Stick rigidly to the hard compound tyres throughout the entire race, ' ||
     'relying on the durability of these tyres to maintain a steady pace', false, 77);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Make an early switch to medium compound tyres to benefit from ' ||
     'improved grip and performance, despite the potential for faster tire degradation.', true, 77);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Delay the switch to medium compound tyres until the very end of the race, ' ||
     'attempting to preserve the hard compound tires for as long as possible to avoid unnecessary pit stops', false, 77);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Trying to use the hard tyres as much time as possible to have more consistent lap times during the race ', false, 77);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Overtake Under Yellow Flags During a race, there is an accident on the track, and yellow flags are deployed. ' ||
        'A driver attempts to make a pass while the yellow flags are out. How is the sporting regulations applied in ' ||
        'this situation?', 'a-marshal-holds-a-yellow-flag-1.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Passing is allowed as long as the other car goes very slow and it does not put the driver being passed at risk', true, 78);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Passing under yellow flags is prohibited to avoid additional risks', false, 78);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Passing is allowed but the passing driver must yield position in the next corner', false, 78);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Passing is allowed without restrictions', false, 78);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Collision While Racing Two drivers collide during a race but manage to continue racing. ' ||
        'What action should the stewards take regarding this incident?',
        'el-red-bull-de-max-verstappen-vuela-tras-el-toque-DMCHB3HIH5HSZOMSUQAMPNPYXQ.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('No action, as both drivers continued racing', false, 79);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Warn both drivers about future incidents', false, 79);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Investigate for potential penalties due to dangerous driving', true, 79);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Disqualify both drivers from the race', false, 79);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Driver Forced Off Track forces another off the track during a close battle. ' ||
        'What is the appropriate response from the stewards?', 'images22.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('No action, as it was part of the racing', false, 80);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Investigate the driver who forced the other off track and reprimand the driver forced off track ', false, 80);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Investigate for potential penalties due to forcing another driver off track in both cases', true, 80);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Disqualify the driver who forced the other off track', false, 80);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Defensive Driving During Braking A driver defends against an attack by moving during braking, ' ||
        'which leads to contact with another driver. What is the correct course of action by the stewards?',
        'verstappen-norris-635x358.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Disqualify the driver who moved under braking', false, 81);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Put a several penalty to the driver who moved under breaking', true, 81);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Put just a reprimand for that action', false, 81);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Just a racing incident', false, 81);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which was Ayrton Senna\s first car in F1?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 82);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lotus', false, 82);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toleman', true, 82);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Arrows', false, 82);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which was Michael Schumacher\s first car in F1?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ferrari', false, 83);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jordan', true, 83);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Benetton', false, 83);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mercedes', false, 83);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which is Fernando Alonso\s first win in F1?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 2004', false, 84);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spain 2003', false, 84);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malasia 2005', false, 84);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2003', true, 84);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which was Ayrton Senna\s first win in F1?', null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Donnington 1993', false, 85);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Portugal 1985', true, 85);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monaco 1984', false, 85);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 1988', false, 85);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver holds the record for more races having podiums but not winning in F1?', null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lando Norris', false, 86);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Romain Grosjean', false, 86);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nick Heidfeld', true, 86);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sergio Perez', false, 86);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the primary difference between the deployment of the Safety Car and the Red Flag during Formula 1 races?',
        '16474210250936.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The Safety Car is used when there are adverse weather conditions, ' ||
     'while the Red Flag indicates a temporary halt in the race due to track hazards', false, 87);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The Red Flag means the race has been completely stopped, whereas' ||
     ' the Safety Car slows down the cars but allows the race to continue', true, 87);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The Safety Car is activated for significant accidents on the track, ' ||
     'while the Red Flag is shown at the end of the race to signal the official conclusion', false, 87);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Both serve to indicate the same type of situation; only the colors change', false, 87);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver has the biggest amount of pole positions in F1 history?',
        'fia-estudia-problemas-visibilidad-semaforo-gp-australia-f1-201955766_2.jpg', 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ayrton Senna', false, 88);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 88);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', false, 88);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', true, 88);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver has the biggest amount of podiums in F1 history?',
        '38fb463a6228ca4c1a6724f0eb3b04590518d237.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Alain Prost', false, 89);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 89);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', false, 89);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', true, 89);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver was the first one to win the f1 world championship?', null, 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Giuseppe Farina', true, 90);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Juan Manuel Fangio', false, 90);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jim Clark', false, 90);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Alberto Ascari', false, 90);



INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which drivers holds the record for winning a championship with the biggest age?', null, 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Alberto Ascari', false, 91);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Giuseppe Farina', false, 91);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Juan Manuel Fangio', true, 91);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Niki Lauda', false, 91);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the car', 'Rubens_Barrichello_2006_USA.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Honda', true, 92);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Super Aguri', false, 92);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Williams', false, 92);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jordan', false, 92);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Since Ferrari won their last championship to date, which driver has taken the biggest amount of wins for the scuderia?',
        '1200px-Kimi_Raikkonen_won_2007_Brazil_GP.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', true, 93);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Charles Leclerc', false, 93);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', false, 93);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', false, 93);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'hamilton_vettel_glock_brasil_2008_soy_motor.jpg', 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fuji 2007', false, 94);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2008', true, 94);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea 2010', false, 94);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2009', false, 94);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        '709607-21389434-2560-1440.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Abu dhabi 2007', false, 95);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2008', false, 95);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Bahrein 2008', true, 95);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Abu Dhabi 2009', false, 95);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'image23.jpg', 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Japan 1989', true, 96);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spain 1991', false, 96);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 1988', false, 96);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 1990', false, 96);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'cui-png2.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea 2011', false, 97);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2012', true, 97);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Japan 2013', false, 97);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea 2010', false, 97);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        '15644308053724.jpg', 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nurburgring 2020', false, 98);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2018', false, 98);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Great Britian 2018', false, 98);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany 2019', true, 98);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        '_103266921_hamilton_vettel_getty1.jpg', 1);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Suzuka 2018', false, 99);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2018', true, 99);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2019', false, 99);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 2019', false, 99);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        'sddefault.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nurburgring', false, 100);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Magny Cours', false, 100);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monza', false, 100);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hockenheim', true, 100);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In which year F1 started to put color on tyres to distinguish the different compounds?',
        'ede47cd9-7902-4751-8c24-46e2a3b7a386_source-aspect-ratio_default_0.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2009', false, 101);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2005', false, 101);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2011', false, 101);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2007', true, 101);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        'lewishamiltongpchina2008.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Suzuka', false, 102);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Shanghai', true, 102);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea', false, 102);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('India', false, 102);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track and year for this moment',
        '1366_2000.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2013', false, 103);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea 2011', false, 103);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('India 2013', true, 103);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2012', false, 103);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('During a Formula 1 race, a major accident occurs that results in significant debris scattered across the track,' ||
        ' posing a substantial risk to the drivers.The driver who had the accident is okay. The race director needs to decide on the appropriate action. ' ||
        'Which of the following options accurately reflects the correct procedure according to the FIA Sporting Regulations?',
        'asi-fue-el-accidente-de-carlos-V6JX6ICWVVCLTE44QGHEEUIUQQ.jpg', 2);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Deploy the Safety Car to slow down the field and allow marshals to clear the debris', true, 104);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Immediately halt the race by displaying the red flag due to the severity of the accident', false, 104);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Continue the race under caution without deploying the Safety Car', false, 104);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Allow the drivers to decide whether to slow down or not', false, 104);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Heavy rain continues to fall during a Formula 1 race, making the track unsafe for racing. The race director ' ||
        'must determine the correct course of action. Which of the following options aligns with the FIA Sporting Regulations?',
        'images24.jpg', 2);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Deploy the Safety Car to slow down the field and wait for the rain to subside', false, 105);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Immediately halt the race by displaying the red flag due to the unsafe track conditions', true, 105);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Continue the race under caution without deploying the Safety Car or the red flag', false, 105);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Allow the drivers to decide whether to continue racing or not', false, 105);
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which country hosted the first Formula 1 Grand Prix in history?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France', false, 106);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy', false, 106);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('United Kingdom', true, 106);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany', false, 106);
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What circuit has hosted the most Grand Prix in the history of Formula 1?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monza', false, 107);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', true, 107);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spa-Francorchamps', false, 107);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Suzuka', false, 107);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many times has the Spanish Grand Prix been the host of the inaugural race of a new Formula 1 championship?',
        'formula-1-european-gp-1997-jac-2.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', true, 108);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 108);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3', false, 108);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Never', false, 108);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the highest number of points obtained by a driver in a single season?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher 2002', false, 109);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen 2023', true, 109);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton 2019', false, 109);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel 2013', false, 109);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many times has Fernando Alonso raced the Australian GP?',
        'fernando-alonso-aston-martin-a-3.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('19 times', true, 110);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('21 times', false, 110);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('20 times', false, 110);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('17 times', false, 110);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'fernando-alonso-jaguar-r3-1.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pedro de la Rosa', false, 111);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Eddie Irvine', false, 111);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mark Webber', false, 111);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', true, 111);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'Valentino-Rossi-piloto-F1-Ferrari-14.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Felipe Massa', false, 112);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 112);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', false, 112);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('No F1 driver', true, 112);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('F1 left USA in 2007. When was the first United States Grand Prix held after its reintroduction to the Formula 1 calendar?',
        'USGP_F1_COTA_3_US_Grand_Prix_Formula_1_at_COTA_2d7014fd-e1cb-4c62-89d0-1e468ab9929c.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2010', false, 113);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2009', false, 113);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2013', false, 113);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2012', true, 113);
INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many drivers compete in each Grand Prix of a Formula One season?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('20', true, 114);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('24', false, 114);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('18', false, 114);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('22', false, 114);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many Grand Prix Starts did Jackie Stewart have during his professional career?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('100', true, 115);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('150', false, 115);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('125', false, 115);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('110', false, 115);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many Grand Prix Starts did world champion Michael Schumacher have during his career before 2007?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('250', false, 116);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('260', false, 116);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('270', false, 116);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('280', true, 116);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many Grand Prix Starts did world champion Michael Schumacher have during his career before 2007?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('250', false, 117);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('260', false, 117);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('270', false, 117);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('280', true, 117);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name year and track for this moment?',
        'BeaF-8xIcAAYBbM.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Valencia 2010', true, 118);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapur 2012', false, 118);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Korea 2011', false, 118);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Canada 2009', false, 118);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the team',
        '9.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jordan', false, 119);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Bar honda', false, 119);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Arrows', true, 119);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toleman', false, 119);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('If the circuit is in wet conditions for the whole race and the drivers start with intermediate tyres, they need to do a pit stop? ',
        '14885385788381.jpg', 2);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Yes, as the rules say that every car must do one pit stop during a race at least', false, 120);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Yes, as non stopping can be very dangerous', false, 120);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('They can not pit if they want', true, 120);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('They need to put the wet tyres in the next stint', false, 120);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'article-2351820-1A95E98F000005DC-265_634x286.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone 2012', false, 121);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone 2013', true, 121);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austin 2012', false, 121);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Canada 2010', false, 121);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'COKcBbWVAAAi53b.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monza 2015', true, 122);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2014', false, 122);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2015', false, 122);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Suzuka 2015', false, 122);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        '2da5e299e491fc1eae59abe0ff97ee1f.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spain 2007', false, 123);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Britain 2008', false, 123);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Canada 2008', true, 123);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malaysia 2007', false, 123);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the team',
        '15185392040281.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sauber', false, 124);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('BAR', true, 124);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Williams', false, 124);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Minardi', false, 124);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the team',
        '219.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Arrows', false, 125);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Stewart', false, 125);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Prost GP', false, 125);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Williams', true, 125);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('When was the last time Mclaren won the championship to date?',
        'f1-mclarens-india-inline.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2007', false, 126);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2008', false, 126);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1999', false, 126);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1998', true, 126);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('When was the last time Mclaren won the championship to date?',
        'f1-mclarens-india-inline.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2007', false, 127);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2008', false, 127);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1999', false, 127);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1998', true, 127);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many teams competed in the inaugural Formula 1 World Championship season in 1950?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('14', true, 128);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('12', false, 128);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('11', false, 128);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('13', false, 128);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which car manufacturer has produced engines for the most constructors championships in Formula 1?',
        null, 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ford', false, 129);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mercedes', false, 129);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ferrari', true, 129);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Renault', false, 129);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver holds the record for the most wins at the Monaco Grand Prix?',
        'gp-monaco-1996-carrera-mas-caotica-historia-f1.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ayrton Senna', true, 130);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', false, 130);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 130);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Alain Prost', false, 130);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver who did NOT win a grand prix in the 2012 season',
        'f0777c49a212574fd31ea18b515392a9.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pastor Maldonado', false, 131);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', false, 131);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nico Rosberg', false, 131);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Romain Grosjean', true, 131);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver won the last Malaysian GP in F1?',
        'SalidaGPMalasia2009.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', false, 132);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 132);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nico Rosberg', false, 132);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', true, 132);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver won the last Malaysian GP in F1?',
        'SalidaGPMalasia2009.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', false, 133);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 133);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nico Rosberg', false, 133);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', true, 133);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver won the last Malaysian GP in F1?',
        'SalidaGPMalasia2009.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', false, 134);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 134);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nico Rosberg', false, 134);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Max Verstappen', true, 134);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the maximum power output allowed for a Formula 1 engine?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('900', false, 135);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1000', false, 135);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1100', true, 135);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1200', false, 135);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many gears does a modern Formula 1 car have?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 136);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('6', false, 136);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7', false, 136);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8', true, 136);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many liters of fuel must a Formula 1 car carry for a race distance of 305 kilometers?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('150', true, 137);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('100', false, 137);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('200', false, 137);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('250', false, 137);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the team',
        'caterham-f1.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jordan', false, 138);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sauber', false, 138);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Caterham', true, 138);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Benetton', false, 138);



INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the team',
        'f1-spyker-2007.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Midland', false, 139);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Force India', false, 139);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spyker', true, 139);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Arrows', false, 139);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'Pedro_de_la_Rosa_2005_Britain.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nick Heidfeld', false, 140);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pedro de la Rosa', true, 140);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Juan Pablo Montoya', false, 140);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', false, 140);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which drink is sprayed by winning drivers at the end of a Formula One race?',
        'podio_japon_2017_soy_motor.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Champagne', true, 141);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Water', false, 141);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Milk', false, 141);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Other drink', false, 141);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the significance of the yellow and red striped flag in Formula 1?',
        '1_foDYHEmOHMtHrSZgpP5q3A.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Caution required', true, 142);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pit lane closed', false, 142);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Danger ahead', false, 142);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('End of the race', false, 142);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the meaning of this flag?',
        '15929284269004.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Caution required', false, 143);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pit lane closed', false, 143);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Danger ahead', false, 143);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('End of the race', true, 143);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the meaning of this flag?',
        'comisarios-bandera-amarilla-2021-soymotor.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Caution required', false, 144);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pit lane closed', false, 144);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Danger ahead', true, 144);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('End of the race', false, 144);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What does performing an "undercut" mean in a Formula 1 race?',
        'Undercut-F1.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Changing tires earlier than the other car to try to pass him', true, 145);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Waiting until the very last lap to change tires', false, 145);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Performing a pit stop after the leader to capitalize on their lead', false, 145);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Not changing tires at all during the race', false, 145);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What does performing an "overcut" mean in a Formula 1 race?',
        'screenshot-2018-04-03-13-56-50.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Changing tyres after the other car to try to do the overtake', true, 146);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Waiting until the very last lap to change tyres', false, 146);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Performing a pit stop before the leader to capitalize on their lead', false, 146);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Not changing tires at all during the race', false, 146);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the primary function of the Virtual Safety Car (VSC) in Formula 1?',
        'virtual-safety-car-3432279.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To bring all cars to a complete stop', false, 147);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To reduce the speed of all cars equally to allow for safe recovery of incidents or debris', true, 147);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To enforce a mandatory pit stop for all drivers', false, 147);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To introduce a temporary caution period without slowing down the cars', false, 147);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which is Sebastian Vettel\s first win in F1?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2009', false, 148);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2008', true, 148);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2007', false, 148);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Great Britian 2009', false, 148);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which is Max Verstappen\s first win in F1?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malaysia 2017', false, 149);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spain 2016', true, 149);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mexico 2017', false, 149);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2016', false, 149);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name year and track for this moment',
        '_45650053_07lewisgravel512.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2007', false, 150);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malaysia 2008', false, 150);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2007', true, 150);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2008', false, 150);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name year and track for this moment',
        'FYqwDVvXkAMHGtB.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2015', false, 151);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2014', true, 151);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Spain 2014', false, 151);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany 2014', false, 151);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Ferrari achieved a 1-2 finish at the 2024 Australian GP. When was the last time they did that?',
        'carlos-sainz-ferrari-sf-24-2.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Bahrein 2022', true, 152);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 2022', false, 152);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapore 2019', false, 152);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2017', false, 152);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the only driver that holds the record for being on the podium in every race of a single season?',
        null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 153);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Michael Schumacher', true, 153);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sebastian Vettel', false, 153);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Ayrton Senna', false, 153);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'Kepernyofoto-2024-02-09-8.31.33-e1707464078190.png', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nurburgring 2006', false, 154);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Great Britian 2005', false, 154);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 2006', false, 154);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2006', true, 154);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'racefansdotnet-20180903-103054-68.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2019', false, 155);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2018', true, 155);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2018', false, 155);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2019', false, 155);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        '5f983feff4709d5867dcc940.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2012', false, 156);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2010', false, 156);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2013', false, 156);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2011', true, 156);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'coulthard-mschumacher-francuska-2000-1024x674.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany 1999', false, 157);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2001', false, 157);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 2000', true, 157);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 1998', false, 157);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'gp-de-belgica-2004-siete-veces-michael-schumacher-2024103232-1720946726_3.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2003', false, 158);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Germany 2004', false, 158);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 2003', false, 158);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Belgium 2004', true, 158);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'images25.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Japan 2005', true, 159);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Japan 2006', false, 159);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2004', false, 159);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Belgium 2005', false, 159);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'image26.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2020', false, 160);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2019', false, 160);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Italy 2021', true, 160);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Austria 2021', false, 160);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who holds the record for winning a Grand Prix with the biggest amount of pit stops?',
        null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fernando Alonso', false, 161);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Alain Prost', false, 161);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Lewis Hamilton', false, 161);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jenson Button', true, 161);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Verstappen overtook Hamilton for the 2021 championship on the last lap. ' ||
        'But can you remember in which corner of the Abu Dhabi track was the overtake done?',
        '7vsxuxdpdc5a1.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7', false, 162);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('9', false, 162);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', true, 162);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('12', false, 162);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In 2010, Mclaren put on their car the F-Duct. What was it used for?',
        '1200px-hamilton_canadian_gp_2010_with_f-duct.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To generate additional downforce under braking', false, 163);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To manage the cars balance during high-speed corners', false, 163);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To manage the tyres in a better way', false, 163);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To reduce drag on the straigths', true, 163);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Brawn GP used in 2009 a double diffuser on their car. What was it used for?',
        'Brawn-GP-raised-eyebrows-in-2009-with-their-double-diffuser-3921320.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('For increasing the car\s top speed', false, 164);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('For generating more downforce at the rear of the car', false, 164);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('For increasing aerodynamic level of the car without increasing drag', true, 164);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To improve the car\s hydraulic system', false, 164);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Renault used a sistem called mass damper in their 2006 F1 car. What was it used for?',
        'Screenshot-2021-11-02-at-16.57.04.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To absorb energy from the suspension during high-frequency vibrations', true, 165);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To adjust the car\s ride height dynamically', false, 165);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To alter the car\s aerodynamic profile during the race', false, 165);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('To store energy generated by the car\s motion', false, 165);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What does understeer refer to in the context of Formula 1 car dynamics?',
        'GS7PpavXoAEFq3Z.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car turns more sharply than intended', false, 166);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car turns less sharply than intended', true, 166);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car drifts sideways through corners', false, 166);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car slides forward upon braking', false, 166);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which factor primarily contributes to understeer in a Formula 1 car?',
        null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Low front wing angle', false, 167);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Too hard front suspension', false, 167);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Incorrect camber settings', false, 167);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', true, 167);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What does oversteer refer to in the context of Formula 1 car dynamics?',
        'images27.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car turns more sharply than intended', true, 168);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car turns less sharply than intended', false, 168);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car drifts sideways through corners', false, 168);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car slides forward upon braking', false, 168);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which factor primarily contributes to oversteer in a Formula 1 car?',
        null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Excessive front wing angle', false, 169);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Too soft front suspension', false, 169);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Incorrect camber settings', false, 169);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', true, 169);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name track and year for this moment',
        'F_01_672-458_resize.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2013', false, 170);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2012', true, 170);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Brazil 2011', false, 170);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('None of them', false, 170);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'images28.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Johnny Herbert', false, 171);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Martin Brandle', false, 171);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jos Verstappen', true, 171);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jean Alesi', false, 171);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        '5780b6e54afc966e5bc5e647401e24f01da31d7243f15.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Esteban Gutierrez', false, 172);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Charles Leclerc', true, 172);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Pietro Fittipaldi', false, 172);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Romain Grosjean', false, 172);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'h2rqBGj3DSwn-Zim8kbtF59KUcUTvlICdAjUHt8QpOI.jpg', 2);
INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 173);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Salo', false, 173);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', false, 173);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kimi Raikkonen', true, 173);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'renault-f1-team-renault-r24-villeneuve-7647.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jacques Villeneuve', true, 174);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jarno Trulli', false, 174);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Giancarlo Fisichella', false, 174);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Heikki Kovalainen', false, 174);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many drivers get points at the end of a race?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('9', false, 175);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('10', true, 175);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('11', false, 175);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8', false, 175);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the team principal of Red Bull Racing?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toto Wolff', false, 176);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Zak Brown', false, 176);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mike Krack', false, 176);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Christian Horner', true, 176);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Who is the team principal of Ferrari?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Toto Wolff', false, 177);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Zak Brown', false, 177);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Frederic Vasseur', true, 177);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Christian Horner', false, 177);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('In which team has Sergio Perez never been at?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mclaren', false, 178);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Red Bull', false, 178);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sauber', false, 178);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Williams', true, 178);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('When did Hamilton take his first win for Mercedes?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Malaysia 2014', false, 179);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('China 2014', false, 179);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Great Britian 2013', false, 179);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungary 2013', true, 179);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many championships does a F1 season have?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', false, 180);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', true, 180);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('4', false, 180);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 180);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many points does a Sprint winner get?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('7', false, 181);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('9', false, 181);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('8', true, 181);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('6', false, 181);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Before a race it is always said that the parc ferme is closed. What does it mean?',
        null, 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The car that breaks it gets a fine', false, 182);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A period during the race weekend where a car that breaks the rule gets penalized with a drive-through penalty', false, 182);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A period during the race weekend where a car that breaks the rule gets restarted from the back of the grid', false, 182);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A period during the race weekend when teams are restricted in modifying their cars,
     ensuring fairness and consistency', true, 182);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is the Parc Fermé in Formula 1 and why is it used?',
        'the-cars-in-parc-ferme-after-t.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A rule that requires all cars to maintain the same speed throughout the race', false, 183);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A regulation that limits the number of pit stops a team can make during a race', false, 183);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A regulation that allows teams to practice starts at the end of the pit lane', false, 183);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('A regulation that allows an space in the pit lane for the FIA in order to check if every car complies with the regulations', true, 183);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What happens during the Q1 session?',
        'c1c6dad8-aea4-425d-b9a2-c369f73c27b5_16-9-discover-aspect-ratio_default_0.jpg', 3);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The 15 fastest cars go through to the next session', false, 184);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('The last 5 cars get out of the next session', false, 184);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('All of the above', false, 184);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('None of the above', true, 184);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What is a grand chelem?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('When a driver gets win and pole position in the same race', false, 185);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('When a driver gets win and fastest lap in the same race', false, 185);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('When a driver gets win, fastest lap, pole positions and leads every single lap in the same race', true, 185);


INSERT INTO Answer (name, correct, questionId)
VALUES
    ('When a driver gets win, fastest lap and leads every single lap in the same race', false, 185);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which driver holds the record for the biggest amount of races until he got his first F1 win?',
        '65c504f09bce1cad3dcbba833d8ee852.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Carlos Sainz', false, 186);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jenson Button', false, 186);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Sergio Perez', true, 186);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', false, 186);



INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which is the longest race ever held in F1?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapore GP 2012', false, 187);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Singapore GP 2010', false, 187);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Dallas GP 1984', false, 187);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Canada 2011', true, 187);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many laps does the Monaco GP have?',
        '15274979049260.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('71', false, 188);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('80', false, 188);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('78', true, 188);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('72', false, 188);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('At the 2024 Monaco GP we had 0 overtakes during the race. When was the other time that this happened?',
        'XPB_1282060_HiRes.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Valencia 2009', true, 189);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Dallas 1984', false, 189);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Monaco 2021', false, 189);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Las Vegas 1982', false, 189);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Which race is the shortest one in F1 history?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Australia 1991', false, 190);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Belgium 2021', true, 190);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('South Africa 1979', false, 190);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('France 1972', false, 190);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        '00000224_018-753x494.jpg', 2);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Buenos Aires', false, 191);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungaroring', false, 191);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Magny Cours', true, 191);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fuji', false, 191);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        'Captura de pantalla 2024-08-18 123450.png', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hockenheim', false, 192);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungaroring', false, 192);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Interlagos', false, 192);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', true, 192);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        'british-mclaren-formula-one-racing-team-driver-lewis-news-photo-1650209247.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hockenheim', false, 193);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Hungaroring', false, 193);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Interlagos', true, 193);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Silverstone', false, 193);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the track',
        'salida-gp-espana-jerez-1997.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jarama', false, 194);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jerez', true, 194);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Kyalami', false, 194);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Buenos Aires', false, 194);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many qualifying sessions does F1 have?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', false, 195);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 195);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3', true, 195);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('4', false, 195);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        '1997hidarr03.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', true, 196);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Nigel Mansell', false, 196);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', false, 196);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 196);

INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('Name the driver',
        'a637c951f5abb3d146fc1931d48735df.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Damon Hill', false, 197);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Jacques Villeneuve', false, 197);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('David Coulthard', true, 197);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Mika Hakkinen', false, 197);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many points does a driver get for the fastest lap of a race?',
        null, 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('1', true, 198);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('0', false, 198);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 198);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', false, 198);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('How many different compounds are in F1?',
        'images29.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('3', false, 199);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('2', false, 199);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('5', true, 199);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('4', false, 199);


INSERT INTO Question (name, imagePath, knowledgequestionlevel)
VALUES ('What does the pole position give?',
        'F1-poleposition-Max-Verstappen-Red-Bull-Racing-parc-ferme-Bahrain-Grand-Prix-2023.jpg', 1);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fastest time', false, 200);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('First place for the start of the race', false, 200);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('Fastest time and first place for the start of the race', true, 200);

INSERT INTO Answer (name, correct, questionId)
VALUES
    ('None of the above', false, 200);



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
VALUES ('Bahrein GP', 'First round of the F1 season', '2024-07-05', 'Bahrein', 'formula-1-bahrain-grand-prix-2024-poster_ss5_p-201348077+u-v48ciqjppqwtzj3bi0bp+v-le3rrz5cbcwquxbrgx2q.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Hungarian GP', '13th round of the F1 season', '2024-07-21', 'Hungary', 'FYrYQ9SXoAAR-v6-732x1024.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Belgian GP', '15th round of the F1 season', '2024-07-28', 'Belgium', '517c567d8d6e9f561c4eb73313a8d280.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Dutch GP', '16th round of the F1 season', '2024-08-25', 'Netherlands', 'f768x1-8742_8869_154.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Italian GP', '17th round of the F1 season', '2024-09-01', 'Italy', '6744ae08e6a450e031b21a17e78fc0fa.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Azerbaijan GP', '17th round of the F1 season', '2024-09-15', 'Azerbaijan', 'ahav61hj4goa1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Singapore GP', '18th round of the F1 season', '2024-09-22', 'Singapore', 'singapore-f1-grand-prix-2022-race-poster-2K2RF46.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('USA GP', '19th round of the F1 season', '2024-10-20', 'Texas', 'flat,750x,075,f-pad,750x1000,f8f8f8.u3.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Mexican GP', '20th round of the F1 season', '2024-10-27','Mexico City' ,'0_vae50gfk.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Brazilian GP', '21th round of the F1 season', '2024-11-03', 'Brazil','3db56091204561.5e2b4deb5987d.png');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Las Vegas GP', '22th round of the F1 season', '2024-11-23', 'Las Vegas','il_570xN.5522041097_7lyw.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Qatar GP', '23th round of the F1 season', '2024-12-01', 'Qatar','the-official-poster-for-the-formula-1-qatar-airways-qatar-v0-j0jvcw0rumqb1.jpg');

INSERT INTO Event (name, description, date, location, imageUrl)
VALUES ('Abu Dhabi GP', '24th round of the F1 season', '2024-12-08', 'Abu Dhabi','abu-dhabi-f1-grand-prix-2023-race-poster-2T5R5KF.jpg');
