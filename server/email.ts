import { ENV as env } from "./_core/env";

/**
 * 发送验证码邮件
 * 使用 Resend API 发送邮件
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    // 检查是否配置了 Resend API Key
    if (!env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured");
      return false;
    }

    // 调用 Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "onboarding@resend.dev",
        to: [email],
        subject: "邮箱验证码 - 文档相似度分析系统",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">邮箱验证</h2>
            <p>您好！</p>
            <p>您正在注册文档相似度分析系统，您的验证码是：</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #666;">验证码将在10分钟后过期，请尽快完成验证。</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">如果这不是您的操作，请忽略此邮件。</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Email] Resend API error:", errorData);
      return false;
    }

    const data = await response.json();
    console.log(`[Email] Verification code sent successfully to ${email}, message ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send verification email:", error);
    return false;
  }
}

/**
 * 测试邮件连接
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    if (!env.RESEND_API_KEY) {
      console.error("[Email] RESEND_API_KEY not configured");
      return false;
    }

    // 测试 API Key 是否有效
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || "onboarding@resend.dev",
        to: ["test@example.com"],
        subject: "Test",
        html: "Test",
      }),
    });

    if (response.ok || response.status === 422) {
      // 422 表示参数验证失败，但 API Key 是有效的
      console.log("[Email] Resend API connection verified successfully");
      return true;
    }

    console.error("[Email] Resend API connection test failed:", response.status);
    return false;
  } catch (error) {
    console.error("[Email] Email connection test failed:", error);
    return false;
  }
}
