DROP TABLE IF EXISTS debate_message;
DROP TABLE IF EXISTS debate_room_participant;
DROP TABLE IF EXISTS debate_room;
DROP TABLE IF EXISTS debate_daily_seed;
DROP TABLE IF EXISTS debate_opinion;


CREATE TABLE debate_opinion (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(10) NOT NULL,
  debate_day DATE NOT NULL,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(60) NOT NULL,
  text VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT uq_opinion_day_user_scope UNIQUE(debate_day, user_id, scope)
);

CREATE TABLE debate_daily_seed (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(10) NOT NULL,
  debate_day DATE NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT uq_seed_day_scope UNIQUE(debate_day, scope)
);


CREATE TABLE debate_room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(10) NOT NULL,
  debate_day DATE NOT NULL,

  opinion_id BIGINT NOT NULL,
  topic VARCHAR(255) NOT NULL,

  status VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  join_deadline TIMESTAMP NOT NULL,
  poll_deadline TIMESTAMP NULL,
  live_deadline TIMESTAMP NULL,

  CONSTRAINT fk_room_opinion FOREIGN KEY (opinion_id) REFERENCES debate_opinion(id) ON DELETE CASCADE
);

CREATE TABLE debate_room_participant (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(60) NOT NULL,

  joined_at TIMESTAMP NOT NULL,
  poll_answer VARCHAR(5) NULL,
  poll_answered_at TIMESTAMP NULL,

  CONSTRAINT uq_room_user UNIQUE(room_id, user_id),
  CONSTRAINT fk_part_room FOREIGN KEY (room_id) REFERENCES debate_room(id) ON DELETE CASCADE
);

CREATE TABLE debate_message (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  user_name VARCHAR(60) NOT NULL,
  text VARCHAR(400) NOT NULL,
  created_at TIMESTAMP NOT NULL,

  CONSTRAINT fk_msg_room FOREIGN KEY (room_id) REFERENCES debate_room(id) ON DELETE CASCADE
);

CREATE INDEX ix_msg_room_created ON debate_message(room_id, created_at);
CREATE INDEX ix_msg_created ON debate_message(created_at);

