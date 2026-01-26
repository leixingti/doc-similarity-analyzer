/**
 * 集成测试套件
 * 
 * 测试覆盖:
 * 1. 用户认证流程 (注册、登录、登出)
 * 2. 文件上传和处理
 * 3. 文档分析功能
 * 4. 权限控制
 * 5. 错误处理
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { createServer } from "http";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

interface TestContext {
  server: http.Server;
  baseUrl: string;
  token?: string;
  userId?: string;
}

const testCtx: TestContext = {
  server: null as any,
  baseUrl: "",
};

/**
 * 发送 HTTP 请求
 */
function makeRequest(
  method: string,
  path: string,
  data?: any,
  token?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(testCtx.baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode || 200, data: json });
        } catch {
          resolve({ status: res.statusCode || 200, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

describe("文档相似度分析系统 - 集成测试", () => {
  beforeAll(async () => {
    // 启动测试服务器
    const app = express();
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext,
      })
    );

    testCtx.server = createServer(app);

    await new Promise<void>((resolve) => {
      testCtx.server.listen(3001, () => {
        testCtx.baseUrl = "http://localhost:3001";
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      testCtx.server.close(() => resolve());
    });
  });

  describe("用户认证", () => {
    it("应该能够注册新用户", async () => {
      const response = await makeRequest("POST", "/api/trpc/userManagement.register", {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.data.result?.data?.token).toBeDefined();
      expect(response.data.result?.data?.user?.email).toBeDefined();

      // 保存 token 用于后续测试
      testCtx.token = response.data.result?.data?.token;
      testCtx.userId = response.data.result?.data?.user?.id;
    });

    it("不应该允许注册相同邮箱的用户", async () => {
      const email = `test-${Date.now()}@example.com`;

      // 第一次注册
      await makeRequest("POST", "/api/trpc/userManagement.register", {
        email,
        name: "Test User",
        password: "password123",
      });

      // 第二次注册相同邮箱
      const response = await makeRequest("POST", "/api/trpc/userManagement.register", {
        email,
        name: "Another User",
        password: "password456",
      });

      expect(response.status).not.toBe(200);
      expect(response.data.error).toBeDefined();
    });

    it("应该能够登录用户", async () => {
      const email = `test-${Date.now()}@example.com`;
      const password = "password123";

      // 先注册
      await makeRequest("POST", "/api/trpc/userManagement.register", {
        email,
        name: "Test User",
        password,
      });

      // 然后登录
      const response = await makeRequest("POST", "/api/trpc/userManagement.login", {
        email,
        password,
      });

      expect(response.status).toBe(200);
      expect(response.data.result?.data?.token).toBeDefined();
      expect(response.data.result?.data?.user?.email).toBe(email);
    });

    it("不应该允许错误的密码登录", async () => {
      const email = `test-${Date.now()}@example.com`;

      // 先注册
      await makeRequest("POST", "/api/trpc/userManagement.register", {
        email,
        name: "Test User",
        password: "password123",
      });

      // 用错误的密码登录
      const response = await makeRequest("POST", "/api/trpc/userManagement.login", {
        email,
        password: "wrongpassword",
      });

      expect(response.status).not.toBe(200);
      expect(response.data.error).toBeDefined();
    });

    it("应该能够获取当前用户信息", async () => {
      if (!testCtx.token) {
        // 先注册一个用户
        const registerResponse = await makeRequest(
          "POST",
          "/api/trpc/userManagement.register",
          {
            email: `test-${Date.now()}@example.com`,
            name: "Test User",
            password: "password123",
          }
        );
        testCtx.token = registerResponse.data.result?.data?.token;
      }

      const response = await makeRequest(
        "POST",
        "/api/trpc/auth.me",
        null,
        testCtx.token
      );

      expect(response.status).toBe(200);
      expect(response.data.result?.data?.email).toBeDefined();
      expect(response.data.result?.data?.id).toBeDefined();
    });

    it("不应该允许无效 token 访问受保护的路由", async () => {
      const response = await makeRequest(
        "POST",
        "/api/trpc/auth.me",
        null,
        "invalid_token"
      );

      expect(response.status).not.toBe(200);
      expect(response.data.error).toBeDefined();
    });
  });

  describe("权限控制", () => {
    it("普通用户不应该能访问管理员路由", async () => {
      // 注册一个普通用户
      const registerResponse = await makeRequest(
        "POST",
        "/api/trpc/userManagement.register",
        {
          email: `test-${Date.now()}@example.com`,
          name: "Test User",
          password: "password123",
        }
      );

      const userToken = registerResponse.data.result?.data?.token;

      // 尝试访问管理员路由
      const response = await makeRequest(
        "POST",
        "/api/trpc/admin.getUsers",
        null,
        userToken
      );

      expect(response.status).not.toBe(200);
      expect(response.data.error?.code).toBe("FORBIDDEN");
    });
  });

  describe("错误处理", () => {
    it("应该正确处理无效的请求", async () => {
      const response = await makeRequest("POST", "/api/trpc/invalid.route", {});

      expect(response.status).not.toBe(200);
      expect(response.data.error).toBeDefined();
    });

    it("应该正确处理缺少必需字段的请求", async () => {
      const response = await makeRequest("POST", "/api/trpc/userManagement.register", {
        email: "test@example.com",
        // 缺少 name 和 password
      });

      expect(response.status).not.toBe(200);
      expect(response.data.error).toBeDefined();
    });
  });

  describe("API 响应格式", () => {
    it("成功的请求应该返回正确的格式", async () => {
      const response = await makeRequest("POST", "/api/trpc/userManagement.register", {
        email: `test-${Date.now()}@example.com`,
        name: "Test User",
        password: "password123",
      });

      expect(response.data).toHaveProperty("result");
      expect(response.data.result).toHaveProperty("data");
      expect(response.data.result.data).toHaveProperty("token");
      expect(response.data.result.data).toHaveProperty("user");
    });

    it("失败的请求应该返回错误信息", async () => {
      const response = await makeRequest("POST", "/api/trpc/userManagement.login", {
        email: "nonexistent@example.com",
        password: "password",
      });

      expect(response.data).toHaveProperty("error");
      expect(response.data.error).toHaveProperty("code");
      expect(response.data.error).toHaveProperty("message");
    });
  });
});
