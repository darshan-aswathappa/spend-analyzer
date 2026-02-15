import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { AuthCallback } from "@/features/auth/AuthCallback";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { StatementsPage } from "@/features/statements/StatementsPage";
import { ChatPage } from "@/features/chat/ChatPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { RiskAssessmentPage } from "@/features/risk-assessment/RiskAssessmentPage";
import { WealthFlowListPage } from "@/features/wealth-management/WealthFlowListPage";
import { WealthManagementPage } from "@/features/wealth-management/WealthManagementPage";
import { ProfileSettingsPage } from "@/features/settings/ProfileSettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/demo" element={<LoginPage demo />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/statements" element={<StatementsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/risk-assessment" element={<RiskAssessmentPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/wealth-management" element={<WealthFlowListPage />} />
        <Route
          path="/wealth-management/:flowId"
          element={<WealthManagementPage />}
        />
        <Route path="/settings/profile" element={<ProfileSettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
