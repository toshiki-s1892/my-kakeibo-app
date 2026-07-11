CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
ALTER TABLE `__new_transactions` RENAME TO `transactions`;