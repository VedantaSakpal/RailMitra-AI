import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Moon, Sun, Bell, Home, Search, Map, Bot, Ticket } from 'lucide-react';

// Mobile nav items (top 5 most used)
const mobileNav = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Map, label: 'Track', path: '/tracking' },
  { icon: Ticket, label: 'Tickets', path: '/tickets' },
  { icon: Bot, label: 'AI', path: '/ai' },
];

export default function MainLayout() {
  const { theme, setTheme } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'RM';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile brand */}
            <div className="md:hidden">
              <h1 className="text-lg font-bold text-primary">RailMitra</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="notification-bell"
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Avatar — click to go to profile */}
            <button
              id="user-avatar"
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center ml-1 border border-primary/30 hover:border-primary transition-colors"
            >
              <span className="font-bold text-primary text-xs">{initials}</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          {mobileNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className="text-xs font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
