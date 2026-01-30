/**
 * 安全增强服务
 * 
 * 功能：
 * 1. 双因素认证（2FA）
 * 2. 操作日志审计
 * 3. 敏感信息脱敏
 * 4. 会话管理优化
 */

export interface AuditLog {
  id: number;
  userId: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  timestamp: Date;
  duration?: number; // 操作耗时（毫秒）
}

export interface TwoFactorAuth {
  userId: number;
  secret: string;
  enabled: boolean;
  backupCodes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface Session {
  id: string;
  userId: number;
  token: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  isActive: boolean;
}

export class SecurityService {
  /**
   * 记录操作日志
   */
  async logAction(params: {
    userId: number;
    username: string;
    action: string;
    resource: string;
    resourceId?: string;
    ipAddress: string;
    userAgent: string;
    status: 'success' | 'failure';
    errorMessage?: string;
    duration?: number;
  }): Promise<AuditLog> {
    const log: AuditLog = {
      id: Date.now(),
      ...params,
      timestamp: new Date(),
    };

    // 实际应用中应存储到数据库
    console.log('Audit Log:', log);

    return log;
  }

  /**
   * 查询操作日志
   */
  async getAuditLogs(params: {
    userId?: number;
    action?: string;
    resource?: string;
    status?: 'success' | 'failure';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    // 模拟数据
    const mockLogs: AuditLog[] = [
      {
        id: 1,
        userId: 1,
        username: 'admin',
        action: 'login',
        resource: 'auth',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        timestamp: new Date('2024-01-30T10:00:00'),
        duration: 120,
      },
      {
        id: 2,
        userId: 1,
        username: 'admin',
        action: 'create',
        resource: 'document',
        resourceId: '123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        timestamp: new Date('2024-01-30T10:05:00'),
        duration: 250,
      },
      {
        id: 3,
        userId: 1,
        username: 'admin',
        action: 'update',
        resource: 'document',
        resourceId: '123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        status: 'success',
        timestamp: new Date('2024-01-30T10:10:00'),
        duration: 180,
      },
      {
        id: 4,
        userId: 2,
        username: 'user1',
        action: 'delete',
        resource: 'document',
        resourceId: '456',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        status: 'failure',
        errorMessage: '权限不足',
        timestamp: new Date('2024-01-30T10:15:00'),
        duration: 50,
      },
    ];

    return {
      logs: mockLogs,
      total: mockLogs.length,
    };
  }

  /**
   * 生成2FA密钥
   */
  async generateTwoFactorSecret(userId: number): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // 生成随机密钥
    const secret = this.generateRandomString(32);

    // 生成备份码
    const backupCodes = Array.from({ length: 10 }, () =>
      this.generateRandomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    );

    // 生成二维码URL（实际应用中使用真实的2FA库）
    const qrCode = `otpauth://totp/LawyerDoc:user${userId}?secret=${secret}&issuer=LawyerDoc`;

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * 启用2FA
   */
  async enableTwoFactor(params: {
    userId: number;
    secret: string;
    code: string;
  }): Promise<{ success: boolean; backupCodes: string[] }> {
    const { userId, secret, code } = params;

    // 验证2FA代码（实际应用中使用真实的2FA库）
    const isValid = this.verifyTwoFactorCode(secret, code);

    if (!isValid) {
      throw new Error('验证码错误');
    }

    // 生成备份码
    const backupCodes = Array.from({ length: 10 }, () =>
      this.generateRandomString(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    );

    // 保存到数据库
    const twoFactor: TwoFactorAuth = {
      userId,
      secret,
      enabled: true,
      backupCodes,
      createdAt: new Date(),
    };

    console.log('2FA Enabled:', twoFactor);

    return {
      success: true,
      backupCodes,
    };
  }

  /**
   * 禁用2FA
   */
  async disableTwoFactor(params: {
    userId: number;
    password: string;
  }): Promise<{ success: boolean }> {
    // 验证密码
    // 实际应用中应验证用户密码

    // 禁用2FA
    console.log('2FA Disabled for user:', params.userId);

    return { success: true };
  }

  /**
   * 验证2FA代码
   */
  verifyTwoFactorCode(secret: string, code: string): boolean {
    // 实际应用中应使用真实的2FA库（如speakeasy）
    // 这里简化处理
    return code.length === 6 && /^\d+$/.test(code);
  }

  /**
   * 脱敏处理
   */
  maskSensitiveData(data: string, type: 'phone' | 'email' | 'idcard' | 'bankcard'): string {
    switch (type) {
      case 'phone':
        // 手机号：138****5678
        return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');

      case 'email':
        // 邮箱：abc***@example.com
        const [username, domain] = data.split('@');
        const maskedUsername = username.substring(0, 3) + '***';
        return `${maskedUsername}@${domain}`;

      case 'idcard':
        // 身份证：110***********1234
        return data.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2');

      case 'bankcard':
        // 银行卡：6222 **** **** 1234
        return data.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2');

      default:
        return data;
    }
  }

  /**
   * 批量脱敏
   */
  maskMultipleData(items: Array<{ data: string; type: 'phone' | 'email' | 'idcard' | 'bankcard' }>): string[] {
    return items.map(item => this.maskSensitiveData(item.data, item.type));
  }

  /**
   * 创建会话
   */
  async createSession(params: {
    userId: number;
    ipAddress: string;
    userAgent: string;
    expiresIn?: number; // 过期时间（秒），默认7天
  }): Promise<Session> {
    const { userId, ipAddress, userAgent, expiresIn = 7 * 24 * 60 * 60 } = params;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);

    const session: Session = {
      id: this.generateRandomString(32),
      userId,
      token: this.generateRandomString(64),
      ipAddress,
      userAgent,
      createdAt: now,
      expiresAt,
      lastActivityAt: now,
      isActive: true,
    };

    // 保存到数据库或Redis
    console.log('Session Created:', session);

    return session;
  }

  /**
   * 验证会话
   */
  async validateSession(sessionId: string): Promise<{
    valid: boolean;
    session?: Session;
    reason?: string;
  }> {
    // 从数据库或Redis获取会话
    // 这里模拟
    const session: Session = {
      id: sessionId,
      userId: 1,
      token: 'mock-token',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
      isActive: true,
    };

    // 检查会话是否存在
    if (!session) {
      return { valid: false, reason: '会话不存在' };
    }

    // 检查会话是否过期
    if (session.expiresAt < new Date()) {
      return { valid: false, reason: '会话已过期' };
    }

    // 检查会话是否激活
    if (!session.isActive) {
      return { valid: false, reason: '会话已失效' };
    }

    // 更新最后活动时间
    session.lastActivityAt = new Date();

    return { valid: true, session };
  }

  /**
   * 刷新会话
   */
  async refreshSession(sessionId: string): Promise<Session> {
    const validation = await this.validateSession(sessionId);

    if (!validation.valid || !validation.session) {
      throw new Error(validation.reason || '会话无效');
    }

    const session = validation.session;

    // 延长过期时间
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.lastActivityAt = new Date();

    return session;
  }

  /**
   * 销毁会话
   */
  async destroySession(sessionId: string): Promise<{ success: boolean }> {
    // 从数据库或Redis删除会话
    console.log('Session Destroyed:', sessionId);

    return { success: true };
  }

  /**
   * 获取用户所有会话
   */
  async getUserSessions(userId: number): Promise<Session[]> {
    // 模拟数据
    const sessions: Session[] = [
      {
        id: 'session-1',
        userId,
        token: 'token-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: new Date('2024-01-30T10:00:00'),
        expiresAt: new Date('2024-02-06T10:00:00'),
        lastActivityAt: new Date('2024-01-30T15:30:00'),
        isActive: true,
      },
      {
        id: 'session-2',
        userId,
        token: 'token-2',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        createdAt: new Date('2024-01-29T08:00:00'),
        expiresAt: new Date('2024-02-05T08:00:00'),
        lastActivityAt: new Date('2024-01-30T12:00:00'),
        isActive: true,
      },
    ];

    return sessions;
  }

  /**
   * 销毁用户所有会话（除当前会话）
   */
  async destroyOtherSessions(params: {
    userId: number;
    currentSessionId: string;
  }): Promise<{ success: boolean; count: number }> {
    const { userId, currentSessionId } = params;

    // 获取用户所有会话
    const sessions = await this.getUserSessions(userId);

    // 销毁除当前会话外的所有会话
    const otherSessions = sessions.filter(s => s.id !== currentSessionId);

    for (const session of otherSessions) {
      await this.destroySession(session.id);
    }

    return {
      success: true,
      count: otherSessions.length,
    };
  }

  /**
   * 生成随机字符串
   */
  private generateRandomString(length: number, charset?: string): string {
    const chars = charset || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 检测可疑活动
   */
  async detectSuspiciousActivity(params: {
    userId: number;
    action: string;
    ipAddress: string;
  }): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 检查IP地址变化
    // 实际应用中应检查用户历史IP
    const isNewIP = false; // 模拟
    if (isNewIP) {
      reasons.push('检测到新的IP地址');
      riskLevel = 'medium';
    }

    // 检查异常时间
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      reasons.push('在异常时间段操作');
      riskLevel = 'medium';
    }

    // 检查高风险操作
    const highRiskActions = ['delete', 'export', 'share'];
    if (highRiskActions.includes(params.action)) {
      reasons.push('执行高风险操作');
      riskLevel = 'high';
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
      riskLevel,
    };
  }
}

// 导出单例
export const securityService = new SecurityService();
