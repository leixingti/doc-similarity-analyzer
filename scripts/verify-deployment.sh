#!/bin/bash

##############################################################################
# Railway 部署验证脚本
# 
# 用途: 验证应用在 Railway 上的部署状态
# 功能:
#   1. 检查应用是否在线
#   2. 验证数据库连接
#   3. 检查健康状态
#   4. 验证关键端点
#
# 使用方法:
#   chmod +x scripts/verify-deployment.sh
#   ./scripts/verify-deployment.sh <app-url>
#   
#   示例:
#   ./scripts/verify-deployment.sh https://your-app.railway.app
#
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
# 检查参数
##############################################################################

if [ -z "$1" ]; then
    echo -e "${RED}错误: 请提供应用 URL${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 <app-url>"
    echo ""
    echo "示例:"
    echo "  $0 https://your-app.railway.app"
    echo "  $0 https://doc-analyzer.railway.app"
    exit 1
fi

APP_URL="$1"

# 确保 URL 以 https:// 开头
if [[ ! "$APP_URL" =~ ^https?:// ]]; then
    APP_URL="https://$APP_URL"
fi

# 移除末尾的斜杠
APP_URL="${APP_URL%/}"

print_header "Railway 部署验证"

print_info "应用 URL: $APP_URL"

##############################################################################
# 检查应用是否在线
##############################################################################

check_app_online() {
    print_header "检查应用是否在线"
    
    print_info "正在连接到应用..."
    
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL" > /tmp/http_code.txt; then
        HTTP_CODE=$(cat /tmp/http_code.txt)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
            print_success "应用在线 (HTTP $HTTP_CODE)"
            return 0
        else
            print_warning "应用响应异常 (HTTP $HTTP_CODE)"
            return 1
        fi
    else
        print_error "无法连接到应用"
        return 1
    fi
}

##############################################################################
# 检查健康端点
##############################################################################

check_health_endpoint() {
    print_header "检查健康状态端点"
    
    HEALTH_URL="$APP_URL/health"
    print_info "检查端点: $HEALTH_URL"
    
    if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" > /tmp/health_code.txt; then
        HTTP_CODE=$(cat /tmp/health_code.txt)
        
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "健康检查通过 (HTTP $HTTP_CODE)"
            return 0
        else
            print_warning "健康检查异常 (HTTP $HTTP_CODE)"
            return 1
        fi
    else
        print_error "无法访问健康检查端点"
        return 1
    fi
}

##############################################################################
# 检查 API 端点
##############################################################################

check_api_endpoint() {
    print_header "检查 API 端点"
    
    API_URL="$APP_URL/api"
    print_info "检查端点: $API_URL"
    
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL" > /tmp/api_code.txt; then
        HTTP_CODE=$(cat /tmp/api_code.txt)
        
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "405" ]; then
            print_success "API 端点可访问 (HTTP $HTTP_CODE)"
            return 0
        else
            print_warning "API 端点异常 (HTTP $HTTP_CODE)"
            return 1
        fi
    else
        print_error "无法访问 API 端点"
        return 1
    fi
}

##############################################################################
# 检查响应时间
##############################################################################

check_response_time() {
    print_header "检查响应时间"
    
    print_info "测试应用响应速度..."
    
    START_TIME=$(date +%s%N)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
    END_TIME=$(date +%s%N)
    
    # 计算响应时间（毫秒）
    RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))
    
    print_info "响应时间: ${RESPONSE_TIME}ms"
    
    if [ "$RESPONSE_TIME" -lt 1000 ]; then
        print_success "响应时间良好 (< 1s)"
        return 0
    elif [ "$RESPONSE_TIME" -lt 3000 ]; then
        print_warning "响应时间一般 (1-3s)"
        return 0
    else
        print_warning "响应时间较慢 (> 3s)"
        return 1
    fi
}

##############################################################################
# 检查 SSL 证书
##############################################################################

