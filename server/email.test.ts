import { describe, it, expect } from "vitest";
import { testEmailConnection } from "./email";

describe("Email Service", () => {
  it("should connect to SMTP server successfully", async () => {
    const result = await testEmailConnection();
    expect(result).toBe(true);
  }, 15000); // 15秒超时，因为网络请求可能较慢
});
