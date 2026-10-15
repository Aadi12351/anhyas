CREATE TABLE `account_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`device` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_account` ON `account_sessions` (`account_id`);--> statement-breakpoint
CREATE TABLE `auth_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT 0 NOT NULL,
	`provider_user_id` text,
	`password_hash` text,
	`recovery_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_owner_id_unique` ON `user_accounts` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_email_unique` ON `user_accounts` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_accounts_provider_user_id_unique` ON `user_accounts` (`provider_user_id`);--> statement-breakpoint
ALTER TABLE `profiles` ADD `daily_target` integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE `profiles` ADD `target_date` text;