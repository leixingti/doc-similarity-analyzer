#!/bin/bash

##############################################################################
# Railway 一键部署脚本
# 
# 用途: 自动化 Railway 部署前的所有准备工作
# 功能:
#   1. 生成 JWT_SECRET
#   2. 创建 .env.railway 环境变量文件
#   3. 验证部署配置
#   4. 提供部署指令
#
# 使用方法:
#   chmod +x scripts/railway-deploy.sh
#   ./scripts/railway-deploy.sh
#
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
ENV_FILE="$PROJECT_ROOT/.env.railway"

##############################################################################
# 辅助函数
##############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

##############################################################################
# 检查前置条件
##############################################################################

check_prerequisites() {
    print_header "检查前置条件"
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    print_success "Node.js 已安装: $(node --version)"
    
    # 检查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装"
        exit 1
    fi
    print_success "Git 已安装: $(git --version | head -n1)"
    
    # 检查项目根目录
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "package.json 未找到，请在项目根目录运行此脚本"
        exit 1
    fi
    print_success "项目根目录正确: $PROJECT_ROOT"
}

##############################################################################
# 生成 JWT_SECRET
##############################################################################

generate_jwt_secret() {
    print_header "生成 JWT_SECRET"
    
    # 使用 Node.js 生成随机字符串
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT_SECRET 生成失败"
        exit 1
    fi
    
    print_success "JWT_SECRET 已生成"
    echo -e "${YELLOW}JWT_SECRET: $JWT_SECRET${NC}\n"
    
    # 保存到临时变量
    export JWT_SECRET
}

##############################################################################
# 创建环境变量文件
##############################################################################

create_env_file() {
    print_header "创建环境变量文件"
    
    # 创建 .env.railway 文件
    cat > "$ENV_FILE" << EOF
# Railway 部署环境变量
# 生成时间: $(date)
# 
# 使用方法:
#   1. 复制此文件中的环境变量到 Railway 控制面板
#   2. 将 DATABASE_URL 替换为 Railway MySQL 提供的连接字符串
#   3. 保存配置后开始部署

# 必需的环境变量
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
PORT=3000
LOG_LEVEL=info

# 数据库连接字符串 (由 Railway MySQL 自动提供)
# 格式: mysql://username:password@host:port/database
# 示例: mysql://root:password@mysql.railway.internal:3306/railway
DATABASE_URL=mysql://root:password@mysql.railway.internal:3306/railway

# 可选的环境变量
STORAGE_PATH=.storage/documents

# 应用配置
VITE_APP_TITLE=文档相似度分析系统

EOF
    
    if [ -f "$ENV_FILE" ]; then
        print_success "环境变量文件已创建: $ENV_FILE"
    else
        print_error "环境变量文件创建失败"
        exit 1
    fi
}

##############################################################################
# 验证部署配置
##############################################################################

verify_deployment_config() {
    print_header "验证部署配置"
    
    local config_files=(
        "railway.json"
        "Dockerfile"
        ".railwayignore"
        "package.json"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            print_success "$file 已存在"
        else
            print_error "$file 未找到"
            exit 1
        fi
    done
    
    # 检查 package.json 中的必需脚本
    if grep -q '"build"' "$PROJECT_ROOT/package.json"; then
        print_success "build 脚本已定义"
    else
        print_error "build 脚本未定义"
        exit 1
    fi
    
    if grep -q '"start"' "$PROJECT_ROOT/package.json"; then
        print_success "start 脚本已定义"
    else
        print_error "start 脚本未定义"
        exit 1
    fi
}

##############################################################################
# 验证 Git 状态
##############################################################################

verify_git_status() {
    print_header "验证 Git 状态"
    
    # 检查是否在 Git 仓库中
    if ! git -C "$PROJECT_ROOT" rev-parse --git-dir > /dev/null 2>&1; then
        print_error "不在 Git 仓库中"
        exit 1
    fi
    print_success "Git 仓库已初始化"
    
    # 检查远程仓库
    if git -C "$PROJECT_ROOT" remote -v | grep -q origin; then
        print_success "远程仓库已配置"
        print_info "远程仓库: $(git -C "$PROJECT_ROOT" remote get-url origin)"
    else
        print_warning "未配置远程仓库"
    fi
    
    # 检查分支
    CURRENT_BRANCH=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)
    print_success "当前分支: $CURRENT_BRANCH"
}

##############################################################################
# 显示部署步骤
##############################################################################

