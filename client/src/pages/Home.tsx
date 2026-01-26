import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { FileText, Zap, Shield, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    window.location.href = "/dashboard";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">文档相似度分析系统</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>登录</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight">
            智能文档相似度分析
          </h1>
          <p className="text-xl text-muted-foreground">
            支持多种文档格式，结合传统算法与AI智能分析，快速检测文档相似性
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                开始使用 <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">了解更多</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">核心功能</h2>
          <p className="text-muted-foreground">强大的分析能力，专业的结果展示</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>多格式支持</CardTitle>
              <CardDescription>
                支持DOCX、PDF、TXT、PPTX、XLSX、Markdown、HTML等7种常用文档格式
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>双重分析引擎</CardTitle>
              <CardDescription>
                传统算法（余弦、Jaccard、TF-IDF）+ DeepSeek AI智能分析
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>风险评估</CardTitle>
              <CardDescription>
                AI自动评估相似度风险等级，提供详细的改进建议
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>可视化报告</CardTitle>
              <CardDescription>
                雷达图、柱状图等多维度可视化展示，支持PDF导出
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">立即开始分析</h2>
            <p className="text-lg mb-6 opacity-90">
              注册登录，免费使用文档相似度分析服务
            </p>
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>免费注册</a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 文档相似度分析系统. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
