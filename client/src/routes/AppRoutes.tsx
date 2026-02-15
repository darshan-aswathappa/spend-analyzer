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
import { ImpulseSpendingPage } from "@/features/risk-assessment/ImpulseSpendingPage";
import { CategoryHeatmapPage } from "@/features/risk-assessment/CategoryHeatmapPage";
import { MerchantRiskPage } from "@/features/risk-assessment/MerchantRiskPage";
import { PaymentBehaviorPage } from "@/features/risk-assessment/PaymentBehaviorPage";
import { SpendingVelocityPage } from "@/features/risk-assessment/SpendingVelocityPage";
import { WealthFlowListPage } from "@/features/wealth-management/WealthFlowListPage";
import { WealthManagementPage } from "@/features/wealth-management/WealthManagementPage";
import { ProfileSettingsPage } from "@/features/settings/ProfileSettingsPage";
import { TaxSummaryPage } from "@/features/tax-summary/TaxSummaryPage";
import { ComparisonPage } from "@/features/comparison/ComparisonPage";

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
        <Route path="/risk-assessment/impulse" element={<ImpulseSpendingPage />} />
        <Route path="/risk-assessment/heatmap" element={<CategoryHeatmapPage />} />
        <Route path="/risk-assessment/merchants" element={<MerchantRiskPage />} />
        <Route path="/risk-assessment/payments" element={<PaymentBehaviorPage />} />
        <Route path="/risk-assessment/velocity" element={<SpendingVelocityPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/wealth-management" element={<WealthFlowListPage />} />
        <Route
          path="/wealth-management/:flowId"
          element={<WealthManagementPage />}
        />
        <Route path="/settings/profile" element={<ProfileSettingsPage />} />
        <Route path="/tax-summary" element={<TaxSummaryPage />} />
        <Route path="/comparison" element={<ComparisonPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
