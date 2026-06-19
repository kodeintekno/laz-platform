import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { RequirePermission } from "@/auth/RequirePermission";
import { PERMISSIONS } from "@shared/constants/permissions";

// Public pages
import { HomePage } from "@/pages/Home";
import { ProgramsPage } from "@/pages/Programs";
import { ProgramDetailPage } from "@/pages/ProgramDetail";
import { DonatePage } from "@/pages/Donate";

// Auth pages
import { LoginPage } from "@/pages/auth/Login";
import { RegisterPage } from "@/pages/auth/Register";

// Dashboard pages
import { OverviewPage } from "@/pages/dashboard/Overview";
import { ProgramsListPage } from "@/pages/dashboard/programs/ProgramsListPage";
import { NewProgramPage } from "@/pages/dashboard/programs/NewProgramPage";
import { EditProgramPage } from "@/pages/dashboard/programs/EditProgramPage";
import { NewDistributionForProgramPage } from "@/pages/dashboard/programs/NewDistributionForProgramPage";
import { DonationsListPage } from "@/pages/dashboard/donations/DonationsListPage";
import { NewDonationPage } from "@/pages/dashboard/donations/NewDonationPage";
import { EditDonationPage } from "@/pages/dashboard/donations/EditDonationPage";
import { DistributionsListPage } from "@/pages/dashboard/distributions/DistributionsListPage";
import { PaymentsListPage } from "@/pages/dashboard/payments/PaymentsListPage";
import { UsersListPage } from "@/pages/dashboard/users/UsersListPage";
import { NewUserPage } from "@/pages/dashboard/users/NewUserPage";
import { EditUserPage } from "@/pages/dashboard/users/EditUserPage";
import { LazListPage } from "@/pages/dashboard/laz/LazListPage";
import { NewLazPage } from "@/pages/dashboard/laz/NewLazPage";
import { EditLazPage } from "@/pages/dashboard/laz/EditLazPage";
import { RbacPage } from "@/pages/dashboard/rbac/RbacPage";
import { ReportsPage } from "@/pages/dashboard/reports/ReportsPage";
import { SettingsPage } from "@/pages/dashboard/settings/SettingsPage";
import { AuditPage } from "@/pages/dashboard/audit/AuditPage";

export const router = createBrowserRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/programs", element: <ProgramsPage /> },
      { path: "/programs/:slug", element: <ProgramDetailPage /> },
      { path: "/donate/:slug", element: <DonatePage /> },
    ],
  },
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  // Protected dashboard routes
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      // Programs
      {
        path: "programs",
        element: (
          <RequirePermission permission={PERMISSIONS.PROGRAMS_READ}>
            <ProgramsListPage />
          </RequirePermission>
        ),
      },
      {
        path: "programs/new",
        element: (
          <RequirePermission permission={PERMISSIONS.PROGRAMS_CREATE}>
            <NewProgramPage />
          </RequirePermission>
        ),
      },
      {
        path: "programs/:slug/edit",
        element: (
          <RequirePermission permission={PERMISSIONS.PROGRAMS_UPDATE}>
            <EditProgramPage />
          </RequirePermission>
        ),
      },
      {
        path: "programs/:slug/distributions/new",
        element: (
          <RequirePermission permission={PERMISSIONS.DISTRIBUTIONS_MANAGE}>
            <NewDistributionForProgramPage />
          </RequirePermission>
        ),
      },
      // Donations
      {
        path: "donations",
        element: (
          <RequirePermission permission={PERMISSIONS.DONATIONS_READ}>
            <DonationsListPage />
          </RequirePermission>
        ),
      },
      {
        path: "donations/new",
        element: (
          <RequirePermission permission={PERMISSIONS.DONATIONS_CREATE}>
            <NewDonationPage />
          </RequirePermission>
        ),
      },
      {
        path: "donations/:id/edit",
        element: (
          <RequirePermission permission={PERMISSIONS.DONATIONS_UPDATE}>
            <EditDonationPage />
          </RequirePermission>
        ),
      },
      // Distributions
      {
        path: "distributions",
        element: (
          <RequirePermission permission={PERMISSIONS.DISTRIBUTIONS_READ}>
            <DistributionsListPage />
          </RequirePermission>
        ),
      },
      // Payments
      {
        path: "payments",
        element: (
          <RequirePermission permission={PERMISSIONS.PAYMENTS_READ}>
            <PaymentsListPage />
          </RequirePermission>
        ),
      },
      // Users
      {
        path: "users",
        element: (
          <RequirePermission permission={PERMISSIONS.USERS_READ}>
            <UsersListPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/new",
        element: (
          <RequirePermission permission={PERMISSIONS.USERS_CREATE}>
            <NewUserPage />
          </RequirePermission>
        ),
      },
      {
        path: "users/:id/edit",
        element: (
          <RequirePermission permission={PERMISSIONS.USERS_UPDATE}>
            <EditUserPage />
          </RequirePermission>
        ),
      },
      // LAZ
      {
        path: "laz",
        element: (
          <RequirePermission permission={PERMISSIONS.LAZ_MANAGE}>
            <LazListPage />
          </RequirePermission>
        ),
      },
      {
        path: "laz/new",
        element: (
          <RequirePermission permission={PERMISSIONS.LAZ_MANAGE}>
            <NewLazPage />
          </RequirePermission>
        ),
      },
      {
        path: "laz/:id/edit",
        element: (
          <RequirePermission permission={PERMISSIONS.LAZ_MANAGE}>
            <EditLazPage />
          </RequirePermission>
        ),
      },
      // RBAC
      {
        path: "rbac",
        element: (
          <RequirePermission permission={PERMISSIONS.ROLES_MANAGE}>
            <RbacPage />
          </RequirePermission>
        ),
      },
      // Reports
      {
        path: "reports",
        element: (
          <RequirePermission permission={PERMISSIONS.REPORTS_READ}>
            <ReportsPage />
          </RequirePermission>
        ),
      },
      // Settings
      { path: "settings", element: <SettingsPage /> },
      // Audit
      {
        path: "audit",
        element: (
          <RequirePermission permission={PERMISSIONS.AUDIT_READ}>
            <AuditPage />
          </RequirePermission>
        ),
      },
    ],
  },
  // Catch-all
  { path: "*", element: <Navigate to="/" replace /> },
]);
