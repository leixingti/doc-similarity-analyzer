import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Document Analysis System", () => {
  describe("auth", () => {
    it("should return current user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.email).toBe("test@example.com");
    });

    it("should logout successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  describe("documents", () => {
    it("should list user documents", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("analysis", () => {
    it("should list user analysis tasks", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analysis.listTasks();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get analysis statistics", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.analysis.getStatistics();
      expect(result).toBeDefined();
      expect(typeof result.totalCount).toBe("number");
      expect(typeof result.avgSimilarity).toBe("number");
    });
  });

  describe("preferences", () => {
    it("should get or create user preferences", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.preferences.get();
      expect(result).toBeDefined();
      if (result) {
        expect(result.userId).toBe(1);
        expect(result.defaultAnalysisMode).toBeDefined();
      }
    });
  });
});
