DROP TABLE IF EXISTS debate_room_participant;
DROP TABLE IF EXISTS debate_room;

CREATE TABLE debate_room (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  scope VARCHAR(10) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  join_deadline TIMESTAMP NOT NULL,
  poll_deadline TIMESTAMP NULL,
  live_deadline TIMESTAMP NULL
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
