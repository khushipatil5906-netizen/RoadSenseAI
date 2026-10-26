import React, { useState } from 'react';
import { Menu, Search, Bell, LogOut, User as UserIcon, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  title: string;
  onToggleSidebar: () => void;
  onSearch?: (query: string) => void;
  setActivePage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onToggleSidebar,
  onSearch,
  setActivePage,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
  };

  return (
    <header className="h-18 bg-white border-b border-slate-200 sticky top-0 z-20 px-5 lg:px-8 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{title}</span>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              DEMO MODE
            </span>
          </h2>
        </div>
      </div>

      {/* Middle: Search input */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-lg mx-8">
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search reports by road, locality, or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>
      </form>

      {/* Right: Actions & User menu */}
      <div className="flex items-center gap-2.5">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] text-blue-600 font-medium">3 New</span>
              </div>
              <div className="space-y-2 mt-2">
                <div className="p-2 rounded-lg bg-red-50 text-red-800">
                  <p className="font-semibold">High Priority Alert</p>
                  <p className="text-[11px] text-red-600 mt-0.5">Pothole cluster on Andheri Kurla Link Road exceeds triage threshold (4.50/5.0).</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-800">
                  <p className="font-semibold">Inspection Scheduled</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">BKC Connector crew dispatched for sub-base verification.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-slate-800 hidden sm:inline-block max-w-[140px] truncate">
                {user.name}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-sm">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs uppercase font-bold tracking-wider">
                    {user.role}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors font-semibold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActivePage('login')}
              className="px-3.5 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActivePage('register')}
              className="px-4 py-2 bg-civic-blue text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
