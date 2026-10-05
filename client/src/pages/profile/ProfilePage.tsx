import { useAuthStore } from '../../store/authStore';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '??';

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* User Card */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 shrink-0">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
              </h2>
              <span className="inline-flex items-center gap-1.5 mt-1 text-sm px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                <Shield className="w-3.5 h-3.5" />
                {user?.role ?? 'USER'}
              </span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
          <h3 className="font-semibold text-lg">Account Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Full Name</p>
                <p className="font-medium">{user ? `${user.firstName} ${user.lastName}` : '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email Address</p>
                <p className="font-medium">{user?.email ?? '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Member Since</p>
                <p className="font-medium">August 2026</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-secondary/30 text-sm text-muted-foreground">
          Full profile editing, password change, and notification preferences will be available in a future phase.
        </div>
      </div>
    </div>
  );
}
