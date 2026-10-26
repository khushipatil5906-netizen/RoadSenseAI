import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  PlusCircle,
  Cpu,
  Flame,
  ClipboardList,
  BarChart3,
  BookOpen,
  Home,
  Shield,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  isOpen,
  setIsOpen,
}) => {
  const { user, isInspector, isAdmin, switchDemoRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Interactive Damage Map', icon: MapPin },
    { id: 'report', label: 'Report Road Damage', icon: PlusCircle },
    { id: 'analysis', label: 'AI Damage Analysis', icon: Cpu },
    { id: 'priority', label: 'Repair Priority Engine', icon: Flame },
    { id: 'workflow', label: 'Inspection Workflow', icon: ClipboardList, badge: isInspector ? 'Admin' : undefined },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'model', label: 'ML Model & Validation', icon: BookOpen },
    { id: 'landing', label: 'Public Portal / Info', icon: Home },
  ];

  const handleNav = (id: string) => {
    setActivePage(id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 2xl:w-80 bg-navy-900 border-r border-navy-800 text-slate-300 z-40 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight leading-none">
                RoadSense <span className="text-blue-400 font-extrabold">AI</span>
              </h1>
              <p className="text-xs text-slate-400 tracking-wider mt-1 uppercase font-semibold">
                Infrastructure Triage
              </p>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div className="p-4 mx-3.5 my-3.5 rounded-xl bg-navy-800/70 border border-navy-700/70 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-900/90 border border-blue-400/40 flex items-center justify-center text-blue-300 text-sm font-bold shadow-xs">
                {user ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">
                  {user ? user.name : 'Guest Reporter'}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isInspector ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="text-xs text-slate-300 capitalize font-medium">
                    {user ? user.role : 'Public User'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="mt-3 pt-2.5 border-t border-navy-700/70 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Demo Role:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => switchDemoRole('citizen')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  !isInspector ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => switchDemoRole('inspector')}
                className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                  isInspector ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-navy-700/50'
                }`}
              >
                Inspector
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 font-bold'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Note */}
        <div className="p-4 border-t border-navy-800 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Decision Support Tool</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            AI severity scores prioritize inspections and do not replace field engineering assessments.
          </p>
        </div>
      </aside>
    </>
  );
};
