import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/DashboardNew";
import ResultDetail from "./pages/ResultDetail";
import History from "./pages/History";
import VersionComparison from "./pages/VersionComparison";
import BatchComparison from "./pages/BatchComparison";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserManagement from "./pages/UserManagement";
import AdminDashboard from "./pages/AdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/user-management" component={UserManagement} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/results/:taskId" component={ResultDetail} />
      <Route path="/history" component={History} />
      <Route path="/version-comparison" component={VersionComparison} />
      <Route path="/batch-comparison" component={BatchComparison} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
