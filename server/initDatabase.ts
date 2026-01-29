import { getDb } from "./db";

/**
 * 初始化数据库表
 * 在应用启动时自动创建缺失的表
 */
export async function initDatabase() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[InitDB] Database connection not available');
      return;
    }

    console.log('[InitDB] Checking database tables...');

    // 创建 passwordResetTokens 表（如果不存在）
    await db.execute(`
      CREATE TABLE IF NOT EXISTS \`passwordResetTokens\` (
        \`id\` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        \`email\` varchar(320) NOT NULL,
        \`token\` varchar(255) NOT NULL UNIQUE,
        \`expiresAt\` timestamp NOT NULL,
        \`used\` boolean DEFAULT false,
        \`createdAt\` timestamp DEFAULT (now()) NOT NULL,
        INDEX \`idx_email\` (\`email\`),
        INDEX \`idx_token\` (\`token\`)
      )
    `);

    console.log('[InitDB] ✓ passwordResetTokens table ready');
    console.log('[InitDB] Database initialization completed successfully');
  } catch (error) {
    console.error('[InitDB] Database initialization failed:', error);
    // 不抛出错误，允许应用继续启动
  }
}
