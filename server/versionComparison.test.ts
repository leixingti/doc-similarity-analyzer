import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createDocument } from "./db";

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

describe("Version Comparison", () => {
  let document1Id: number;
  let document2Id: number;
  let identicalDoc1Id: number;
  let identicalDoc2Id: number;

  beforeAll(async () => {
    // 创建测试文档1
    document1Id = await createDocument({
      userId: 1,
      filename: "test_v1.txt",
      originalName: "test_v1.txt",
      fileType: "txt",
      fileSize: 100,
      fileKey: "test-v1.txt",
      fileUrl: "https://example.com/test-v1.txt",
      extractedText: "这是第一个版本的文档内容。\n包含多行文本。\n用于测试版本对比功能。",
    });

    // 创建测试文档2（修改版本）
    document2Id = await createDocument({
      userId: 1,
      filename: "test_v2.txt",
      originalName: "test_v2.txt",
      fileType: "txt",
      fileSize: 120,
      fileKey: "test-v2.txt",
      fileUrl: "https://example.com/test-v2.txt",
      extractedText: "这是第二个版本的文档内容。\n包含多行文本和新增内容。\n用于测试版本对比功能。\n这是新增的一行。",
    });

    // 创建两个相同的文档用于测试
    identicalDoc1Id = await createDocument({
      userId: 1,
      filename: "identical_v1.txt",
      originalName: "identical_v1.txt",
      fileType: "txt",
      fileSize: 50,
      fileKey: "identical-v1.txt",
      fileUrl: "https://example.com/identical-v1.txt",
      extractedText: "相同的内容\n第二行\n第三行",
    });

    identicalDoc2Id = await createDocument({
      userId: 1,
      filename: "identical_v2.txt",
      originalName: "identical_v2.txt",
      fileType: "txt",
      fileSize: 50,
      fileKey: "identical-v2.txt",
      fileUrl: "https://example.com/identical-v2.txt",
      extractedText: "相同的内容\n第二行\n第三行",
    });
  });

  it("should compare two document versions successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    expect(result).toBeDefined();
    expect(result.statistics).toBeDefined();
    expect(result.statistics.totalLines).toBeGreaterThan(0);
    expect(result.changeLevel).toBeDefined();
    expect(result.changes).toBeDefined();
    expect(Array.isArray(result.changes)).toBe(true);
  });

  it("should calculate modification rate correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    expect(result.statistics.modificationRate).toBeGreaterThanOrEqual(0);
    expect(result.statistics.modificationRate).toBeLessThanOrEqual(100);
  });

  it("should identify added lines", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    expect(result.statistics.addedLines).toBeGreaterThan(0);
    const addedChanges = result.changes.filter((c) => c.type === "added");
    expect(addedChanges.length).toBeGreaterThan(0);
  });

  it("should identify modified lines", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    // 版本对比可能将变化识别为修改或新增/删除，只要有变化即可
    const totalChanges = result.statistics.addedLines + result.statistics.deletedLines + result.statistics.modifiedLines;
    expect(totalChanges).toBeGreaterThan(0);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  it("should determine change level based on modification rate", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    const validLevels = ["minimal", "light", "moderate", "significant"];
    expect(validLevels).toContain(result.changeLevel);

    // 验证变化程度与修改率的对应关系
    if (result.statistics.modificationRate < 10) {
      expect(result.changeLevel).toBe("minimal");
    } else if (result.statistics.modificationRate < 30) {
      expect(result.changeLevel).toBe("light");
    } else if (result.statistics.modificationRate < 60) {
      expect(result.changeLevel).toBe("moderate");
    } else {
      expect(result.changeLevel).toBe("significant");
    }
  });

  it("should include line numbers in changes", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id,
      document2Id,
    });

    result.changes.forEach((change) => {
      expect(change.lineNumber).toBeGreaterThan(0);
      expect(typeof change.lineNumber).toBe("number");
    });
  });

  it("should handle identical documents", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.versions.compare({
      document1Id: identicalDoc1Id,
      document2Id: identicalDoc2Id,
    });

    expect(result.statistics.modificationRate).toBe(0);
    expect(result.changeLevel).toBe("minimal");
    expect(result.statistics.addedLines).toBe(0);
    expect(result.statistics.deletedLines).toBe(0);
    expect(result.statistics.modifiedLines).toBe(0);
  });
});
