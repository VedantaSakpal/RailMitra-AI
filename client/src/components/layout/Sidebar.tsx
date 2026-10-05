import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Map, 
  Ticket, 
  CreditCard, 
  Bot, 
  User, 
  LogOut,
  Train
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Train Search', path: '/search' },
  { icon: Map, label: 'Train Route Map', path: '/route-map' },
  { icon: Train, label: 'Live Station Board', path: '/station-board' },
  { icon: Ticket, label: 'Tickets', path: '/tickets' },
  { icon: CreditCard, label: 'Passes', path: '/passes' },
  { icon: Bot, label: 'AI Assistant', path: '/ai' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'RM';

  return (
    <div className="hidden md:flex h-screen w-64 flex-col bg-card border-r border-border shrink-0">
      {/* Logo Area */}
      <div className="p-6 pb-4 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
          <Train className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold leading-tight">
            <span className="text-primary">RailMitra</span>
          </h2>
          <p className="text-xs text-muted-foreground">Mumbai Local AI</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
