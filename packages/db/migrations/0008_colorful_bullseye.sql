CREATE TABLE `ai_advice_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `ai_advice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_advice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `category_pins` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_pins_idx` ON `category_pins` (`user_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `recurring_transaction_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recurring_transaction_id` text NOT NULL,
	`generated_transaction_id` text,
	`scheduled_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`recurring_transaction_id`) REFERENCES `recurring_transactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`generated_transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_transaction_log_idx` ON `recurring_transaction_logs` (`recurring_transaction_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `recurring_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`family_member_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` integer NOT NULL,
	`frequency_code` integer NOT NULL,
	`recurring_month` integer,
	`recurring_day` integer NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer,
	`description` text(255),
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`family_member_id`) REFERENCES `family_members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction_parties` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type_code` integer NOT NULL,
	`name` text(50) NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_usage_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`feature_code` integer NOT NULL,
	`family_member_id` text,
	`content` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`family_member_id`) REFERENCES `family_members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_ai_usage_logs`("id", "user_id", "feature_code", "family_member_id", "content", "created_at") SELECT "id", "user_id", "feature_code", "family_member_id", "content", "created_at" FROM `ai_usage_logs`;--> statement-breakpoint
DROP TABLE `ai_usage_logs`;--> statement-breakpoint
ALTER TABLE `__new_ai_usage_logs` RENAME TO `ai_usage_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX "category_pins_idx";--> statement-breakpoint
DROP INDEX "recurring_transaction_log_idx";--> statement-breakpoint
DROP INDEX "users_clerk_id_unique";--> statement-breakpoint
ALTER TABLE `categories` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);--> statement-breakpoint
ALTER TABLE `categories` ADD `icon` text NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `color` text NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `parent_id` text REFERENCES categories(id);--> statement-breakpoint
ALTER TABLE `categories` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `categories` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `family_members` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `family_members` ADD `updated_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ALTER COLUMN "transaction_date" TO "transaction_date" text;--> statement-breakpoint
ALTER TABLE `transactions` ALTER COLUMN "created_at" TO "created_at" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ALTER COLUMN "updated_at" TO "updated_at" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `description` text(255);--> statement-breakpoint
ALTER TABLE `transactions` ADD `party_id` text REFERENCES transaction_parties(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `source_recurring_transaction_id` text REFERENCES recurring_transactions(id);--> statement-breakpoint
ALTER TABLE `transactions` DROP COLUMN `memo`;