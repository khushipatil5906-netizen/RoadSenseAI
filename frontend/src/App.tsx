import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportDamagePage } from './pages/ReportDamagePage';
import { DamageAnalysisPage } from './pages/DamageAnalysisPage';
import { DamageMapPage } from './pages/DamageMapPage';
import { PriorityManagementPage } from './pages/PriorityManagementPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelInfoPage } from './pages/ModelInfoPage';

export function AppContent() {
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const handleNavigate = (page: string, reportId?: number) => {
    if (reportId !== undefined) {
      setSelectedReportId(reportId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = (page: string): string => {
    switch (page) {
      case 'dashboard':
        return 'Infrastructure Dashboard';
      case 'map':
        return 'Interactive Road GIS Map';
      case 'report':
        return 'Report Road Damage';
      case 'analysis':
        return 'AI Damage Severity Analysis';
      case 'priority':
        return 'Repair Priority Management';
      case 'workflow':
        return 'Inspection & Repair Workflow';
      case 'analytics':
        return 'Analytics & Reports';
      case 'model':
        return 'ML Architecture & Metrics';
      case 'landing':
        return 'Public Civic Portal';
      case 'login':
        return 'User Sign In';
      case 'register':
        return 'Create Account';
      default:
        return 'RoadSense AI Platform';
    }
  };

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'map':
        return <DamageMapPage onNavigate={handleNavigate} />;
      case 'report':
        return <ReportDamagePage onNavigate={handleNavigate} />;
      case 'analysis':
        return <DamageAnalysisPage reportId={selectedReportId} onNavigate={handleNavigate} />;
      case 'priority':
        return <PriorityManagementPage onNavigate={handleNavigate} />;
      case 'workflow':
        return <WorkflowPage initialReportId={selectedReportId} onNavigate={handleNavigate} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'model':
        return <ModelInfoPage />;
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Dark Navy Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={handleNavigate}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 2xl:pl-80 min-h-screen">
        <Navbar
          title={getPageTitle(activePage)}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          setActivePage={handleNavigate}
        />

        <main className="flex-1 p-5 sm:p-7 md:p-8 lg:p-10 w-full max-w-[1780px] 2xl:max-w-[2040px] mx-auto transition-all">
          {renderCurrentPage()}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
