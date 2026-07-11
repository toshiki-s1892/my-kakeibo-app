PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_family_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text(50) NOT NULL,
	`relationship_code` integer NOT NULL,
	`gender_code` integer NOT NULL,
	`birthday` integer NOT NULL,
	`created_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_family_members`("id", "user_id", "name", "relationship_code", "gender_code", "birthday", "created_at", "deleted_at") SELECT "id", "user_id", "name", "relationship_code", "gender_code", "birthday", "created_at", "deleted_at" FROM `family_members`;--> statement-breakpoint
DROP TABLE `family_members`;--> statement-breakpoint
ALTER TABLE `__new_family_members` RENAME TO `family_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`family_member_id` text NOT NULL,
	`category_id` text NOT NULL,
	`amount` integer NOT NULL,
	`transaction_date` text NOT NULL,
	`memo` text(255),
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`family_member_id`) REFERENCES `family_members`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "user_id", "family_member_id", "category_id", "amount", "transaction_date", "memo", "created_at", "updated_at") SELECT "id", "user_id", "family_member_id", "category_id", "amount", "transaction_date", "memo", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;