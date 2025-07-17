ALTER TABLE `account` MODIFY COLUMN `account_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `provider_id` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `access_token` varchar(1000);--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `refresh_token` varchar(1000);--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `id_token` varchar(1000);--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `scope` varchar(500);--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `chat_message` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_message` MODIFY COLUMN `role` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_message` MODIFY COLUMN `model` varchar(100);--> statement-breakpoint
ALTER TABLE `project` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `token` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `ip_address` varchar(45);--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `user_agent` varchar(500);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `password` varchar(255);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `image` varchar(500);--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `identifier` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `value` varchar(255) NOT NULL;