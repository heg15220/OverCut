DROP TABLE IF EXISTS Comment;
DROP TABLE IF EXISTS UserNotification;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Event;
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
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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



INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL);


INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);

INSERT INTO Post (title, subtitle, article, creationDate, userId, categoryId)
VALUES ('Example Post Title', 'Example Post Subtitle', 'This is an example article content.', NOW(), 1, 1);


INSERT INTO Comment (content, userId,parent_comment, postId)
VALUES ('This is a comment.', 1, NULL, 1);

INSERT INTO Event (name,description,date,location,imageUrl) VALUES ('Bahrein GP', 'First round of the F1 season','2025-03-05','Bahrein',null);