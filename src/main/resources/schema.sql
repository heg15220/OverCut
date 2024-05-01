DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS Post;
DROP TABLE IF EXISTS Podium;
DROP TABLE IF EXISTS Circuit;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userName VARCHAR(60) NOT NULL,
    firstName VARCHAR(60) NOT NULL,
    lastName VARCHAR(60),
    password VARCHAR(60) NOT NULL,
    email VARCHAR(60) NOT NULL,
    journalist BOOLEAN DEFAULT FALSE,
    image BLOB
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

CREATE TABLE Circuit(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    distance BIGINT NOT NULL,
    numberLaps BIGINT NOT NULL,
    teamSuccess VARCHAR(120) NOT NULL,
    image varbinary(max),
    categoryId BIGINT NOT NULL,
    CONSTRAINT CategoryIdCircuitMapFK FOREIGN KEY (categoryId) REFERENCES Category (id) ON DELETE CASCADE
);

CREATE TABLE Podium(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    winner LONGTEXT NOT NULL,
    teamWinner LONGTEXT NOT NULL,
    secondPlace LONGTEXT,
    thirdPlace LONGTEXT,
    image varbinary(max),
    circuitId BIGINT NOT NULL,
    CONSTRAINT CircuitIdPodiumFK FOREIGN KEY (circuitId) REFERENCES Circuit (id) ON DELETE CASCADE
);




INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL);


INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);

INSERT INTO Category(name,historic,quiz) VALUES ('Historia', true, false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Example Post Title', 'Example Post Subtitle', 'This is an example article content.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);

INSERT INTO Circuit(distance, numberLaps, teamSuccess, image, categoryId)
VALUES(5412,57,'Ferrari', '/static/images/Bahrain_Circuit.jpg',2);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', 'RedBull','Perez','Sainz',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Max Verstappen', 'RedBull','Perez','Alonso',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Charles Leclerc', 'Ferrari','Sainz','Hamilton',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', 'Verstappen','Bottas','Mercedes',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', 'Verstappen','Albon','Mercedes',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis Hamilton', 'Bottas','Leclerc','Mercedes',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', 'Bottas','Hamilton','Ferrari',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Sebastian Vettel', 'Hamilton','Bottas','Ferrari',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Nico Rosberg', 'Raikkonen','Hamilton','Mercedes',null,1);

INSERT INTO Podium(winner, teamWinner, secondPlace, thirdPlace, image,circuitId)
VALUES('Lewis  Hamilton', 'Raikkonen','Rosberg','Mercedes', null, 1);