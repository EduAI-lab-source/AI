CREATE TABLE `account_encrypted_workspaces` (
	`userId` int NOT NULL,
	`ciphertext` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `account_encrypted_workspaces_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `account_encrypted_workspaces` ADD CONSTRAINT `account_encrypted_workspaces_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;