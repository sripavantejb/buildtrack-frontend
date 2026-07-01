import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  ClipboardList, 
  Package, 
  BarChart3, 
  Archive, 
  TrendingUp, 
  ShoppingCart, 
  FileText, 
  Users, 
  Settings, 
  Building2, 
  ChevronDown, 
  HelpCircle, 
  LogOut,
  Bell
} from 'lucide-react';
import { api } from '../services/api';
import PageMeta from './PageMeta';
import { getProjectPageMeta } from '../config/siteMeta';

export default function Layout({ children, project, setProject }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = api.getCurrentUser() || { name: 'Arjun Reddy', role: 'Administrator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' };

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (project?.id) {
      const fetchAlerts = async () => {
        try {
          const data = await api.getAlerts(project.id);
          setAlerts(data);
        } catch (err) {
          console.error("Error fetching alerts in layout:", err);
        }
      };
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 10000);
      return () => clearInterval(interval);
    }
  }, [project?.id]);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      const btn = document.getElementById('notifications-btn');
      const dropdown = document.getElementById('notifications-dropdown');
      if (
        showNotifications &&
        btn && !btn.contains(e.target) &&
        dropdown && !dropdown.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [showNotifications]);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const sectionMatch = location.pathname.match(/\/project\/[^/]+\/([^/?]+)/);
  const sectionKey = sectionMatch?.[1] || 'overview';
  const pageMeta = project ? getProjectPageMeta(project.name, sectionKey, location.pathname) : null;

  const navItems = [
    { name: 'Overview', path: 'overview', icon: Home },
    { name: 'Project Planning', path: 'planning', icon: Calendar },
    { name: 'Budget Planning', path: 'budget', icon: CreditCard },
    { name: 'Daily Tracking', path: 'daily-tracking', icon: ClipboardList },
    { name: 'Materials Center', path: 'materials', icon: Package },
    { name: 'Planned vs Actual', path: 'planned-vs-actual', icon: BarChart3 },
    { name: 'Inventory', path: 'inventory', icon: Archive },
    { name: 'Forecast & Alerts', path: 'forecast', icon: TrendingUp },
    { name: 'Procurement', path: 'procurement', icon: ShoppingCart },
    { name: 'Reports', path: 'reports', icon: FileText },
    { name: 'Team & Roles', path: 'team', icon: Users },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <>
      {pageMeta && <PageMeta {...pageMeta} path={location.pathname} />}
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Left Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-hairline bg-canvas flex-shrink-0">
        {/* Logo Branding */}
        <div className="flex h-16 items-center gap-2 border-b border-hairline-soft px-6 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-normal text-primary tracking-tight">BuildTrack</h1>
            <p className="text-[10px] text-muted-soft font-medium leading-none">Construction Management</p>
          </div>
        </div>



        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 py-1">
          {['Platform Owner', 'Super Admin', 'Manager'].includes(user.role) && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-colors mb-2 ${
                location.pathname === '/admin' 
                  ? 'bg-canvas-soft text-primary border border-hairline' 
                  : 'text-muted hover:bg-canvas hover:text-ink border border-transparent'
              }`}
            >
              <Users className={`h-4.5 w-4.5 ${location.pathname === '/admin' ? 'text-primary' : 'text-muted-soft'}`} />
              Admin Console
            </Link>
          )}
          {navItems
            .filter(item => !['Site Manager', 'Employee'].includes(user.role) || item.path === 'daily-tracking')
            .map((item) => {
              const itemPath = `/project/${project?.id}/${item.path}`;
              const isActive = location.pathname.startsWith(itemPath) || (item.path === 'overview' && location.pathname.endsWith(`/project/${project?.id}`));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={itemPath}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-light text-primary' 
                      : 'text-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-muted-soft'}`} />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* Help Panel */}
        <div className="mx-4 my-2 rounded-xl bg-canvas border border-hairline-soft p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
            <HelpCircle className="h-4 w-4 text-muted-soft" />
            <span>Need Help?</span>
          </div>
          <p className="mt-1 text-[10px] text-muted-soft leading-normal">We're here to assist you with cost tracking.</p>
          <a
            href="mailto:support@buildtrack.com"
            className="mt-3 flex items-center justify-center rounded-lg border border-hairline bg-surface-card py-1.5 text-[10px] font-semibold text-body hover:bg-canvas hover:text-ink transition-colors"
          >
            Contact Support
          </a>
        </div>

        {/* User profile footer widget */}
        <div className="relative border-t border-hairline-soft p-4">
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center justify-between rounded-lg p-1 hover:bg-canvas cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-hairline"
              />
              <div className="overflow-hidden">
                <h4 className="truncate text-xs font-semibold text-ink leading-tight">{user.name}</h4>
                <p className="truncate text-[10px] text-muted-soft font-medium">{user.role}</p>
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-soft transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </div>

          {/* User action submenu */}
          {showUserMenu && (
            <div className="absolute bottom-16 left-4 right-4 z-50 rounded-lg border border-hairline bg-surface-card p-1">
              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-medium text-error hover:bg-canvas-soft transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-hairline bg-surface-card px-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center">
            {/* Mobile hamburger menu button */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-3 rounded-lg border border-hairline bg-surface-card p-2 text-muted hover:bg-canvas lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {project && (
              <div 
                onClick={() => navigate('/')}
                className="flex max-w-[calc(100vw-7rem)] items-center justify-between rounded-lg border border-hairline p-2 hover:bg-canvas transition-colors cursor-pointer sm:max-w-[240px] md:max-w-[280px]"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <img 
                    src={project.coverImage || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80"} 
                    alt={project.name} 
                    className="h-8 w-8 rounded object-cover flex-shrink-0"
                  />
                  <div className="overflow-hidden">
                    <h3 className="truncate text-xs font-semibold text-ink leading-tight">{project.name}</h3>
                    <p className="truncate text-[9px] text-muted-soft font-medium">{project.location}</p>
                  </div>
                </div>
                <ChevronDown className="ml-3 h-3.5 w-3.5 text-muted flex-shrink-0" />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="relative">
              <button 
                id="notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-hairline bg-surface-card text-muted hover:bg-canvas transition-colors"
              >
                <Bell className="h-4 w-4" />
                {alerts.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div id="notifications-dropdown" className="absolute right-0 mt-2 z-50 w-[min(calc(100vw-1.5rem),20rem)] rounded-xl border border-hairline bg-surface-card p-2">
                  <div className="flex items-center justify-between border-b border-hairline-soft pb-2 px-3 pt-1">
                    <h4 className="text-xs font-semibold text-ink">Notifications</h4>
                    <span className="rounded bg-canvas-soft px-1.5 py-0.5 text-[9px] font-bold text-error">
                      {alerts.length} New
                    </span>
                  </div>
                  <div className="divide-y divide-hairline-soft max-h-64 overflow-y-auto">
                    {alerts.length > 0 ? (
                      alerts.map(alert => (
                        <div 
                          key={alert.id}
                          onClick={() => {
                            let path = `/project/${project.id}/forecast`;
                            if (alert.id === 'a-1') path = `/project/${project.id}/materials/m-1`;
                            else if (alert.id === 'a-2') path = `/project/${project.id}/planned-vs-actual`;
                            else if (alert.id === 'a-3') path = `/project/${project.id}/daily-tracking`;
                            else if (alert.id === 'a-4') path = `/project/${project.id}/budget`;
                            navigate(path);
                            setShowNotifications(false);
                          }}
                          className="p-3 text-xs hover:bg-canvas cursor-pointer transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 font-semibold text-ink">
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              alert.type === 'Critical' ? 'bg-error' :
                              alert.type === 'Warning' ? 'bg-timeline-done' :
                              alert.type === 'Success' ? 'bg-success' : 'bg-timeline-read'
                            }`} />
                            <p className="truncate">{alert.title}</p>
                          </div>
                          <p className="mt-1 text-[10px] text-muted leading-relaxed pl-3.5">{alert.desc}</p>
                          <p className="mt-1 text-[8px] text-muted-soft text-right pr-1">{alert.date}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-muted-soft">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden h-8 w-px bg-hairline md:block"></div>
            <div className="hidden text-right md:block">
              <p className="text-xs font-semibold text-ink">{user.name}</p>
              <p className="text-[10px] text-muted-soft font-medium">{project?.location}</p>
            </div>
          </div>
        </header>

        {/* View Content Port */}
        <main className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface-card border-r border-hairline transition-transform duration-300 transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Branding */}
        <div className="flex h-16 items-center justify-between border-b border-hairline-soft px-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { navigate('/'); setSidebarOpen(false); }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-normal text-primary tracking-tight">BuildTrack</h1>
              <p className="text-[10px] text-muted-soft font-medium leading-none">Construction Management</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-soft hover:text-body">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-[2px] overflow-y-auto px-3 py-4">
          {['Platform Owner', 'Super Admin', 'Manager'].includes(user.role) && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition-colors mb-2 ${
                location.pathname === '/admin' 
                  ? 'bg-canvas-soft text-primary border border-hairline' 
                  : 'text-muted hover:bg-canvas hover:text-ink border border-transparent'
              }`}
            >
              <Users className={`h-4.5 w-4.5 ${location.pathname === '/admin' ? 'text-primary' : 'text-muted-soft'}`} />
              Admin Console
            </Link>
          )}
          {navItems
            .filter(item => !['Site Manager', 'Employee'].includes(user.role) || item.path === 'daily-tracking')
            .map((item) => {
              const itemPath = `/project/${project?.id}/${item.path}`;
              const isActive = location.pathname.startsWith(itemPath) || (item.path === 'overview' && location.pathname.endsWith(`/project/${project?.id}`));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={itemPath}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-light text-primary' 
                      : 'text-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-primary' : 'text-muted-soft'}`} />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* User profile footer widget */}
        <div className="relative border-t border-hairline-soft p-4">
          <div 
            onClick={() => setShowMobileUserMenu(!showMobileUserMenu)}
            className="flex items-center justify-between rounded-lg p-1 hover:bg-canvas cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-hairline"
              />
              <div className="overflow-hidden">
                <h4 className="truncate text-xs font-semibold text-ink leading-tight">{user.name}</h4>
                <p className="truncate text-[10px] text-muted-soft font-medium">{user.role}</p>
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-soft transition-transform ${showMobileUserMenu ? 'rotate-180' : ''}`} />
          </div>

          {showMobileUserMenu && (
            <div className="absolute bottom-16 left-4 right-4 z-50 rounded-lg border border-hairline bg-surface-card p-1">
              <button 
                onClick={() => { handleLogout(); setSidebarOpen(false); }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-medium text-error hover:bg-canvas-soft transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
    </>
  );
}
