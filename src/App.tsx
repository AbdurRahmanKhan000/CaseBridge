import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';
import { FaqPage } from './pages/FaqPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SecurityPage } from './pages/SecurityPage';
import { SubmitCasePage } from './pages/SubmitCasePage';
import { TrackCasePage } from './pages/TrackCasePage';
import { CaseDetailsStudentPage } from './pages/CaseDetailsStudentPage';
import { LoginPage } from './pages/LoginPage';
import { PortalLayout } from './pages/portal/PortalLayout';
import { DashboardPage } from './pages/portal/DashboardPage';
import { CaseListPage } from './pages/portal/CaseListPage';
import { CaseDetailPage } from './pages/portal/CaseDetailPage';
import { AdminUsersPage } from './pages/portal/AdminUsersPage';
import { AdminCategoriesPage } from './pages/portal/AdminCategoriesPage';
import { AdminSettingsPage } from './pages/portal/AdminSettingsPage';
import { AdminAuditPage } from './pages/portal/AdminAuditPage';
import { ErrorView } from './pages/ErrorPages';
import { store } from './services/store';
import { User } from './types';
import { StaffPortalGate } from './components/StaffPortalGate';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.pathname) {
      return window.location.pathname;
    }
    return '/';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => store.getCurrentUser());
  const [isPortalUnlocked, setIsPortalUnlocked] = useState(false);
  const categories = store.getCategories(true);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setCurrentUser(store.getCurrentUser());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.scrollTo(0, 0);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    navigate('/portal/dashboard');
  };

  const handleLogout = () => {
    store.logoutUser();
    setCurrentUser(null);
    setIsPortalUnlocked(false);
    navigate('/');
  };

  // Route Dispatcher
  const renderRoute = () => {
    // 1. Staff Portal Routes
    if (currentPath.startsWith('/portal')) {
      if (!isPortalUnlocked) {
        return <StaffPortalGate onUnlock={() => setIsPortalUnlocked(true)} />;
      }

      if (!currentUser) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
      }

      // Check subroutes
      if (currentPath === '/portal/dashboard' || currentPath === '/portal') {
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/dashboard"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <DashboardPage currentUser={currentUser} onNavigate={navigate} />
          </PortalLayout>
        );
      }

      if (currentPath === '/portal/cases') {
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/cases"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <CaseListPage currentUser={currentUser} onNavigate={navigate} />
          </PortalLayout>
        );
      }

      if (currentPath.startsWith('/portal/cases/')) {
        const caseId = currentPath.replace('/portal/cases/', '');
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath={currentPath}
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <CaseDetailPage caseId={caseId} currentUser={currentUser} onNavigate={navigate} />
          </PortalLayout>
        );
      }

      if (currentPath === '/portal/admin/users') {
        if (currentUser.role !== 'SYSTEM_ADMIN') {
          return (
            <PortalLayout
              currentUser={currentUser}
              currentPath={currentPath}
              onNavigate={navigate}
              onLogout={handleLogout}
            >
              <ErrorView type="403" onNavigate={navigate} />
            </PortalLayout>
          );
        }
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/admin/users"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <AdminUsersPage currentUser={currentUser} />
          </PortalLayout>
        );
      }

      if (currentPath === '/portal/admin/categories') {
        if (currentUser.role !== 'SYSTEM_ADMIN') {
          return (
            <PortalLayout
              currentUser={currentUser}
              currentPath={currentPath}
              onNavigate={navigate}
              onLogout={handleLogout}
            >
              <ErrorView type="403" onNavigate={navigate} />
            </PortalLayout>
          );
        }
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/admin/categories"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <AdminCategoriesPage />
          </PortalLayout>
        );
      }

      if (currentPath === '/portal/admin/settings') {
        if (currentUser.role !== 'SYSTEM_ADMIN') {
          return (
            <PortalLayout
              currentUser={currentUser}
              currentPath={currentPath}
              onNavigate={navigate}
              onLogout={handleLogout}
            >
              <ErrorView type="403" onNavigate={navigate} />
            </PortalLayout>
          );
        }
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/admin/settings"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <AdminSettingsPage />
          </PortalLayout>
        );
      }

      if (currentPath === '/portal/admin/audit') {
        return (
          <PortalLayout
            currentUser={currentUser}
            currentPath="/portal/admin/audit"
            onNavigate={navigate}
            onLogout={handleLogout}
          >
            <AdminAuditPage />
          </PortalLayout>
        );
      }

      return (
        <PortalLayout
          currentUser={currentUser}
          currentPath={currentPath}
          onNavigate={navigate}
          onLogout={handleLogout}
        >
          <ErrorView type="404" onNavigate={navigate} />
        </PortalLayout>
      );
    }

    // 2. Public Routes
    if (currentPath === '/') {
      return <HomePage onNavigate={navigate} categories={categories} />;
    }

    if (currentPath === '/how-it-works') {
      return <HowItWorksPage onNavigate={navigate} />;
    }

    if (currentPath === '/about') {
      return <AboutPage onNavigate={navigate} />;
    }

    if (currentPath === '/faq') {
      return <FaqPage onNavigate={navigate} />;
    }

    if (currentPath === '/privacy') {
      return <PrivacyPage onNavigate={navigate} />;
    }

    if (currentPath === '/security') {
      return <SecurityPage onNavigate={navigate} />;
    }

    if (currentPath === '/submit') {
      return <SubmitCasePage categories={categories} onNavigate={navigate} />;
    }

    if (currentPath === '/track') {
      return <TrackCasePage onNavigate={navigate} />;
    }

    if (currentPath.startsWith('/track/')) {
      const code = decodeURIComponent(currentPath.replace('/track/', ''));
      return <CaseDetailsStudentPage trackingCode={code} onNavigate={navigate} />;
    }

    if (currentPath === '/login') {
      if (!isPortalUnlocked) {
        return <StaffPortalGate onUnlock={() => setIsPortalUnlocked(true)} />;
      }
      return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />;
    }

    return <ErrorView type="404" onNavigate={navigate} />;
  };

  const isStaffArea = currentPath.startsWith('/portal');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!isStaffArea && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1">
        {renderRoute()}
      </main>

      {!isStaffArea && (
        <Footer onNavigate={navigate} />
      )}
    </div>
  );
}
