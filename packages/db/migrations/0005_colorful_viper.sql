ALTER TABLE `transactions` ADD `family_member_id` integer NOT NULL REFERENCES family_members(id);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `gender_code`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `birth_year`;