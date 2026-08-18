CREATE TABLE `credit_balances` (
	`userId` int NOT NULL,
	`availableCredits` int NOT NULL DEFAULT 0,
	`pendingCredits` int NOT NULL DEFAULT 0,
	`lifetimePurchasedCredits` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_balances_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `credit_ledger` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`change` int NOT NULL,
	`reason` varchar(48) NOT NULL,
	`status` enum('pending','confirmed','reversed') NOT NULL DEFAULT 'pending',
	`provider` varchar(48),
	`providerReference` varchar(191),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_ledger_provider_reference_idx` UNIQUE(`provider`,`providerReference`)
);
--> statement-breakpoint
ALTER TABLE `credit_balances` ADD CONSTRAINT `credit_balances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD CONSTRAINT `credit_ledger_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `credit_ledger_user_created_idx` ON `credit_ledger` (`userId`,`createdAt`);