import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Search,
  Zap,
  Moon,
  Sun,
  ChevronRight,
  Plus,
  User,
  MessageSquare,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const ADMIN_ROUTES = [
  { 
    path: '/admin/dashboard', 
    name: 'Dashboard', 
    icon: LayoutDashboard,
    badge: null
  },
  { 
    path: '/admin/quotes', 
    name: 'Quotations', 
    icon: FileText,
    badge: null
  },
  { 
    path: '/admin/customers', 
    name: 'Customers', 
    icon: Users,
    badge: null
  },
  { 
    path: '/admin/packages', 
    name: 'Packages', 
    icon: Package,
    badge: null
  },
  { 
    path: '/admin/messages', 
    name: 'Messages', 
    icon: MessageSquare,
    badge: null
  },
  { 
    path: '/admin/equipment', 
    name: 'Equipment', 
    icon: Zap,
    badge: null
  },
];

export function AdminLayout({ children }) {
  const { adminUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const fetchNewCount = useCallback(async () => {
    try {
      const res = await adminAPI.getMessages({ status: 'new', limit: 1, page: 1 });
      if (res && typeof res.total === 'number') {
        setNewMsgCount(res.total);
      } else if (Array.isArray(res?.items)) {
        setNewMsgCount(res.items.length);
      } else if (Array.isArray(res)) {
        setNewMsgCount(res.length);
      } else {
        setNewMsgCount(0);
      }
    } catch {
      setNewMsgCount(0);
    }
  }, []);

  // Fetch new messages count and poll periodically
  useEffect(() => {
    let timer;
    fetchNewCount();
    timer = setInterval(fetchNewCount, 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, [fetchNewCount]);

  // Listen for explicit refresh events from sub-pages
  useEffect(() => {
    const handler = () => fetchNewCount();
    window.addEventListener('admin:refresh-badges', handler);
    return () => window.removeEventListener('admin:refresh-badges', handler);
  }, [fetchNewCount]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/admin/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/admin/dashboard' && location.pathname === '/admin');
  };

  const getNavItemClasses = (active = false) => {
    return active 
      ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400 font-medium' 
      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400';
  };

  // Get current page title
  const getPageTitle = () => {
    const route = ADMIN_ROUTES.find(r => r.path === location.pathname);
    return route ? route.name : 'Dashboard';
  };

  // Get breadcrumbs
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path === 'admin' ? 'Dashboard' : path.charAt(0).toUpperCase() + path.slice(1),
      path: `/${paths.slice(0, index + 1).join('/')}`,
      current: index === paths.length - 1
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and Menu Toggle */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Logo */}
              <div className="flex items-center ml-2 lg:ml-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="hidden md:block ml-4">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Eagles Events</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 pr-4 py-2.5 border-0 rounded-xl bg-slate-100/60 dark:bg-slate-700/60 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200 shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-1">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  {newMsgCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white ring-2 ring-white dark:ring-slate-800">
                      {newMsgCount > 9 ? '9+' : newMsgCount}
                    </span>
                  )}
                </button>
              </div>


              {/* Profile Dropdown */}
              <div className="relative ml-3">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center max-w-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/20 transition-all duration-200"
                  id="user-menu"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white/20">
                    {adminUser?.name?.charAt(0) || adminUser?.email?.charAt(0).toUpperCase() || 'A'}
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                    <div className="py-1" role="none">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{adminUser?.name || 'Admin User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{adminUser?.email || 'admin@eagleevents.com'}</p>
                      </div>
                      <Link
                        to="/admin/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <User className="mr-3 h-5 w-5 text-gray-400" />
                        Your Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <LogOut className="mr-3 h-5 w-5 text-red-400" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-r border-slate-200/60 dark:border-slate-700/60 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 shadow-xl lg:shadow-none ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            isSidebarCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                {!isSidebarCollapsed && (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-lg">Control Panel</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Management Suite</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200"
                  aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                    isSidebarCollapsed ? 'rotate-0' : 'rotate-180'
                  }`} />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              {ADMIN_ROUTES.map((route) => {
                const IconComponent = route.icon;
                const active = isActive(route.path);
                const badge = route.path === '/admin/messages' && newMsgCount > 0 ? String(newMsgCount) : route.badge;
                return (
                  <Link
                    key={route.path}
                    to={route.path}
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white'
                    }`}
                    title={isSidebarCollapsed ? route.name : ''}
                  >
                    <div className="relative">
                      <IconComponent 
                        className={`w-5 h-5 flex-shrink-0 ${
                          active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                        }`} 
                      />
                      {badge && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white ring-2 ring-white dark:ring-slate-800">
                          {badge}
                        </span>
                      )}
                    </div>
                    {!isSidebarCollapsed && (
                      <span className="ml-3 truncate">{route.name}</span>
                    )}
                    {active && !isSidebarCollapsed && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-6 border-t border-slate-200/60 dark:border-slate-700/60">
              {!isSidebarCollapsed ? (
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-600/60">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {adminUser?.name || 'Admin User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {adminUser?.email || 'admin@eagleevents.com'}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex mb-8" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-200/60 dark:border-slate-700/60">
                {getBreadcrumbs().map((breadcrumb, index) => (
                  <li key={breadcrumb.path} className="inline-flex items-center">
                    {index > 0 && (
                      <ChevronRight className="w-4 h-4 text-slate-400 mx-2" />
                    )}
                    {breadcrumb.current ? (
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {breadcrumb.name}
                      </span>
                    ) : (
                      <Link
                        to={breadcrumb.path}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        {breadcrumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {getPageTitle()}
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400 font-medium">
                  {getPageTitle() === 'Dashboard' 
                    ? 'Monitor and manage your business operations' 
                    : `Manage your ${getPageTitle().toLowerCase()} efficiently`}
                </p>
              </div>
            </div>

            {/* Page Content */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm shadow-xl rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
              <div className="p-8">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
