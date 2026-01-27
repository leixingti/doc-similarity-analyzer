import { getDb } from "./db";
import { users, emailVerifications, type InsertUser, type InsertEmailVerification } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * 根据邮箱查找用户
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  const result = await db!.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * 创建新用户
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<number> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const db = await getDb();
  const result = await db!.insert(users).values({
    email: data.email,
    password: hashedPassword,
    name: data.name || data.email.split('@')[0],
    loginMethod: "email",
    emailVerified: false,
    role: "user",
  });
  
  return Number(result[0].insertId);
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
