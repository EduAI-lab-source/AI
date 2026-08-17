CREATE TABLE `encrypted_workspaces` (
	`syncId` varchar(96) NOT NULL,
	`ciphertext` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `encrypted_workspaces_syncId` PRIMARY KEY(`syncId`)
);
