import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  Award,
  Settings,
  LogOut,
  Package,
  Briefcase,
  Inbox,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';

const BUYER_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/search', icon: Search, label: 'Find Vendors' },
  { to: '/rfq', icon: FileText, label: 'RFQ Manager' },
  { to: '/quotes', icon: MessageSquare, label: 'Quotes' },
  { to: '/tenders', icon: Award, label: 'Tenders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const SUPPLIER_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'My Portfolio' },
  { to: '/rfq', icon: Inbox, label: 'Incoming RFQs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { user, company, logout } = useAuthStore();
  const navigate = useNavigate();
  const isSupplier = company?.companyType === 'SUPPLIER';
  const navItems = isSupplier ? SUPPLIER_NAV : BUYER_NAV;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-dark-900 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-dark-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">ShipProcure</div>
            <div className="text-dark-400 text-xs">{company?.name ?? 'Loading...'}</div>
          </div>
        </div>
        {/* Role badge */}
        <div className="mt-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isSupplier ? 'bg-amber-900/40 text-amber-400' : 'bg-brand-900/40 text-brand-400'
          }`}>
            {isSupplier ? 'SUPPLIER' : 'BUYER'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${isActive ? 'text-white' : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-brand-600 rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-dark-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name}</div>
            <div className="text-xs text-dark-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
