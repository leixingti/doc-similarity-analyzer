/**
 * 协作系统服务
 * 
 * 功能：
 * 1. 文档协同编辑
 * 2. 修订追踪
 * 3. 评论批注
 * 4. 任务分配
 * 5. 权限管理
 */

export interface Revision {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  version: number;
  changeType: 'create' | 'edit' | 'delete' | 'format' | 'comment';
  changeSummary: string;
  changeDetails: ChangeDetail[];
  timestamp: string;
  parentVersion?: number;
}

export interface ChangeDetail {
  type: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  length?: number;
  oldContent?: string;
  newContent?: string;
  formatChange?: {
    property: string;
    oldValue: string;
    newValue: string;
  };
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  position: {
    start: number;
    end: number;
    context?: string; // 被批注的文本内容
  };
  resolved: boolean;
  replies: CommentReply[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  documentId: string;
  title: string;
  description: string;
  assignerId: string;
  assignerName: string;
  assigneeId: string;
  assigneeName: string;
  taskType: 'review' | 'edit' | 'approve' | 'comment';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  userId: string;
  userName: string;
  documentId: string;
  role: 'owner' | 'editor' | 'reviewer' | 'viewer';
  canRead: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export interface CollaborationSession {
  documentId: string;
  activeUsers: ActiveUser[];
  lastActivity: string;
}

export interface ActiveUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  cursorPosition?: number;
  selectionStart?: number;
  selectionEnd?: number;
  lastSeen: string;
  isEditing: boolean;
}

export class CollaborationService {
  /**
   * 创建修订记录
   */
  createRevision(params: {
    documentId: string;
    userId: string;
    userName: string;
    version: number;
    changeType: Revision['changeType'];
    changeSummary: string;
    changeDetails: ChangeDetail[];
    parentVersion?: number;
  }): Revision {
    return {
      id: this.generateId(),
      ...params,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 比较两个版本的差异
   */
  compareVersions(params: {
    oldContent: string;
    newContent: string;
  }): ChangeDetail[] {
    const { oldContent, newContent } = params;
    const changes: ChangeDetail[] = [];

    // 简单的差异检测算法
    // 实际应用中可以使用更复杂的diff算法（如Myers diff）
    
    if (oldContent === newContent) {
      return changes;
    }

    // 检测插入
    if (newContent.length > oldContent.length) {
      const commonPrefix = this.findCommonPrefix(oldContent, newContent);
      const commonSuffix = this.findCommonSuffix(
        oldContent.slice(commonPrefix),
        newContent.slice(commonPrefix)
      );
      
      const insertPosition = commonPrefix;
      const insertedContent = newContent.slice(
        commonPrefix,
        newContent.length - commonSuffix
      );

      changes.push({
        type: 'insert',
        position: insertPosition,
        newContent: insertedContent,
      });
    }
    // 检测删除
    else if (newContent.length < oldContent.length) {
      const commonPrefix = this.findCommonPrefix(oldContent, newContent);
      const commonSuffix = this.findCommonSuffix(
        oldContent.slice(commonPrefix),
        newContent.slice(commonPrefix)
      );
      
      const deletePosition = commonPrefix;
      const deletedContent = oldContent.slice(
        commonPrefix,
        oldContent.length - commonSuffix
      );

      changes.push({
        type: 'delete',
        position: deletePosition,
        length: deletedContent.length,
        oldContent: deletedContent,
      });
    }
    // 检测替换
    else {
      const commonPrefix = this.findCommonPrefix(oldContent, newContent);
      const commonSuffix = this.findCommonSuffix(
        oldContent.slice(commonPrefix),
        newContent.slice(commonPrefix)
      );
      
      if (commonPrefix + commonSuffix < oldContent.length) {
        changes.push({
          type: 'replace',
          position: commonPrefix,
          length: oldContent.length - commonPrefix - commonSuffix,
          oldContent: oldContent.slice(
            commonPrefix,
            oldContent.length - commonSuffix
          ),
          newContent: newContent.slice(
            commonPrefix,
            newContent.length - commonSuffix
          ),
        });
      }
    }

    return changes;
  }

  /**
   * 生成修订摘要
   */
  generateRevisionSummary(changes: ChangeDetail[]): string {
    if (changes.length === 0) {
      return '无变更';
    }

    const summaries: string[] = [];
    let insertCount = 0;
    let deleteCount = 0;
    let replaceCount = 0;

    changes.forEach(change => {
      switch (change.type) {
        case 'insert':
          insertCount++;
          break;
        case 'delete':
          deleteCount++;
          break;
        case 'replace':
          replaceCount++;
          break;
      }
    });

    if (insertCount > 0) {
      summaries.push(`新增${insertCount}处内容`);
    }
    if (deleteCount > 0) {
      summaries.push(`删除${deleteCount}处内容`);
    }
    if (replaceCount > 0) {
      summaries.push(`修改${replaceCount}处内容`);
    }

    return summaries.join('，');
  }

  /**
   * 创建评论
   */
  createComment(params: {
    documentId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    position: Comment['position'];
  }): Comment {
    return {
      id: this.generateId(),
      ...params,
      resolved: false,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 添加评论回复
   */
  addCommentReply(params: {
    comment: Comment;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
  }): Comment {
    const reply: CommentReply = {
      id: this.generateId(),
      userId: params.userId,
      userName: params.userName,
      userAvatar: params.userAvatar,
      content: params.content,
      createdAt: new Date().toISOString(),
    };

    return {
      ...params.comment,
      replies: [...params.comment.replies, reply],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 解决评论
   */
  resolveComment(comment: Comment): Comment {
    return {
      ...comment,
      resolved: true,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 创建任务
   */
  createTask(params: {
    documentId: string;
    title: string;
    description: string;
    assignerId: string;
    assignerName: string;
    assigneeId: string;
    assigneeName: string;
    taskType: Task['taskType'];
    priority: Task['priority'];
    dueDate?: string;
  }): Task {
    return {
      id: this.generateId(),
      ...params,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(task: Task, status: Task['status'], notes?: string): Task {
    const updated: Task = {
      ...task,
      status,
      notes,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'completed') {
      updated.completedAt = new Date().toISOString();
    }

    return updated;
  }

  /**
   * 设置文档权限
   */
  setPermission(params: {
    userId: string;
    userName: string;
    documentId: string;
    role: Permission['role'];
    grantedBy: string;
    expiresAt?: string;
  }): Permission {
    const { role } = params;

    // 根据角色设置权限
    let permissions = {
      canRead: false,
      canEdit: false,
      canComment: false,
      canShare: false,
      canDelete: false,
    };

    switch (role) {
      case 'owner':
        permissions = {
          canRead: true,
          canEdit: true,
          canComment: true,
          canShare: true,
          canDelete: true,
        };
        break;
      case 'editor':
        permissions = {
          canRead: true,
          canEdit: true,
          canComment: true,
          canShare: false,
          canDelete: false,
        };
        break;
      case 'reviewer':
        permissions = {
          canRead: true,
          canEdit: false,
          canComment: true,
          canShare: false,
          canDelete: false,
        };
        break;
      case 'viewer':
        permissions = {
          canRead: true,
          canEdit: false,
          canComment: false,
          canShare: false,
          canDelete: false,
        };
        break;
    }

    return {
      ...params,
      ...permissions,
      grantedAt: new Date().toISOString(),
    };
  }

  /**
   * 检查用户权限
   */
  checkPermission(permission: Permission, action: keyof Pick<Permission, 'canRead' | 'canEdit' | 'canComment' | 'canShare' | 'canDelete'>): boolean {
    // 检查是否过期
    if (permission.expiresAt) {
      const expiresAt = new Date(permission.expiresAt);
      if (expiresAt < new Date()) {
        return false;
      }
    }

    return permission[action];
  }

  /**
   * 获取角色显示名称
   */
  getRoleName(role: Permission['role']): string {
    const names: Record<Permission['role'], string> = {
      owner: '所有者',
      editor: '编辑者',
      reviewer: '审阅者',
      viewer: '查看者',
    };
    return names[role];
  }

  /**
   * 获取任务类型显示名称
   */
  getTaskTypeName(taskType: Task['taskType']): string {
    const names: Record<Task['taskType'], string> = {
      review: '审阅',
      edit: '编辑',
      approve: '审批',
      comment: '评论',
    };
    return names[taskType];
  }

  /**
   * 获取任务优先级显示名称
   */
  getPriorityName(priority: Task['priority']): string {
    const names: Record<Task['priority'], string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return names[priority];
  }

  /**
   * 获取任务状态显示名称
   */
  getTaskStatusName(status: Task['status']): string {
    const names: Record<Task['status'], string> = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return names[status];
  }

  /**
   * 查找公共前缀
   */
  private findCommonPrefix(str1: string, str2: string): number {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return i;
  }

  /**
   * 查找公共后缀
   */
  private findCommonSuffix(str1: string, str2: string): number {
    let i = 0;
    while (
      i < str1.length &&
      i < str2.length &&
      str1[str1.length - 1 - i] === str2[str2.length - 1 - i]
    ) {
      i++;
    }
    return i;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出修订历史为Markdown
   */
  exportRevisionHistory(revisions: Revision[]): string {
    let markdown = `# 修订历史\n\n`;
    markdown += `**总修订次数**: ${revisions.length}\n\n`;
    markdown += `---\n\n`;

    revisions
      .sort((a, b) => b.version - a.version)
      .forEach(revision => {
        markdown += `## 版本 ${revision.version}\n\n`;
        markdown += `- **修改人**: ${revision.userName}\n`;
        markdown += `- **修改时间**: ${new Date(revision.timestamp).toLocaleString('zh-CN')}\n`;
        markdown += `- **修改类型**: ${this.getChangeTypeName(revision.changeType)}\n`;
        markdown += `- **修改摘要**: ${revision.changeSummary}\n\n`;

        if (revision.changeDetails.length > 0) {
          markdown += `### 详细变更\n\n`;
          revision.changeDetails.forEach((detail, idx) => {
            markdown += `**变更 ${idx + 1}**: ${this.getChangeDetailDescription(detail)}\n\n`;
          });
        }

        markdown += `---\n\n`;
      });

    return markdown;
  }

  /**
   * 获取变更类型名称
   */
  private getChangeTypeName(changeType: Revision['changeType']): string {
    const names: Record<Revision['changeType'], string> = {
      create: '创建',
      edit: '编辑',
      delete: '删除',
      format: '格式调整',
      comment: '添加评论',
    };
    return names[changeType];
  }

  /**
   * 获取变更详情描述
   */
  private getChangeDetailDescription(detail: ChangeDetail): string {
    switch (detail.type) {
      case 'insert':
        return `在位置 ${detail.position} 插入了 "${detail.newContent?.substring(0, 50)}${(detail.newContent?.length || 0) > 50 ? '...' : ''}"`;
      case 'delete':
        return `在位置 ${detail.position} 删除了 ${detail.length} 个字符`;
      case 'replace':
        return `在位置 ${detail.position} 将 "${detail.oldContent?.substring(0, 30)}..." 替换为 "${detail.newContent?.substring(0, 30)}..."`;
      case 'format':
        return `格式变更: ${detail.formatChange?.property}`;
      default:
        return '未知变更';
    }
  }
}

// 导出单例
export const collaborationService = new CollaborationService();
