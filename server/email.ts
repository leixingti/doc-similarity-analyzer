import nodemailer from "nodemailer";
import { ENV as env } from "./_core/env";

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports (587 uses STARTTLS)
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
  tls: {
    // 不验证证书（某些云平台需要）
    rejectUnauthorized: false,
  },
  // 增加连接超时时间
  connectionTimeout: 10000, // 10秒
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * 发送验证码邮件
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"文档相似度分析系统" <${env.SMTP_USER}>`,
      to: email,
      subject: "邮箱验证码",
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
    });
    console.log(`[Email] Verification code sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

/**
 * 测试邮件连接
 */
export async function testEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log("[Email] SMTP connection verified successfully");
    return true;
  } catch (error) {
    console.error("Email connection test failed:", error);
    return false;
  }
}
