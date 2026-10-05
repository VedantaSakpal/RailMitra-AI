import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Train, ArrowRight, MapPin, Ticket, Bot, Map, Search, 
  CreditCard, Clock, Calendar, ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [stations, setStations] = useState<any[]>([]);
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stations for the journey planner
  useEffect(() => {
    fetch('http://localhost:5000/api/railway/stations')
      .then(r => r.json())
      .then(d => { if (d.success) setStations(d.data); })
      .catch(console.error);
  }, []);

  // Fetch tickets for summary
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/tickets/my-tickets', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setTickets(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [token]);

  const activeTickets = tickets.filter(t => new Date(t.validUntil) > new Date());
  const recentJourneys = tickets.slice(0, 3); // Get top 3

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            {getGreeting()}, <span className="text-primary">{user?.firstName || 'Traveler'}!</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Where are you travelling today?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Plan Your Journey Card */}
        <div className="lg:col-span-2 bg-card border border-border shadow-sm rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> Plan Your Journey
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">From Station</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select
                  value={originId}
                  onChange={e => setOriginId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Select origin...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center justify-center h-12 w-12 shrink-0">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="flex-1 w-full space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">To Station</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select
                  value={destId}
                  onChange={e => setDestId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="">Select destination...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => navigate('/search')}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Train className="w-4 h-4" /> Find Trains
            </button>
            <button 
              onClick={() => navigate('/tickets')}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" /> Calculate Fare
            </button>
          </div>
        </div>

        {/* 6. RailMitra AI Promo Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group border border-slate-700">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="inline-flex p-2 bg-blue-500/20 rounded-xl mb-4 border border-blue-500/30">
                <Bot className="w-6 h-6 text-blue-300" />
              </div>
              <h2 className="text-xl font-bold mb-2">RailMitra AI</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Need help planning your journey? Ask about routes, fares, and real-time train status.
              </p>
            </div>
            <Link to="/ai" className="inline-flex items-center justify-between w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-md group-hover:shadow-lg">
              Ask RailMitra AI <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3 & 4. Summary & Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Ticket className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold">{activeTickets.length}</span>
          </div>
          <h3 className="font-semibold">Active Tickets</h3>
          <p className="text-muted-foreground text-xs mt-1">Ready for travel</p>
        </div>

        <div className="bg-card border border-border shadow-sm rounded-2xl p-5 hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="font-semibold">Next Train</h3>
          <p className="text-muted-foreground text-xs mt-1">Check live status</p>
          <Link to="/tracking" className="text-primary text-xs font-medium mt-3 inline-flex items-center hover:underline">
            Live Tracking <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="sm:col-span-2 bg-card border border-border shadow-sm rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <CreditCard className="w-4 h-4"/>, label: 'Book Ticket', path: '/tickets' },
              { icon: <Train className="w-4 h-4"/>, label: 'Find Train', path: '/search' },
              { icon: <Map className="w-4 h-4"/>, label: 'Route Map', path: '/route-map' },
              { icon: <Ticket className="w-4 h-4"/>, label: 'My Tickets', path: '/tickets' }
            ].map((action, i) => (
              <Link key={i} to={action.path} className="flex flex-col items-center justify-center p-3 bg-secondary/40 hover:bg-secondary/80 rounded-xl transition-colors text-center group">
                <div className="text-muted-foreground group-hover:text-primary transition-colors mb-2">
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Recent Journeys */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" /> Recent Journeys
          </h2>
          <Link to="/tickets" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentJourneys.length > 0 ? (
          <div className="space-y-4">
            {recentJourneys.map(ticket => (
              <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Train className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{ticket.originStation.code}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="font-bold">{ticket.destStation.code}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(ticket.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {ticket.passengerCount} Passenger(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{ticket.fare}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">{ticket.status}</p>
                  </div>
                  <button onClick={() => navigate('/tickets')} className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-medium hover:bg-secondary transition-colors">
                    Rebook
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-secondary/10">
            <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-medium text-slate-700 dark:text-slate-300">No recent journeys</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Start your first journey with RailMitra today.</p>
            <button onClick={() => navigate('/tickets')} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Book a Ticket
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
