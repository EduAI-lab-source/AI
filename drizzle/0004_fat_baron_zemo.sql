CREATE TABLE `tts_daily_usage` (
	`visitorHash` varchar(64) NOT NULL,
	`usageDate` varchar(10) NOT NULL,
	`usedCharacters` int NOT NULL DEFAULT 0,
	`requests` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tts_daily_usage_visitor_date_idx` UNIQUE(`visitorHash`,`usageDate`)
);
--> statement-breakpoint
CREATE INDEX `tts_daily_usage_date_idx` ON `tts_daily_usage` (`usageDate`);