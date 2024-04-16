DROP TABLE IF EXISTS Answer;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Quiz;
DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS Post;
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

CREATE TABLE Quiz(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    max_length INT DEFAULT 10,
    date DATETIME NOT NULL,
    knowledge_level varchar(20) NOT NULL
);


CREATE TABLE Question(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name LONGTEXT NOT NULL,
    image_path VARCHAR(1024),
    quizId BIGINT,

    CONSTRAINT QuizFK FOREIGN KEY (quizId) REFERENCES Quiz (id) ON DELETE CASCADE
);

CREATE TABLE Answer(
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name LONGTEXT NOT NULL,
    correct BOOLEAN,
    questionId BIGINT NOT NULL,

    CONSTRAINT QuestionFK FOREIGN KEY (questionId) REFERENCES Question (id) ON DELETE CASCADE
);




INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL);


INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Example Post Title', 'Example Post Subtitle', 'This is an example article content.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);


INSERT INTO Question (name, image_path)
VALUES ('¿Cuál es el nombre de esta escuderia?','/static/images/bmwsauberF1-92006586-d799-422b-88d2-fdbc9fac1d9f.jpg');

INSERT INTO Answer (name, correct, questionId) VALUES ('Mercedes AMG Petronas', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toyota', false, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('BMW Sauber', true, 1);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 1);



INSERT INTO Question (name, image_path)
VALUES ('¿En que equipo no ha corrido Nico Hülkenberg?','/static/images/oficial-hulkenberg-sustituye-a-vettel-para-el-gp-de-barein-2cafb8d1-1c37-4975-92e4-eb7e08504aed.jpg');

INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Force India', false, 2);
INSERT INTO Answer (name, correct, questionId) VALUES ('Williams', false, 2);

INSERT INTO Question (name, image_path)
VALUES ('¿Quién no ha corrido nunca para Ferrari?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Felipe Massa', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 3);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', true, 3);


INSERT INTO Question (name, image_path)
VALUES ('¿Qué piloto NO ha pertenecido nunca ha la familia Red Bull? (Red Bull, Toro Rosso/Alpha Tauri, Red Bull Academy)',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Daniel Kvyat', false, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 4);
INSERT INTO Answer (name, correct, questionId) VALUES ('Isack Hadjar', false, 4);


INSERT INTO Question (name, image_path)
VALUES ('¿Que circuito es este?','static/images/images-76ce60ff-33a7-424b-9259-57adc1a37f48.jpg');

INSERT INTO Answer (name, correct, questionId) VALUES  ('Monza', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Imola', true, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Istanbul Park', false, 5);
INSERT INTO Answer (name, correct, questionId) VALUES ('Hungaroring', false, 5);


INSERT INTO Question (name, image_path)
VALUES ('¿Qué 2 pilotos corrieron con este coche?','static/images/images-80a199ac-fb13-44c3-9811-0204b7fcb9a9.jpg');


INSERT INTO Answer (name, correct, questionId) VALUES ('Robert Kubica', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Romain Grosjean', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Nico Hulkenberg', false, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vitaly Petrov', true, 6);
INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 6);

INSERT INTO Question (name, image_path)
VALUES ('¿Quien es el hombre de hielo?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Alonso', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Raikkonen', true, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Niki Lauda', false, 7);
INSERT INTO Answer (name, correct, questionId) VALUES ('Vettel', false, 7);


INSERT INTO Question (name, image_path)
VALUES ('¿En qué escudería no ha estado Fernando Alonso?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Mclaren', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Minardi', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Renault', false, 8);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toro Rosso', true, 8);

INSERT INTO Question (name, image_path)
VALUES ('¿Cuándo se creó la F1?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('1980', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1950', true, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1948', false, 9);
INSERT INTO Answer (name, correct, questionId) VALUES ('1943', false, 9);

INSERT INTO Question (name, image_path)
VALUES ('¿Quien es el Team Principal del equipo Mercedes?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Zak Brown', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Toto Wolff', true, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Christian Horner', false, 10);
INSERT INTO Answer (name, correct, questionId) VALUES ('Andrea Stella', false, 10);

INSERT INTO Question (name, image_path)
VALUES ('¿Quien ganó el mundial del año 2023?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', true, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 11);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sergio Perez', false, 11);

INSERT INTO Question (name, image_path)
VALUES ('En el año 2023, Max Verstappen superó el record de victorias' ||
        'consecutivas que tenía anteriormente Sebastian Vettel. ¿Cual fue esa cifra?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('9', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('10', true, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('8', false, 12);
INSERT INTO Answer (name, correct, questionId) VALUES ('11', false, 12);

INSERT INTO Question (name, image_path)
VALUES ('¿Quien es el piloto con mas carreras disputadas en la historia de la F1?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Kimi Raikkonen', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Michael Schumacher', false, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', true, 13);
INSERT INTO Answer (name, correct, questionId) VALUES ('Rubens Barrichello', false, 13);

INSERT INTO Question (name, image_path)
VALUES ('¿Para que se usa el DRS?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Para tener más aerodinamica', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para reducir el drag', true, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para dar más potencia', false, 14);
INSERT INTO Answer (name, correct, questionId) VALUES ('Para ayudar en la frenada', false, 14);

INSERT INTO Question (name, image_path)
VALUES ('Actualmente, los F1 actuales utlizan motores V6 Turbo híbridos desde el año 2014. ¿Que elemento de los motores ' ||
        'actuales se va a eliminar para el reglamento del año 2026?',null);


INSERT INTO Answer (name, correct, questionId) VALUES ('ICE', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-H', true, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('MGU-K', false, 15);
INSERT INTO Answer (name, correct, questionId) VALUES ('Bateria', false, 15);


INSERT INTO Question (name, image_path)
VALUES ('Ferrari es el equipo mas grande de la historia de la F1. Pero, ¿cuando fue la ultima vez que ganaron el mundial?','static/images/carlos-sainz_1h2hvmfieomji1fks4uq8ylzup.jpg');

INSERT INTO Answer (name, correct, questionId) VALUES ('2010', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2006', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2007', false, 16);
INSERT INTO Answer (name, correct, questionId) VALUES ('2008', true, 16);

INSERT INTO Question (name, image_path)
VALUES ('¿Quien es el piloto más joven en ganar el mundial de F1?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Fernando Alonso', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Lewis Hamilton', false, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sebastian Vettel', true, 17);
INSERT INTO Answer (name, correct, questionId) VALUES ('Max Verstappen', false, 17);

INSERT INTO Question (name, image_path)
VALUES ('¿En qué año ganó Williams su última carrera hasta la fecha?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('2012', true, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2015', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2004', false, 18);
INSERT INTO Answer (name, correct, questionId) VALUES ('2003', false, 18);

INSERT INTO Question (name, image_path)
VALUES ('De los equipos que hay actualmente en la parrilla, ¿cual es el que lleva menos tiempo?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('Racing Bulls', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Sauber', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Alpine', false, 19);
INSERT INTO Answer (name, correct, questionId) VALUES ('Haas', true, 19);

INSERT INTO Question (name, image_path)
VALUES ('¿En qué año ganó Michael Schumacher su primera victoria en F1?',null);

INSERT INTO Answer (name, correct, questionId) VALUES ('1994', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('2000', false, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1992', true, 20);
INSERT INTO Answer (name, correct, questionId) VALUES ('1998', false, 20);


