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


INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);

INSERT INTO Category(name,historic,quiz) VALUES ('Quiz', false, true);

INSERT INTO Category(name,historic,quiz) VALUES ('Historia', true, false);

INSERT INTO Category(name,historic,quiz) VALUES ('Anecdotas',false,false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Why Ferrari doesn’t fear its downgrade will derail F1 season ',
    'Ferrari''s recurrence of high-speed bouncing has been triggered by a new floor. The challenge now is finding answers as to why it has not worked. ',
        'The story of Formula 1’s development war in 2024 has been very much about whether car updates fall into the ‘upgrade’ or ‘downgrade’ category.

For some teams, like McLaren, Mercedes and Haas, each new iteration appears to be delivering the steps hoped to help push them forward.

For others – like Aston Martin, RB and Ferrari – new parts have led to some unintended consequences and left them not only facing competitive challenges but an urgency to get to the bottom of what has gone wrong.

In Ferrari’s case, its issue appears to revolve around a new floor that arrived as part of a Spanish Grand Prix upgrade.

While the new parts delivered more downforce, especially in the low-speed corners, one consequence was it helped trigger the return of bouncing in fast turns – something which has hampered the squad in recent races.

At last weekend’s British Grand Prix, Ferrari conducted a floor comparison across both cars to work out which solution was best – and in the end opted to roll back its floor to the Imola spec.
Top Videos

While that move proved best for the short term in giving Carlos Sainz and Charles Leclerc the best hope for the Silverstone weekend, moving forward the team clearly needs a more permanent solution.
Carlos Sainz, Ferrari SF-24

Carlos Sainz, Ferrari SF-24

Photo by: Erik Junius

But, more critical than that, is in getting an understanding of why what has been delivered to the track is not what was expected – because until it has that answer then it cannot hope to make any more progress.

As Mercedes technical director James Allison talked about earlier in the year, if an ‘upgrade’ proves to be a ‘downgrade’ then the consequences can be huge.

“That makes life hard because the moment you stop trusting your tools, you have to backtrack and you lose loads of time,” said Allison. “Time is your biggest friend, losing it your worst enemy.”

It is a situation not lost on Ferrari team principal Fred Vasseur, but there is no sense that he fears the Maranello squad cannot turn things around to get back in the fight at the front.

That confidence is based on the fact that, 12 months ago, Ferrari appeared to be going through an exact same scenario, where updates were not delivering all that had been hoped for and the team needed some understanding of what had gone wrong.
Charles Leclerc, Ferrari SF-23,Carlos Sainz, Ferrari SF-23

Charles Leclerc, Ferrari SF-23,Carlos Sainz, Ferrari SF-23

Photo by: Erik Junius

The breakthrough came at the Dutch Grand Prix when Ferrari elected to sacrifice its weekend preparations in favour of what was effectively a single-day test to focus entirely on car experiments.

It is why he thinks the call to split floors across the cars at Silverstone, even if it meant a potential hit to hopes for the British GP, was the right thing to do to kick start its understanding of what was going on.

"I think we had exactly the same situation last year, almost at the same stage of the season - Silverstone, Budapest and Spa,” he said.

“We stopped it at Zandvoort, had a good scan of the situation and had a good recovery because the weeks after, we were there.

“What is tough in this situation is you don''t have tests, proper tests, to fix it or to at least understand it. It is very difficult as a team to compromise or sacrifice Friday sessions when you know you are losing time during the weekend and say ok, lets forget about FP1, FP2 and focus on the mid-term.

“Trust me, this decision as a team is difficult because you start the weekend - and it was even worse at Silverstone with the weather - and it means you put yourself in a tough situation.

“But this we knew before, but it was even worse that Saturday morning was with wet tyres, but it is like it is. We assumed the decision before the weekend, and I think it was the right call to do it.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);


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
INSERT INTO Answer (name, correct, questionId) VALUES ('Kamui Kobayashi', true, 6);
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
VALUES ('In which year did Michael Schumacher win his first F1 victory?', null, 2);

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
VALUES ('Who holds the record for the most Formula 1 race wins?', null, 2);

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

INSERT INTO Answer (name, correct, questionId) VALUES ('Enzo Ferrari', true, 34);
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
VALUES('Max Verstappen', '2024', 'Red Bull', 'Lando Norris', 'Sergio Perez', 'lewis_hamilton_2019_china.jpg', 5);

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
VALUES('Daniel Ricciardo', '2021', 'Mclaren','Lando Norris','Valtteri Bottas', 'CRÓNICA-GP-DE-ITALIA-F1-2021.jpg', 16);

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
VALUES('Daniel Ricciardo', '2017', 'Red Bull','Valtteri Bottas','Lance Stroll', 'daniel-ricciardo-red-bull-racing-azerbaiyán-f1-gran-premio-ganador.jpg', 17);

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
VALUES('Max Verstappen', '2022', 'Red Bull','Lewis Hamilton','Charles Leclerc', 'images13.jpg', 19);

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
VALUES('Max Verstappen', '2022', 'Red Bull','Charles Leclerc','Sergio Perez', 'images.15jpg', 24);

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

