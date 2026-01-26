CREATE TABLE `analysisResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`overallSimilarity` float NOT NULL,
	`summary` text,
	`details` json,
	`pairwiseResults` json,
	`riskLevel` enum('high','medium','low'),
	`riskDescription` text,
	`recommendations` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysisResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `analysisResults_taskId_unique` UNIQUE(`taskId`)
);
--> statement-breakpoint
CREATE TABLE `analysisTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskName` varchar(255) NOT NULL,
	`documentIds` json NOT NULL,
	`analysisMode` enum('traditional','deepseek') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`overallSimilarity` float,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `analysisTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`extractedText` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `similaritySegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resultId` int NOT NULL,
	`doc1Id` int NOT NULL,
	`doc2Id` int NOT NULL,
	`doc1Segment` text NOT NULL,
	`doc2Segment` text NOT NULL,
	`similarity` float NOT NULL,
	`reason` text,
	`position` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `similaritySegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`similarityThresholds` json NOT NULL,
	`defaultAnalysisMode` enum('traditional','deepseek') NOT NULL DEFAULT 'traditional',
	`autoSaveResults` int NOT NULL DEFAULT 1,
	`emailNotifications` int NOT NULL DEFAULT 0,
	`language` varchar(10) NOT NULL DEFAULT 'zh-CN',
	`theme` enum('light','dark','auto') NOT NULL DEFAULT 'auto',
	`displayOptions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
