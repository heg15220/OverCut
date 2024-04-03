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

INSERT INTO Users(userName, firstName, lastName, password, email, journalist, image)
    VALUES('F1Fan', 'Race', 'Week', 'formula1', 'f1fan@gmail.com', true, NULL);

INSERT INTO Category(name,historic,quiz) VALUES ('Actualidad',false,false);