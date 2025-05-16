CREATE DATABASE IF NOT EXISTS scp_forum;
USE scp_forum;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    join_date DATETIME NOT NULL,
    last_login DATETIME,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_expires DATETIME,
    ban_reason TEXT,
    is_muted BOOLEAN DEFAULT FALSE,
    mute_expires DATETIME,
    forum_time INT DEFAULT 0,
    rank VARCHAR(50) DEFAULT 'Новичок'
);

CREATE TABLE topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    created_at DATETIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL,
    author_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at DATETIME,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE private_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE TABLE friendships (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    friend_id INT NOT NULL,
    status ENUM('pending', 'accepted') DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
);

-- Создание предустановленного администратора
INSERT INTO users (username, password, email, role, join_date, rank)
VALUES ('WorldPlugin', '$2a$10$YourHashedPasswordHere', 'admin@scp-foundation.org', 'admin', NOW(), 'Директор Фонда'); 