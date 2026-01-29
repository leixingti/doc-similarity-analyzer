# 管理员后台功能说明

## 功能概述

系统新增了完整的管理员后台管理功能，允许管理员对用户进行全面管理。

## 访问方式

管理员登录后，访问 `/admin` 路径即可进入管理员后台。

```
https://your-domain.com/admin
```

## 功能列表

### 1. 用户管理

#### 查看用户列表
- 显示所有注册用户
- 包含用户ID、用户名、邮箱、角色、登录方式、创建时间等信息
- 支持角色筛选（管理员/普通用户）

#### 编辑用户信息
- 修改用户名
- 修改邮箱地址
- 修改用户角色（user/admin）

#### 删除用户
- 删除指定用户账号
- **安全限制**：
  - 管理员不能删除自己
  - 系统至少保留一个管理员账号

#### 重置用户密码
- 为用户设置新密码
- 用户下次登录时将被要求修改密码
- 新密码至少6个字符

### 2. 创建用户

管理员可以直接创建新用户，无需用户自行注册。

**创建用户表单：**
- 用户名（必填）
- 邮箱（必填，唯一）
- 初始密码（必填，至少6个字符）
- 确认密码（必填）
- 用户角色（user/admin）

**特性：**
- 管理员创建的用户邮箱默认已验证
- 用户首次登录时必须修改密码
- 支持创建管理员账号

### 3. 用户统计

实时显示系统用户统计信息：

- **总用户数**：系统中所有用户的数量
- **管理员数量**：拥有管理员权限的用户数
- **普通用户数量**：普通用户的数量
- **已验证邮箱数量**：已完成邮箱验证的用户数

**统计指标：**
- 邮箱验证率
- 管理员占比
- 普通用户占比

### 4. 权限管理

#### 角色类型
- **user**（普通用户）：只能使用基本功能
- **admin**（管理员）：拥有所有权限，可访问管理后台

#### 权限控制
- 只有管理员可以访问 `/admin` 路径
- 普通用户访问管理后台会被拒绝
- 未登录用户会被要求先登录

### 5. 管理员自身密码修改

管理员可以通过以下方式修改自己的密码：

1. **修改密码页面**：访问 `/change-password`
   - 输入当前密码
   - 输入新密码
   - 确认新密码

2. **忘记密码**：如果忘记密码，可通过 `/forgot-password` 重置
   - 输入邮箱
   - 接收重置邮件
   - 点击链接设置新密码

## 安全特性

### 1. 权限验证
- 所有管理员API都需要验证用户角色
- 非管理员用户无法调用管理员API

### 2. 操作限制
- 管理员不能删除自己的账号
- 系统必须保留至少一个管理员账号
- 邮箱地址必须唯一

### 3. 密码安全
- 所有密码使用 bcrypt 加密存储
- 管理员重置的密码要求用户首次登录时修改
- 密码最小长度6个字符

### 4. 数据验证
- 邮箱格式验证
- 密码强度验证
- 用户名非空验证

## API 接口

### 后端路由：`adminManagement`

#### 1. 获取所有用户
```typescript
trpc.adminManagement.getAllUsers.useQuery()
```

#### 2. 创建用户
```typescript
trpc.adminManagement.createUser.useMutation({
  email: string,
  name: string,
  password: string,
  role: 'user' | 'admin'
})
```

#### 3. 更新用户信息
```typescript
trpc.adminManagement.updateUser.useMutation({
  userId: number,
  name?: string,
  email?: string,
  role?: 'user' | 'admin'
})
```

#### 4. 删除用户
```typescript
trpc.adminManagement.deleteUser.useMutation({
  userId: number
})
```

#### 5. 重置用户密码
```typescript
trpc.adminManagement.resetUserPassword.useMutation({
  userId: number,
  newPassword: string
})
```

#### 6. 获取用户统计
```typescript
trpc.adminManagement.getUserStats.useQuery()
```

## 数据库表结构

### users 表

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  password VARCHAR(255),
  emailVerified BOOLEAN DEFAULT FALSE,
  mustChangePassword BOOLEAN DEFAULT FALSE,
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## 使用流程

### 管理员首次使用

1. **登录系统**
   - 使用管理员账号登录

2. **访问管理后台**
   - 访问 `/admin` 路径

3. **查看用户列表**
   - 在"用户管理"标签页查看所有用户

4. **创建新用户**
   - 切换到"创建用户"标签页
   - 填写用户信息
   - 设置角色和初始密码
   - 点击"创建用户"

5. **管理现有用户**
   - 编辑用户信息
   - 重置用户密码
   - 删除不需要的用户

6. **查看统计信息**
   - 切换到"统计信息"标签页
   - 查看用户数量和占比

### 创建第一个管理员账号

如果系统中还没有管理员账号，需要通过数据库直接创建：

```sql
-- 1. 注册一个普通用户
-- 2. 在数据库中将该用户角色改为 admin
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

或者在注册时直接在数据库中修改：

```sql
-- 查找用户ID
SELECT id, email, role FROM users WHERE email = 'admin@example.com';

-- 设置为管理员
UPDATE users SET role = 'admin' WHERE id = 1;
```

## 注意事项

1. **管理员权限**
   - 管理员拥有所有权限，请谨慎授予
   - 建议只给可信任的用户管理员权限

2. **密码管理**
   - 管理员重置的密码应该足够复杂
   - 建议使用密码生成器生成初始密码
   - 用户首次登录后会被要求修改密码

3. **用户删除**
   - 删除用户是不可逆操作
   - 删除前请确认该用户的数据是否需要保留

4. **角色变更**
   - 将用户提升为管理员前请确认其身份
   - 降级管理员时确保系统至少还有一个管理员

5. **邮箱唯一性**
   - 每个邮箱只能注册一个账号
   - 修改邮箱时会检查新邮箱是否已被使用

## 常见问题

### Q: 如何创建第一个管理员账号？
A: 先通过邮箱注册一个普通账号，然后在数据库中将该用户的 `role` 字段修改为 `admin`。

### Q: 忘记管理员密码怎么办？
A: 可以使用"忘记密码"功能通过邮箱重置密码。

### Q: 可以删除所有管理员吗？
A: 不可以，系统会阻止删除最后一个管理员账号。

### Q: 管理员创建的用户为什么首次登录要改密码？
A: 这是安全最佳实践，确保只有用户本人知道最终密码。

### Q: 如何批量创建用户？
A: 目前只支持单个创建，如需批量创建可以通过数据库导入或编写脚本调用API。

## 更新日志

### v1.0.0 (2026-01-29)
- ✅ 实现用户列表查看
- ✅ 实现用户创建功能
- ✅ 实现用户编辑功能
- ✅ 实现用户删除功能
- ✅ 实现用户密码重置
- ✅ 实现用户统计功能
- ✅ 实现权限验证
- ✅ 实现管理员后台UI
