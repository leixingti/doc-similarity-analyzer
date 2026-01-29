import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, ne, and, sql } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import bcrypt from "bcryptjs";

/**
 * 管理员管理路由
 * 提供用户管理、权限管理等功能
 */
export const adminManagementRouter = router({
  /**
   * 获取所有用户列表（仅管理员）
   */
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "数据库连接失败",
      });
    }

    // 检查当前用户是否为管理员
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "权限不足，仅管理员可访问",
      });
    }

    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users);

    return allUsers;
  }),

  /**
   * 创建新用户（仅管理员）
   */
  createUser: protectedProcedure
    .input(
      z.object({
        email: z.string().email("邮箱格式不正确"),
        name: z.string().min(1, "用户名不能为空"),
        password: z.string().min(6, "密码至少需要6个字符"),
        role: z.enum(["user", "admin"]).default("user"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库连接失败",
        });
      }

      // 检查当前用户是否为管理员
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "权限不足，仅管理员可创建用户",
        });
      }

      // 检查邮箱是否已存在
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "该邮箱已被注册",
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // 创建用户
      const [newUser] = await db.insert(users).values({
        email: input.email,
        name: input.name,
        password: hashedPassword,
        role: input.role,
        loginMethod: "email",
        emailVerified: true, // 管理员创建的用户默认已验证
        mustChangePassword: true, // 首次登录需要修改密码
      });

      return {
        success: true,
        message: "用户创建成功",
        userId: newUser.insertId,
      };
    }),

  /**
   * 更新用户信息（仅管理员）
   */
  updateUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string().min(1, "用户名不能为空").optional(),
        email: z.string().email("邮箱格式不正确").optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库连接失败",
        });
      }

      // 检查当前用户是否为管理员
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "权限不足，仅管理员可修改用户信息",
        });
      }

      // 检查目标用户是否存在
      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (targetUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 如果修改邮箱，检查新邮箱是否已被使用
      if (input.email && input.email !== targetUser[0].email) {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "该邮箱已被其他用户使用",
          });
        }
      }

      // 更新用户信息
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.role) updateData.role = input.role;

      await db.update(users).set(updateData).where(eq(users.id, input.userId));

      return {
        success: true,
        message: "用户信息更新成功",
      };
    }),

  /**
   * 删除用户（仅管理员）
   */
  deleteUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库连接失败",
        });
      }

      // 检查当前用户是否为管理员
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "权限不足，仅管理员可删除用户",
        });
      }

      // 不能删除自己
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不能删除自己的账号",
        });
      }

      // 检查目标用户是否存在
      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (targetUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 如果要删除的是管理员，检查是否至少还有一个管理员
      if (targetUser[0].role === "admin") {
        const adminCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.role, "admin"));

        if (adminCount[0].count <= 1) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "不能删除最后一个管理员账号",
          });
        }
      }

      // 删除用户
      await db.delete(users).where(eq(users.id, input.userId));

      return {
        success: true,
        message: "用户删除成功",
      };
    }),

  /**
   * 重置用户密码（仅管理员）
   */
  resetUserPassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(6, "密码至少需要6个字符"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "数据库连接失败",
        });
      }

      // 检查当前用户是否为管理员
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "权限不足，仅管理员可重置用户密码",
        });
      }

      // 检查目标用户是否存在
      const targetUser = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (targetUser.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }

      // 加密新密码
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // 更新密码，并要求用户下次登录时修改密码
      await db
        .update(users)
        .set({
          password: hashedPassword,
          mustChangePassword: true,
        })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: "密码重置成功，用户下次登录时需要修改密码",
      };
    }),

  /**
   * 获取用户统计信息（仅管理员）
   */
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "数据库连接失败",
      });
    }

    // 检查当前用户是否为管理员
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "权限不足，仅管理员可访问",
      });
    }

    // 总用户数
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // 管理员数量
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    // 普通用户数量
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "user"));

    // 已验证邮箱的用户数量
    const verifiedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.emailVerified, true));

    return {
      totalUsers: totalUsers[0].count,
      adminCount: adminCount[0].count,
      userCount: userCount[0].count,
      verifiedCount: verifiedCount[0].count,
    };
  }),
});