show_deployment_steps() {
    print_header "Railway 部署步骤"
    
    cat << 'EOF'
按照以下步骤在 Railway 中部署应用:

【第 1 步】在 Railway 创建项目
  1. 访问 https://railway.app
  2. 使用 GitHub 账户登录
  3. 点击 "New Project" 按钮
  4. 选择 "Deploy from GitHub repo"
  5. 搜索并选择 doc-similarity-analyzer 仓库
  6. 点击 "Deploy" 按钮

【第 2 步】添加 MySQL 数据库
  1. 在 Railway 项目中点击 "Add Service"
  2. 选择 "Database" → "MySQL"
  3. 等待 MySQL 实例启动（通常 1-2 分钟）
  4. Railway 会自动创建 DATABASE_URL 环境变量

【第 3 步】配置环境变量
  1. 在 Railway 项目中选择应用
  2. 点击 "Variables" 标签
  3. 添加以下环境变量:

EOF

    echo -e "${YELLOW}必需的环境变量:${NC}"
    echo "  NODE_ENV = production"
    echo "  JWT_SECRET = $JWT_SECRET"
    echo "  PORT = 3000"
    echo "  LOG_LEVEL = info"
    
    echo -e "\n${YELLOW}数据库连接字符串:${NC}"
    echo "  DATABASE_URL = <由 Railway MySQL 自动提供>"
    echo "  格式: mysql://username:password@host:port/database"
    
    cat << 'EOF'

【第 4 步】部署应用
  1. 所有环境变量配置完成后，Railway 会自动开始构建
  2. 在 "Deployments" 标签中查看部署进度
  3. 等待部署完成（通常 5-10 分钟）
  4. 部署完成后点击 "Open" 按钮访问应用

【第 5 步】验证部署
  1. 访问应用 URL
  2. 检查应用是否正常运行
  3. 查看 "Logs" 标签中是否有错误信息
  4. 测试应用的主要功能

EOF
}

##############################################################################
# 显示快速参考
##############################################################################

show_quick_reference() {
    print_header "快速参考"
    
    cat << 'EOF'
【重要信息】

1. JWT_SECRET
   - 已为您生成随机的 JWT_SECRET
   - 在 Railway 中配置环境变量时使用此值
   - 不要在公开场合分享此值

2. DATABASE_URL
   - 由 Railway MySQL 自动生成
   - 格式: mysql://username:password@host:port/database
   - 无需手动配置，Railway 会自动设置

3. 环境变量文件
   - 已创建: .env.railway
   - 包含所有必需的环境变量
   - 可复制到 Railway 控制面板

【有用的命令】

本地测试构建:
  pnpm build

本地开发运行:
  pnpm dev

本地生产运行:
  NODE_ENV=production pnpm start

查看 Railway 部署日志:
  访问 Railway 控制面板 → 选择应用 → 点击 "Logs" 标签

【文档参考】

快速部署指南: RAILWAY_QUICK_START.md
详细部署指南: RAILWAY_SETUP_GUIDE.md
完整参考文档: RAILWAY_DEPLOYMENT.md
部署检查清单: RAILWAY_DEPLOYMENT_READY.md

EOF
}

##############################################################################
# 显示环境变量内容
##############################################################################

show_env_content() {
    print_header "环境变量文件内容"
    
    echo -e "${YELLOW}文件位置: $ENV_FILE${NC}\n"
    cat "$ENV_FILE"
    echo ""
}

##############################################################################
# 主函数
##############################################################################

main() {
    clear
    
    echo -e "${BLUE}"
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          Railway 一键部署脚本 - 文档相似度分析器              ║
║                                                                ║
║  此脚本将自动化所有部署前的准备工作:                          ║
║    ✓ 生成 JWT_SECRET                                          ║
║    ✓ 创建环境变量文件                                         ║
║    ✓ 验证部署配置                                             ║
║    ✓ 显示部署步骤                                             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    # 执行各个步骤
    check_prerequisites
    generate_jwt_secret
    create_env_file
    verify_deployment_config
    verify_git_status
    show_deployment_steps
    show_quick_reference
    show_env_content
    
    # 完成提示
    print_header "部署准备完成！"
    
    cat << 'EOF'
✅ 所有准备工作已完成！

下一步:
  1. 复制 JWT_SECRET 的值到 Railway 环境变量
  2. 按照上面的步骤在 Railway 中创建项目
  3. 配置环境变量
  4. 开始部署

如有问题，请参考:
  - RAILWAY_QUICK_START.md (快速部署)
  - RAILWAY_SETUP_GUIDE.md (详细部署)
  - RAILWAY_DEPLOYMENT.md (完整参考)

EOF
    
    print_success "脚本执行完成！"
}

# 运行主函数
main "$@"
