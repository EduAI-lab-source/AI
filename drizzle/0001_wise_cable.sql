CREATE TABLE `conversation_folders` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`color` varchar(32) NOT NULL DEFAULT 'violet',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversation_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversation_messages` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`folderId` varchar(64),
	`title` varchar(240) NOT NULL,
	`preview` text,
	`tags` json NOT NULL,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_activity` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`activityDate` varchar(10) NOT NULL,
	`activityType` varchar(40) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_activity_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_activity_once_per_type_idx` UNIQUE(`userId`,`activityDate`,`activityType`)
);
--> statement-breakpoint
CREATE TABLE `learning_notes` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`conversationId` varchar(64),
	`title` varchar(240) NOT NULL,
	`content` text NOT NULL,
	`tags` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_uploads` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(512) NOT NULL,
	`extractedText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shared_learning_links` (
	`id` varchar(64) NOT NULL,
	`token` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`kind` varchar(32) NOT NULL,
	`title` varchar(240) NOT NULL,
	`snapshot` text NOT NULL,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_learning_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_learning_links_token_idx` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user_learning_preferences` (
	`userId` int NOT NULL,
	`language` varchar(12) NOT NULL DEFAULT 'es',
	`responseStyle` varchar(24) NOT NULL DEFAULT 'deep',
	`weeklyGoal` int NOT NULL DEFAULT 4,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_learning_preferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE INDEX `conversation_folders_user_idx` ON `conversation_folders` (`userId`);--> statement-breakpoint
CREATE INDEX `conversation_messages_thread_created_idx` ON `conversation_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `conversations_owner_updated_idx` ON `conversations` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `conversations_folder_idx` ON `conversations` (`folderId`);--> statement-breakpoint
CREATE INDEX `learning_activity_owner_date_idx` ON `learning_activity` (`userId`,`activityDate`);--> statement-breakpoint
CREATE INDEX `learning_notes_owner_updated_idx` ON `learning_notes` (`userId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `learning_uploads_owner_created_idx` ON `learning_uploads` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `shared_learning_links_owner_created_idx` ON `shared_learning_links` (`userId`,`createdAt`);