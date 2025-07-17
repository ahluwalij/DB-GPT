-- Drop existing account table if it exists
DROP TABLE IF EXISTS `account`;

-- Create authentication tables
CREATE TABLE `user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` boolean NOT NULL DEFAULT false,
  `password` varchar(255),
  `image` varchar(500),
  `preferences` json DEFAULT ('{}'),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_email_unique` (`email`)
);

CREATE TABLE `session` (
  `id` varchar(36) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  `ip_address` varchar(45),
  `user_agent` varchar(500),
  `user_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token_unique` (`token`),
  KEY `session_user_id_idx` (`user_id`),
  CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE `account` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(255) NOT NULL,
  `provider_id` varchar(100) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `access_token` varchar(1000),
  `refresh_token` varchar(1000),
  `id_token` varchar(1000),
  `access_token_expires_at` timestamp,
  `refresh_token_expires_at` timestamp,
  `scope` varchar(500),
  `password` varchar(255),
  `created_at` timestamp NOT NULL,
  `updated_at` timestamp NOT NULL,
  PRIMARY KEY (`id`),
  KEY `account_user_id_idx` (`user_id`),
  CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE `verification` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp,
  `updated_at` timestamp,
  PRIMARY KEY (`id`)
);

CREATE TABLE `chat_thread` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `project_id` varchar(36),
  PRIMARY KEY (`id`),
  KEY `chat_thread_user_id_idx` (`user_id`),
  CONSTRAINT `chat_thread_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);

CREATE TABLE `chat_message` (
  `id` varchar(255) NOT NULL,
  `thread_id` varchar(36) NOT NULL,
  `role` varchar(50) NOT NULL,
  `parts` json NOT NULL,
  `attachments` json,
  `annotations` json,
  `model` varchar(100),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `chat_message_thread_id_idx` (`thread_id`),
  CONSTRAINT `chat_message_thread_id_chat_thread_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `chat_thread` (`id`) ON DELETE CASCADE
);

CREATE TABLE `project` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `instructions` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_user_id_idx` (`user_id`),
  CONSTRAINT `project_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
);