CREATE TABLE `creator_suggestions` (
	`id` varchar(64) NOT NULL,
	`senderName` varchar(80) NOT NULL,
	`message` text NOT NULL,
	`visitorHash` varchar(64) NOT NULL,
	`ownerNotified` boolean NOT NULL DEFAULT false,
	`emailDelivered` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creator_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `creator_suggestions_created_idx` ON `creator_suggestions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `creator_suggestions_visitor_created_idx` ON `creator_suggestions` (`visitorHash`,`createdAt`);