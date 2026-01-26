# 前端用户体验优化指南

## 概述

本文档提供了一系列前端用户体验优化的建议和最佳实践，旨在提升应用的易用性、可访问性和性能。

## 1. 加载状态和骨架屏

### 问题
用户在等待数据加载时，页面可能显示空白或无响应，导致用户困惑。

### 解决方案

```typescript
// 使用骨架屏组件
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 在组件中使用
export function DocumentList() {
  const { data, isLoading } = useDocuments();

  if (isLoading) {
    return <DocumentListSkeleton />;
  }

  return (
    <div>
      {data?.map((doc) => (
        <DocumentItem key={doc.id} doc={doc} />
      ))}
    </div>
  );
}
```

## 2. 错误处理和用户反馈

### 问题
当发生错误时，用户可能不知道发生了什么，导致困惑和沮丧。

### 解决方案

```typescript
// 创建错误边界组件
import { useEffect } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
  return (error: Error | null, context: string) => {
    if (!error) return;

    const errorMessage = error.message || "发生了一个错误";
    const errorCode = (error as any).code;

    // 根据错误类型显示不同的提示
    switch (errorCode) {
      case "UNAUTHORIZED":
        toast.error("请登录后继续");
        break;
      case "FORBIDDEN":
        toast.error("您没有权限执行此操作");
        break;
      case "NOT_FOUND":
        toast.error("资源不存在");
        break;
      case "VALIDATION_ERROR":
        toast.error(`验证失败: ${errorMessage}`);
        break;
      default:
        toast.error(`${context}: ${errorMessage}`);
    }

    // 记录错误日志
    console.error(`[${context}]`, error);
  };
}

// 在组件中使用
export function FileUpload() {
  const handleError = useErrorHandler();
  const uploadMutation = trpc.files.upload.useMutation({
    onError: (error) => {
      handleError(error as Error, "文件上传");
    },
  });

  return (
    <button onClick={() => uploadMutation.mutate(file)}>
      {uploadMutation.isPending ? "上传中..." : "上传"}
    </button>
  );
}
```

## 3. 表单验证和提示

### 问题
用户在填写表单时，可能不知道字段的要求或输入是否有效。

### 解决方案

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少需要 8 个字符")
    .regex(/[A-Z]/, "密码必须包含至少一个大写字母")
    .regex(/[a-z]/, "密码必须包含至少一个小写字母")
    .regex(/[0-9]/, "密码必须包含至少一个数字"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const { register, formState: { errors }, watch } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password");

  return (
    <form>
      <div>
        <input {...register("email")} placeholder="邮箱" />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      <div>
        <input
          {...register("password")}
          type="password"
          placeholder="密码"
        />
        {errors.password && (
          <span className="text-red-500 text-sm">{errors.password.message}</span>
        )}
        {/* 密码强度指示器 */}
        <PasswordStrengthIndicator password={password} />
      </div>

      <div>
        <input
          {...register("confirmPassword")}
          type="password"
          placeholder="确认密码"
        />
        {errors.confirmPassword && (
          <span className="text-red-500 text-sm">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>
    </form>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = calculatePasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i < strength ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {strength === 0 && "密码强度: 弱"}
        {strength === 1 && "密码强度: 一般"}
        {strength === 2 && "密码强度: 良好"}
        {strength === 3 && "密码强度: 强"}
        {strength === 4 && "密码强度: 非常强"}
      </p>
    </div>
  );
}

function calculatePasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return Math.min(strength, 4);
}
```

## 4. 响应式设计

### 问题
应用在不同设备上的显示效果不一致，导致移动设备用户体验差。

### 解决方案

```typescript
// 使用 Tailwind CSS 的响应式类
export function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="col-span-1 md:col-span-2">
        <h2 className="text-lg md:text-xl lg:text-2xl">主要内容</h2>
      </Card>
      <Card>
        <h2 className="text-sm md:text-base lg:text-lg">侧边栏</h2>
      </Card>
    </div>
  );
}

// 使用媒体查询钩子
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function ResponsiveMenu() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileMenu /> : <DesktopMenu />;
}
```

## 5. 无障碍访问 (Accessibility)

### 问题
应用可能不适合使用屏幕阅读器或键盘导航的用户。

### 解决方案

```typescript
// 添加 ARIA 标签和语义 HTML
export function FileUploadButton() {
  return (
    <button
      aria-label="上传文档"
      aria-describedby="upload-help"
      onClick={handleUpload}
    >
      <UploadIcon className="w-5 h-5" />
      <span>上传</span>
    </button>
  );
}

