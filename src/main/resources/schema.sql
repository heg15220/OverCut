DROP TABLE IF EXISTS TikiTakaCell;
DROP TABLE IF EXISTS TikiTakaCriteria;
DROP TABLE IF EXISTS TikiTakaGame;
DROP TABLE IF EXISTS MinigameQuestion;
DROP TABLE IF EXISTS Minigame;
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
DROP TABLE IF EXISTS QuizCategoryTranslation;
DROP TABLE IF EXISTS QuizCategory;
DROP TABLE IF EXISTS QuizTypeTranslation;
DROP TABLE IF EXISTS QuizType;
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


CREATE TABLE QuizType (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code ENUM('Stats', 'Regulations', 'Pictures', 'Strategy', 'Physics') NOT NULL UNIQUE,
    imagePath VARCHAR(255)
);

CREATE TABLE QuizTypeTranslation (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quizTypeId BIGINT NOT NULL,
    language VARCHAR(5) NOT NULL, -- e.g. 'es', 'en', 'fr'
    name VARCHAR(100) NOT NULL,

    CONSTRAINT QuizTypeFK FOREIGN KEY (quizTypeId) REFERENCES QuizType(id) ON DELETE CASCADE,
    CONSTRAINT UniqueQuizTypeLang UNIQUE (quizTypeId, language)
);

CREATE TABLE QuizCategory (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code ENUM(
        'Scores', 'Penalty', 'Driver', 'Team', 'LegendarySeason',
        'Duels', 'Circuit', 'GenericStats', 'Procedures', 'ParcFerme',
        'Safety', 'Tyres', 'SafetyCar', 'Qualifying', 'Sprint',
        'RedFlag', 'Drivers', 'Technical', 'PracticalCase', 'DescriptiveImages', 'RaceStrategy', 'F1Physics'
    ) NOT NULL,
    quizTypeId BIGINT NOT NULL,
    CONSTRAINT QuizCategoryFK FOREIGN KEY (quizTypeId) REFERENCES QuizType(id) ON DELETE CASCADE,
    CONSTRAINT UniqueQuizTypeCategory UNIQUE (quizTypeId, code)
);

CREATE TABLE QuizCategoryTranslation (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quizCategoryId BIGINT NOT NULL,
    language VARCHAR(5) NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT QuizCategoryTranslationFK FOREIGN KEY (quizCategoryId) REFERENCES QuizCategory(id) ON DELETE CASCADE,
    CONSTRAINT UniqueQuizCategoryLang UNIQUE (quizCategoryId, language)
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
ALTER TABLE Question ADD COLUMN quizCategoryId BIGINT;

ALTER TABLE Question ADD CONSTRAINT QuestionQuizCategoryFK
    FOREIGN KEY (quizCategoryId) REFERENCES QuizCategory(id);

ALTER TABLE Question
ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'es';

-- Índice combinado por categoría e idioma
CREATE INDEX idx_question_category_language
ON Question (quizCategoryId, language);



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

ALTER TABLE Answer
ADD COLUMN language VARCHAR(5) DEFAULT NULL;

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

CREATE TABLE Minigame (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL
);

CREATE TABLE MinigameQuestion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    minigameId BIGINT NOT NULL,
    statement VARCHAR(255),
    answer VARCHAR(100) NOT NULL,
    language VARCHAR(5) NOT NULL,
    category VARCHAR(50),
    FOREIGN KEY (minigameId) REFERENCES Minigame(id)
);

CREATE TABLE TikiTakaGame (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    playerX VARCHAR(255),
    playerO VARCHAR(255),
    currentTurn VARCHAR(1),
    status VARCHAR(20),
    createdAt TIMESTAMP
);

CREATE TABLE TikiTakaCell (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gameId BIGINT,
    rowGame BIGINT,
    columnGame BIGINT,
    filledBy VARCHAR(1),
    piloto VARCHAR(255),
    isValid BOOLEAN,
    FOREIGN KEY (gameId) REFERENCES TikiTakaGame(id)
);

CREATE TABLE TikiTakaCriteria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    gameId BIGINT NOT NULL,
    axis VARCHAR(10),
    positionGame INT,
    description VARCHAR(255),
    code VARCHAR(50),
    FOREIGN KEY (gameId) REFERENCES TikiTakaGame(id) ON DELETE CASCADE
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

