import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserByEmail,
  createUser,
  verifyPassword,
  generateVerificationCode,
  createEmailVerification,
  verifyEmailCode,
} from "./authDb";
import { sendVerificationEmail } from "./email";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

/**
 * 用户管理路由
 */
export const userManagementRouter = router({
  /**
   * 发送邮箱验证码
   */
  sendVerificationCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      // 生成6位验证码
      const code = generateVerificationCode();
      
      // 保存到数据库
      await createEmailVerification(input.email, code);
      
      // 发送邮件
      const sent = await sendVerificationEmail(input.email, code);
      
      if (!sent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "验证码发送失败，请稍后重试",
        });
      }
      
      return { success: true, message: "验证码已发送到您的邮箱" };
    }),

  /**
   * 用户注册
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(6),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      // 验证验证码
      const isCodeValid = await verifyEmailCode(input.email, input.code);
      if (!isCodeValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "验证码错误或已过期",
        });
      }

      // 检查邮箱是否已存在
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "该邮箱已被注册",
        });
      }
      
      const userId = await createUser({
        email: input.email,
        name: input.name,
        password: input.password,
      });
      
      // 注册成功后自动登录
      const user = await getUserByEmail(input.email);
      
      // 生成JWT token
      const token = jwt.sign(
        { userId: user!.id, email: user!.email, role: user!.role },
        ENV.cookieSecret,
        { expiresIn: "7d" }
      );
      
      return {
        token,
        user: {
          id: user!.id,
          email: user!.email,
          name: user!.name,
          role: user!.role,
          mustChangePassword: user!.mustChangePassword,
        },
      };
    }),

  /**
   * 邮箱+密码登录
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      const user = await getUserByEmail(input.email);
      
      if (!user || !user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }
      
      const isValid = await verifyPassword(input.password, user.password);
      
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "邮箱或密码错误",
        });
      }
      
      // 更新最后登录时间
      const db = await getDb();
      await db!
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));
      
      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        ENV.cookieSecret,
        { expiresIn: "7d" }
      );
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      };
    }),

  /**
   * 获取所有用户（管理员权限）
   */
  listUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "需要管理员权限",
      });
    }
    
    const db = await getDb();
    const allUsers = await db!.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      emailVerified: users.emailVerified,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users);
    
    return allUsers;
  }),

  /**
   * 创建新用户（管理员权限）
   */
  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "需要管理员权限",
        });
      }
      
      // 检查邮箱是否已存在
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "该邮箱已被注册",
        });
      }
      
      const userId = await createUser({
        email: input.email,
        name: input.name,
        password: input.password,
      });
      
      return { success: true, userId };
    }),

  /**
   * 删除用户（管理员权限）
   */
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "需要管理员权限",
        });
      }
      
      // 不能删除自己
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不能删除自己的账户",
        });
      }
      
      const db = await getDb();
      await db!.delete(users).where(eq(users.id, input.userId));
      
      return { success: true };
    }),

  /**
   * 修改密码
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        oldPassword: z.string().optional(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const [user] = await db!
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id));
      
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }
      
      // 如果不是首次修改密码，需要验证旧密码
      if (!user.mustChangePassword && input.oldPassword) {
        if (!user.password) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "账户未设置密码",
          });
        }
        
        const isValid = await verifyPassword(input.oldPassword, user.password);
        if (!isValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "旧密码错误",
          });
        }
      }
      
      // 更新密码
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await db!
        .update(users)
        .set({
          password: hashedPassword,
          mustChangePassword: false,
        })
        .where(eq(users.id, ctx.user.id));
      
      return { success: true };
    }),

  /**
   * 重置用户密码（管理员权限）
   */
  resetUserPassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "需要管理员权限",
        });
      }
      
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      const dbInstance = await getDb();
      await dbInstance!
        .update(users)
        .set({
          password: hashedPassword,
          mustChangePassword: true, // 重置后需要用户修改密码
        })
        .where(eq(users.id, input.userId));
      
      return { success: true };
    }),
});