// 使用语义 HTML
export function DocumentList() {
  return (
    <section aria-label="我的文档">
      <h2 className="text-2xl font-bold mb-4">我的文档</h2>
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            <article>
              <h3>{doc.name}</h3>
              <p>{doc.description}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

// 确保键盘导航
export function NavigationMenu() {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setFocusIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      setFocusIndex((i) => (i - 1 + items.length) % items.length);
    }
  };

  return (
    <nav onKeyDown={handleKeyDown}>
      {items.map((item, i) => (
        <a
          key={i}
          href={item.href}
          tabIndex={i === focusIndex ? 0 : -1}
          className={i === focusIndex ? "bg-blue-500" : ""}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

## 6. 性能优化

### 问题
应用加载缓慢，导致用户体验差。

### 解决方案

```typescript
// 使用代码分割
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analysis = lazy(() => import("./pages/Analysis"));

export function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis" element={<Analysis />} />
      </Routes>
    </Suspense>
  );
}

// 使用虚拟滚动处理大列表
import { FixedSizeList } from "react-window";

export function LargeDocumentList({ documents }: { documents: Document[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="border-b">
      <DocumentItem doc={documents[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={documents.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

// 使用 React Query 的缓存
export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const response = await fetch("/api/documents");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
    cacheTime: 10 * 60 * 1000, // 10 分钟
  });
}
```

## 7. 暗色模式支持

### 问题
应用只支持浅色模式，某些用户可能更喜欢暗色模式。

### 解决方案

```typescript
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="切换主题"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

// 在 Tailwind CSS 中配置
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {},
  },
};

// 使用暗色模式类
export function Card() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* 内容 */}
    </div>
  );
}
```

## 8. 实时通知和更新

### 问题
用户可能不知道后台发生的更新或事件。

### 解决方案

```typescript
import { useEffect } from "react";
import { toast } from "sonner";

export function useRealtimeUpdates() {
  useEffect(() => {
    // 使用 WebSocket 或 Server-Sent Events
    const eventSource = new EventSource("/api/events");

    eventSource.addEventListener("document-uploaded", (e) => {
      const data = JSON.parse(e.data);
      toast.success(`文档 ${data.name} 已上传`);
    });

    eventSource.addEventListener("analysis-complete", (e) => {
      const data = JSON.parse(e.data);
      toast.success(`分析完成: ${data.title}`);
    });

    return () => eventSource.close();
  }, []);
}

// 在应用中使用
export function App() {
  useRealtimeUpdates();
  return <Dashboard />;
}
```

## 9. 快捷键支持

### 问题
用户可能不知道可用的快捷键，导致效率低下。

### 解决方案

```typescript
import { useEffect } from "react";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K: 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // 打开搜索对话框
      }

      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // 保存当前文档
      }

      // Escape: 关闭对话框
      if (e.key === "Escape") {
        // 关闭打开的对话框
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

// 显示快捷键提示
export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogContent>
        <h2 className="text-lg font-bold mb-4">键盘快捷键</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>搜索</span>
            <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + K</kbd>
          </div>
          <div className="flex justify-between">
            <span>保存</span>
            <kbd className="bg-gray-200 px-2 py-1 rounded">Ctrl + S</kbd>
          </div>
          <div className="flex justify-between">
            <span>关闭</span>
            <kbd className="bg-gray-200 px-2 py-1 rounded">Esc</kbd>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## 10. 用户引导和帮助

### 问题
新用户可能不知道如何使用应用的各项功能。

### 解决方案

```typescript
import { useEffect, useState } from "react";

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      target: "[data-tour='upload']",
      title: "上传文档",
      description: "点击这里上传您的第一个文档",
    },
    {
      target: "[data-tour='analyze']",
      title: "分析文档",
      description: "选择文档后，点击这里进行分析",
    },
    {
      target: "[data-tour='results']",
      title: "查看结果",
      description: "分析完成后，您可以在这里查看结果",
    },
  ];

  return { step, steps, isComplete, setStep, setIsComplete };
}

// 在组件中使用
export function Dashboard() {
  const { step, steps, isComplete } = useOnboarding();

  if (isComplete) return null;

  const currentStep = steps[step];

  return (
    <>
      <div data-tour="upload">
        <button>上传</button>
      </div>

      {/* 显示引导提示 */}
      <Tooltip
        target={currentStep.target}
        title={currentStep.title}
        description={currentStep.description}
      />
    </>
  );
}
```

## 总结

通过实施这些优化，您可以显著提升应用的用户体验，使其更易用、更易访问、更高效。记住，用户体验是一个持续的过程，需要定期收集用户反馈并进行改进。