check_ssl_certificate() {
    print_header "检查 SSL 证书"
    
    if [[ "$APP_URL" =~ ^https:// ]]; then
        DOMAIN=$(echo "$APP_URL" | sed 's|https://||' | cut -d'/' -f1)
        print_info "检查域名: $DOMAIN"
        
        # 获取证书信息
        CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
        
        if [ -n "$CERT_INFO" ]; then
            EXPIRY=$(echo "$CERT_INFO" | grep "Not After" | awk '{print $4, $5, $6, $7}')
            print_success "SSL 证书有效"
            print_info "证书过期日期: $EXPIRY"
            return 0
        else
            print_warning "无法获取 SSL 证书信息"
            return 1
        fi
    else
        print_warning "应用使用 HTTP，未检查 SSL 证书"
        return 0
    fi
}

##############################################################################
# 显示诊断信息
##############################################################################

show_diagnostics() {
    print_header "诊断信息"
    
    print_info "应用 URL: $APP_URL"
    print_info "当前时间: $(date)"
    print_info "系统: $(uname -s)"
    
    # 检查网络连接
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_success "网络连接正常"
    else
        print_warning "网络连接可能有问题"
    fi
}

##############################################################################
# 显示建议
##############################################################################

show_recommendations() {
    print_header "建议"
    
    cat << 'EOF'
如果部署验证失败，请检查以下几点:

1. 应用是否正在运行
   - 在 Railway 控制面板中查看应用状态
   - 检查是否有构建或部署错误

2. 环境变量是否正确配置
   - 验证 DATABASE_URL 是否正确
   - 检查 JWT_SECRET 是否已设置
   - 确保 NODE_ENV 设置为 production

3. 数据库是否已启动
   - 在 Railway 控制面板中查看 MySQL 状态
   - 检查数据库连接字符串是否正确

4. 查看应用日志
   - 在 Railway 控制面板中点击 "Logs" 标签
   - 查找错误信息和警告

5. 检查防火墙和网络
   - 确保应用端口已打开
   - 检查网络连接是否正常

6. 等待部署完成
   - 新部署可能需要几分钟才能完全启动
   - 检查 "Deployments" 标签中的部署状态

EOF
}

##############################################################################
# 生成验证报告
##############################################################################

generate_report() {
    print_header "验证报告"
    
    local report_file="/tmp/railway-verification-report.txt"
    
    cat > "$report_file" << EOF
Railway 部署验证报告
====================

生成时间: $(date)
应用 URL: $APP_URL

验证结果:
---------
EOF
    
    echo ""
    echo "验证报告已保存到: $report_file"
    cat "$report_file"
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
║            Railway 部署验证脚本 - 文档相似度分析器            ║
║                                                                ║
║  此脚本将验证应用在 Railway 上的部署状态                      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    # 执行各个检查
    CHECKS_PASSED=0
    CHECKS_TOTAL=0
    
    # 检查 1: 应用是否在线
    ((CHECKS_TOTAL++))
    if check_app_online; then
        ((CHECKS_PASSED++))
    fi
    
    # 检查 2: 健康端点
    ((CHECKS_TOTAL++))
    if check_health_endpoint; then
        ((CHECKS_PASSED++))
    fi
    
    # 检查 3: API 端点
    ((CHECKS_TOTAL++))
    if check_api_endpoint; then
        ((CHECKS_PASSED++))
    fi
    
    # 检查 4: 响应时间
    ((CHECKS_TOTAL++))
    if check_response_time; then
        ((CHECKS_PASSED++))
    fi
    
    # 检查 5: SSL 证书
    ((CHECKS_TOTAL++))
    if check_ssl_certificate; then
        ((CHECKS_PASSED++))
    fi
    
    # 显示诊断信息
    show_diagnostics
    
    # 显示建议
    show_recommendations
    
    # 生成报告
    generate_report
    
    # 显示总结
    print_header "验证总结"
    
    echo -e "通过检查: ${GREEN}$CHECKS_PASSED${NC} / $CHECKS_TOTAL"
    
    if [ "$CHECKS_PASSED" = "$CHECKS_TOTAL" ]; then
        print_success "所有检查都已通过！部署成功！"
        exit 0
    elif [ "$CHECKS_PASSED" -ge $((CHECKS_TOTAL / 2)) ]; then
        print_warning "部分检查失败，请查看上面的建议"
        exit 1
    else
        print_error "大多数检查失败，部署可能有问题"
        exit 1
    fi
}

# 运行主函数
main "$@"
