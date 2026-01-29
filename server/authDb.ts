import { getDb } from "./db";
import { users, emailVerifications, passwordResetTokens, type InsertUser, type InsertEmailVerification, type InsertPasswordResetToken } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * 根据邮箱查找用户
 */
export async function getUserByEmail(email: string) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[authDb] Database not available');
      return null;
    }
    
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('[authDb] Error in getUserByEmail:', error);
    throw error;
  }
}

/**
 * 创建新用户
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<number> {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }
    
    const result = await db.insert(users).values({
      email: data.email,
      password: hashedPassword,
      name: data.name || data.email.split('@')[0],
      loginMethod: "email",
      emailVerified: false,
      role: "user",
    });
    
    return Number(result[0].insertId);
  } catch (error) {
    console.error('[authDb] Error in createUser:', error);
    throw error;
  }
}

/**
 * 验证密码
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * 创建邮箱验证码
 */
export async function createEmailVerification(email: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期
  
  const db = await getDb();
  await db!.insert(emailVerifications).values({
    email,
    code,
    expiresAt,
    verified: false,
  });
}

/**
 * 验证邮箱验证码
 */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const db = await getDb();
  const verifications = await db!
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, email),
        eq(emailVerifications.code, code),
        eq(emailVerifications.verified, false),
        gt(emailVerifications.expiresAt, new Date())
      )
    )
    .orderBy(emailVerifications.createdAt)
    .limit(1);
  
  const verification = verifications.length > 0 ? verifications[0] : null;
  
  if (!verification) {
    return false;
  }
  
  // 标记为已验证
  await db!
    .update(emailVerifications)
    .set({ verified: true })
    .where(eq(emailVerifications.id, verification.id));
  
  // 更新用户的emailVerified状态
  await db!
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, email));
  
  return true;
}

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 创建密码重置令牌
 */
export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟后过期
  
  const db = await getDb();
  await db!.insert(passwordResetTokens).values({
    email,
    token,
    expiresAt,
    used: false,
  });
  
  return token;
}

/**
 * 验证密码重置令牌
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const db = await getDb();
  const tokens = await db!
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);
  
  const resetToken = tokens.length > 0 ? tokens[0] : null;
  
  if (!resetToken) {
    return null;
  }
  
  return resetToken.email;
}

/**
 * 标记密码重置令牌为已使用
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  const db = await getDb();
  await db!
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.token, token));
}

/**
 * 重置用户密码
 */
export async function resetUserPassword(email: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const db = await getDb();
  await db!
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));
}

/**
 * 生成密码重置令牌（UUID格式）
 */
function generateResetToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
