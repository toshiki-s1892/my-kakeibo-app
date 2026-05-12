PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_usage_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(50) NOT NULL,
	`feature_code` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_ai_usage_logs`("id", "user_id", "feature_code", "created_at") SELECT "id", "user_id", "feature_code", "created_at" FROM `ai_usage_logs`;--> statement-breakpoint
DROP TABLE `ai_usage_logs`;--> statement-breakpoint
ALTER TABLE `__new_ai_usage_logs` RENAME TO `ai_usage_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(50) NOT NULL,
	`type_code` integer NOT NULL,
	`name` text(50) NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "user_id", "type_code", "name", "created_at") SELECT "id", "user_id", "type_code", "name", "created_at" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE TABLE `__new_family_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text(50) NOT NULL,
	`relationship_code` integer NOT NULL,
	`gender_code` integer NOT NULL,
	`birth_year` integer NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_family_members`("id", "user_id", "relationship_code", "gender_code", "birth_year", "created_at") SELECT "id", "user_id", "relationship_code", "gender_code", "birth_year", "created_at" FROM `family_members`;--> statement-breakpoint
DROP TABLE `family_members`;--> statement-breakpoint
ALTER TABLE `__new_family_members` RENAME TO `family_members`;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text(50) PRIMARY KEY NOT NULL,
	`user_id` text(50) NOT NULL,
	`category_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`transaction_date` text NOT NULL,
	`memo` text(255),
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "user_id", "category_id", "amount", "transaction_date", "memo", "created_at", "updated_at") SELECT "id", "user_id", "category_id", "amount", "transaction_date", "memo", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clerk_id` text NOT NULL,
	`region_code` integer NOT NULL,
	`gender_code` integer NOT NULL,
	`birth_year` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "clerk_id", "region_code", "gender_code", "birth_year", "created_at", "updated_at", "deleted_at") SELECT "id", "clerk_id", "region_code", "gender_code", "birth_year", "created_at", "updated_at", "deleted_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_id_unique` ON `users` (`clerk_id`);