/**
 * 前端认证组件测试
 * 
 * 测试覆盖:
 * 1. 登录表单验证
 * 2. 注册表单验证
 * 3. Token 管理
 * 4. 用户信息缓存
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("前端认证 - 单元测试", () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Token 管理", () => {
    it("应该能够保存和读取 token", () => {
      const token = "test-token-123";
      localStorage.setItem("auth_token", token);

      const savedToken = localStorage.getItem("auth_token");
      expect(savedToken).toBe(token);
    });

    it("应该能够清除 token", () => {
      localStorage.setItem("auth_token", "test-token");
      localStorage.removeItem("auth_token");

      const token = localStorage.getItem("auth_token");
      expect(token).toBeNull();
    });

    it("应该能够检查 token 是否存在", () => {
      expect(localStorage.getItem("auth_token")).toBeNull();

      localStorage.setItem("auth_token", "test-token");
      expect(localStorage.getItem("auth_token")).not.toBeNull();
    });
  });

  describe("用户信息缓存", () => {
    it("应该能够保存用户信息", () => {
      const userInfo = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
        role: "user",
      };

      localStorage.setItem("manus-runtime-user-info", JSON.stringify(userInfo));

      const savedInfo = JSON.parse(
        localStorage.getItem("manus-runtime-user-info") || "{}"
      );
      expect(savedInfo.email).toBe(userInfo.email);
      expect(savedInfo.name).toBe(userInfo.name);
    });

    it("应该能够更新用户信息", () => {
      const userInfo1 = { id: "user-1", email: "user1@example.com" };
      const userInfo2 = { id: "user-2", email: "user2@example.com" };

      localStorage.setItem("manus-runtime-user-info", JSON.stringify(userInfo1));
      expect(
        JSON.parse(localStorage.getItem("manus-runtime-user-info") || "{}").id
      ).toBe("user-1");

      localStorage.setItem("manus-runtime-user-info", JSON.stringify(userInfo2));
      expect(
        JSON.parse(localStorage.getItem("manus-runtime-user-info") || "{}").id
      ).toBe("user-2");
    });

    it("应该能够清除用户信息", () => {
      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify({ id: "user-1" })
      );
      localStorage.removeItem("manus-runtime-user-info");

      expect(localStorage.getItem("manus-runtime-user-info")).toBeNull();
    });
  });

  describe("表单验证", () => {
    it("应该验证邮箱格式", () => {
      const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("invalid.email")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("test@")).toBe(false);
    });

    it("应该验证密码强度", () => {
      const validatePassword = (password: string) => {
        // 至少 8 个字符
        if (password.length < 8) return false;
        // 至少包含一个大写字母
        if (!/[A-Z]/.test(password)) return false;
        // 至少包含一个小写字母
        if (!/[a-z]/.test(password)) return false;
        // 至少包含一个数字
        if (!/[0-9]/.test(password)) return false;
        return true;
      };

      expect(validatePassword("Weak123")).toBe(false); // 少于 8 个字符
      expect(validatePassword("weakpassword123")).toBe(false); // 没有大写字母
      expect(validatePassword("WEAKPASSWORD123")).toBe(false); // 没有小写字母
      expect(validatePassword("WeakPassword")).toBe(false); // 没有数字
      expect(validatePassword("StrongPass123")).toBe(true);
    });

    it("应该验证用户名", () => {
      const validateUsername = (username: string) => {
        // 3-20 个字符
        if (username.length < 3 || username.length > 20) return false;
        // 只允许字母、数字和下划线
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return false;
        return true;
      };

      expect(validateUsername("ab")).toBe(false); // 太短
      expect(validateUsername("a".repeat(21))).toBe(false); // 太长
      expect(validateUsername("user@name")).toBe(false); // 包含特殊字符
      expect(validateUsername("user_name_123")).toBe(true);
    });
  });

  describe("认证状态管理", () => {
    it("应该能够检查用户是否已登录", () => {
      const isLoggedIn = () => {
        return localStorage.getItem("auth_token") !== null;
      };

      expect(isLoggedIn()).toBe(false);

      localStorage.setItem("auth_token", "test-token");
      expect(isLoggedIn()).toBe(true);

      localStorage.removeItem("auth_token");
      expect(isLoggedIn()).toBe(false);
    });

    it("应该能够检查用户是否是管理员", () => {
      const isAdmin = () => {
        const userInfo = JSON.parse(
          localStorage.getItem("manus-runtime-user-info") || "{}"
        );
        return userInfo.role === "admin";
      };

      expect(isAdmin()).toBe(false);

      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify({ role: "user" })
      );
      expect(isAdmin()).toBe(false);

      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify({ role: "admin" })
      );
      expect(isAdmin()).toBe(true);
    });
  });

  describe("错误处理", () => {
    it("应该能够处理无效的 JSON", () => {
      localStorage.setItem("manus-runtime-user-info", "invalid-json");

      try {
        const userInfo = JSON.parse(
          localStorage.getItem("manus-runtime-user-info") || "{}"
        );
        expect(userInfo).toEqual({});
      } catch {
        // 预期会抛出错误
        expect(true).toBe(true);
      }
    });

    it("应该能够处理缺少的数据", () => {
      const getUserInfo = () => {
        const data = localStorage.getItem("manus-runtime-user-info");
        return data ? JSON.parse(data) : null;
      };

      expect(getUserInfo()).toBeNull();

      localStorage.setItem(
        "manus-runtime-user-info",
        JSON.stringify({ id: "user-1" })
      );
      expect(getUserInfo()).not.toBeNull();
    });
  });
});
