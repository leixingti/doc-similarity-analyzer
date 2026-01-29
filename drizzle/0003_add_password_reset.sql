-- 创建密码重置令牌表
CREATE TABLE IF NOT EXISTS `passwordResetTokens` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `email` varchar(320) NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expiresAt` timestamp NOT NULL,
  `used` boolean DEFAULT false,
  `createdAt` timestamp DEFAULT (now()) NOT NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_token` (`token`)
);
