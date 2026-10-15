ALTER TABLE `attempts` ADD `subtopic` text DEFAULT 'all' NOT NULL;--> statement-breakpoint
CREATE INDEX `attempts_user_started` ON `attempts` (`user_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `attempts_user_status` ON `attempts` (`user_id`,`status`);