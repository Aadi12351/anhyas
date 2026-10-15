CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` text NOT NULL,
	`difficulty` text NOT NULL,
	`started_at` integer NOT NULL,
	`deadline` integer NOT NULL,
	`status` text NOT NULL,
	`questions` text NOT NULL,
	`answers` text NOT NULL,
	`timings` text NOT NULL,
	`result` text
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`goal` text NOT NULL,
	`created_at` integer NOT NULL
);
