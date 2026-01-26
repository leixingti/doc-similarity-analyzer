#!/bin/bash

##############################################################################
# Railway 快速部署脚本 (一键部署)
# 
# 用途: 快速完成所有部署前的准备工作
# 功能:
#   1. 生成 JWT_SECRET
#   2. 创建环境变量文件
#   3. 验证部署配置
#   4. 输出部署指令
#   5. 复制到剪贴板（如果支持）
#
# 使用方法:
#   chmod +x scripts/quick-deploy.sh
#   ./scripts/quick-deploy.sh
#
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

##############################################################################
# 辅助函数
##############################################################################

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_code() {
    echo -e "${CYAN}$1${NC}"
}

##############################################################################
# 主函数
##############################################################################

main() {
    clear
    
    # 欢迎信息
    cat << 'EOF'

╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║               🚀 Railway 快速部署脚本 - 一键部署                         ║
║                                                                          ║
║                    文档相似度分析器应用                                  ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

EOF

    print_header "第 1 步: 生成 JWT_SECRET"
    
    # 生成 JWT_SECRET
    print_info "正在生成 JWT_SECRET..."
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    if [ -z "$JWT_SECRET" ]; then
        print_error "JWT_SECRET 生成失败"
        exit 1
    fi
    
    print_success "JWT_SECRET 已生成"
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}JWT_SECRET:${NC}"
    print_code "$JWT_SECRET"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    print_header "第 2 步: 验证部署配置"
    
    # 检查必需的文件
    local required_files=("railway.json" "Dockerfile" ".railwayignore" "package.json")
    local all_files_exist=true
    
    for file in "${required_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            print_success "$file"
        else
            print_error "$file 未找到"
            all_files_exist=false
        fi
    done
    
    if [ "$all_files_exist" = false ]; then
        print_error "部分配置文件缺失"
        exit 1
    fi
    
    echo ""
    
    print_header "第 3 步: 创建环境变量文件"
    
    # 创建 .env.railway 文件
    ENV_FILE="$PROJECT_ROOT/.env.railway"
    cat > "$ENV_FILE" << ENVEOF
# Railway 部署环境变量
# 生成时间: $(date)

NODE_ENV=production
JWT_SECRET=$JWT_SECRET
PORT=3000
LOG_LEVEL=info
DATABASE_URL=mysql://root:password@mysql.railway.internal:3306/railway
STORAGE_PATH=.storage/documents
VITE_APP_TITLE=文档相似度分析系统
ENVEOF
    
    if [ -f "$ENV_FILE" ]; then
        print_success "环境变量文件已创建: $ENV_FILE"
    else
        print_error "环境变量文件创建失败"
        exit 1
    fi
    
    echo ""
    
    print_header "第 4 步: 部署步骤"
    
    cat << 'EOF'
请按照以下步骤在 Railway 中部署应用:

【步骤 1】创建 Railway 项目
  1. 访问 https://railway.app
  2. 使用 GitHub 账户登录
  3. 点击 "New Project"
  4. 选择 "Deploy from GitHub repo"
  5. 搜索 doc-similarity-analyzer
  6. 点击 "Deploy"

【步骤 2】添加 MySQL 数据库
  1. 点击 "Add Service"
  2. 选择 "Database" → "MySQL"
  3. 等待启动完成

【步骤 3】配置环境变量
  在 Railway 中添加以下环境变量:

EOF

    echo -e "${YELLOW}必需的环境变量:${NC}"
    echo ""
    echo -e "  ${CYAN}NODE_ENV${NC} = ${GREEN}production${NC}"
    echo -e "  ${CYAN}JWT_SECRET${NC} = ${GREEN}$JWT_SECRET${NC}"
    echo -e "  ${CYAN}PORT${NC} = ${GREEN}3000${NC}"
    echo -e "  ${CYAN}LOG_LEVEL${NC} = ${GREEN}info${NC}"
    echo ""
    
    echo -e "${YELLOW}数据库变量 (由 Railway 自动提供):${NC}"
    echo ""
    echo -e "  ${CYAN}DATABASE_URL${NC} = ${GREEN}<由 Railway MySQL 自动生成>${NC}"
    echo ""
    
    cat << 'EOF'
【步骤 4】部署
  1. 所有环境变量配置完成后，Railway 自动开始构建
  2. 在 "Deployments" 标签查看进度
  3. 部署完成后点击 "Open" 访问应用

EOF

    print_header "第 5 步: 验证部署"
    
    cat << 'EOF'
部署完成后，运行以下命令验证:

  ./scripts/verify-deployment.sh <your-app-url>

例如:
  ./scripts/verify-deployment.sh https://your-app.railway.app

EOF

    print_header "快速参考"
    
    cat << 'EOF'
【重要文件】

  .env.railway              环境变量文件
  railway.json              Railway 配置
  Dockerfile                Docker 构建配置
  .railwayignore            部署忽略文件

【重要命令】

  生成 JWT_SECRET:
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

  本地测试构建:
    pnpm build

  本地开发运行:
    pnpm dev

  本地生产运行:
    NODE_ENV=production pnpm start

【文档参考】

  快速部署:     RAILWAY_QUICK_START.md
  详细部署:     RAILWAY_SETUP_GUIDE.md
  完整参考:     RAILWAY_DEPLOYMENT.md
  部署检查:     RAILWAY_DEPLOYMENT_READY.md

EOF

    print_header "部署准备完成！"
    
    cat << 'EOF'
✅ 所有准备工作已完成！

下一步:
  1. 复制上面的 JWT_SECRET 值
  2. 访问 https://railway.app
  3. 按照步骤创建项目并配置环境变量
  4. 开始部署

需要帮助?
  - 查看 RAILWAY_QUICK_START.md (快速部署)
  - 查看 RAILWAY_SETUP_GUIDE.md (详细部署)
  - 查看 RAILWAY_DEPLOYMENT.md (完整参考)

EOF

    # 尝试复制到剪贴板
    if command -v xclip &> /dev/null; then
        echo "$JWT_SECRET" | xclip -selection clipboard
        print_success "JWT_SECRET 已复制到剪贴板"
    elif command -v pbcopy &> /dev/null; then
        echo "$JWT_SECRET" | pbcopy
        print_success "JWT_SECRET 已复制到剪贴板"
    fi
    
    echo ""
}

# 运行主函数
main "$@"
