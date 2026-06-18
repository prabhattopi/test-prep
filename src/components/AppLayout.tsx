import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, FileEdit, Activity, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTestStore } from '../store/useTestStore';
import Logo from '../assets/logo.png';
export const AppLayout: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const initializeNewTest = useTestStore((state) => state.initializeNewTest);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ✅ Custom click handler for "Test Creation" sidebar link
  const handleTestCreationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    initializeNewTest(); // Always fresh test
    navigate('/tests/new');
  };

  return (
    <div className="h-screen w-full flex bg-bg-main overflow-hidden">
      <aside className="w-64 bg-surface border-r border-border-subtle flex flex-col md:flex shrink-0">
        <div className="h-18 flex items-center px-6 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-1">
            <img src={Logo} alt="Preproute Logo" className="w-33.5 h-8.25" />
          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          {/* Dashboard — normal NavLink */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium relative transition-colors ${isActive ? 'text-brand-primary bg-blue-50/50 mr-4 rounded-r-full' : 'text-text-muted hover:text-text-title hover:bg-gray-50'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-md" />}
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </>
            )}
          </NavLink>

          {/* ✅ Test Creation — custom onClick to always create fresh */}
          <NavLink
            to="/tests/new"
            onClick={handleTestCreationClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium relative transition-colors ${isActive ? 'text-brand-primary bg-blue-50/50 mr-4 rounded-r-full' : 'text-text-muted hover:text-text-title hover:bg-gray-50'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-md" />}
                <FileEdit className="w-5 h-5" />
                Test Creation
              </>
            )}
          </NavLink>

          {/* Test Tracking — normal NavLink */}
          <NavLink
            to="/tracking"
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium relative transition-colors ${isActive ? 'text-brand-primary bg-blue-50/50 mr-4 rounded-r-full' : 'text-text-muted hover:text-text-title hover:bg-gray-50'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary rounded-r-md" />}
                <Activity className="w-5 h-5" />
                Test Tracking
              </>
            )}
          </NavLink>
        </nav>

        <div className="p-4 border-t border-border-subtle shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-subtle text-sm font-medium text-text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="shrink-0 h-[72px] bg-surface border-b border-border-subtle flex items-center justify-between px-8">
          <div className="flex-1" />
          <div className="flex items-center gap-6">
            <button className="p-2 text-text-title hover:bg-gray-50 rounded-full transition-colors relative border border-border-subtle">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-surface translate-x-1/4 -translate-y-1/4"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 cursor-pointer group">
              <div className="w-9 h-9 rounded-full bg-orange-100 border border-orange-200 overflow-hidden flex items-center justify-center shrink-0">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.userId || 'Alex'}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="font-semibold text-text-title text-sm leading-tight group-hover:text-brand-primary transition-colors">
                  {user?.userId === 'vedant-admin' ? 'Alex Wando' : user?.userId}
                </p>
                <p className="text-[11px] text-text-muted uppercase tracking-wider mt-0.5">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-muted ml-1" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};