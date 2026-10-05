import { useState, useEffect } from 'react';
import { BadgeCheck, CalendarDays, CheckCircle2, ShieldCheck, Zap, Star, Crown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

type PassType = 'DAILY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

interface PassConfig {
  type: PassType;
  label: string;
  duration: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  highlight?: boolean;
}

interface Pass {
  id: string;
  passNumber: string;
  type: PassType;
  status: string;
  zone: number;
  fare: number;
  startDate: string;
  endDate: string;
  qrCode: string;
}

// Zone-based fares (second class base — matching server logic)
const PASS_FARES: Record<PassType, Record<number, number>> = {
  DAILY:     { 1: 25,  2: 35,  3: 45,  4: 55,  5: 65,  6: 75  },
  MONTHLY:   { 1: 300, 2: 420, 3: 550, 4: 680, 5: 800, 6: 950 },
  QUARTERLY: { 1: 800, 2: 1100, 3: 1450, 4: 1800, 5: 2100, 6: 2500 },
  YEARLY:    { 1: 2800, 2: 3800, 3: 5000, 4: 6200, 5: 7300, 6: 8700 },
};

const CLASS_MULTIPLIER: Record<'SECOND' | 'FIRST' | 'AC', number> = {
  SECOND: 1,
  FIRST: 10,
  AC: 20,
};

const PASS_CONFIGS: PassConfig[] = [
  {
    type: 'DAILY',
    label: 'Daily Pass',
    duration: '1 Day',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-yellow-600',
    gradient: 'from-yellow-50 to-amber-50 border-yellow-200 dark:from-yellow-900/10 dark:to-amber-900/10 dark:border-yellow-800/30',
  },
  {
    type: 'MONTHLY',
    label: 'Monthly Pass',
    duration: '30 Days',
    icon: <CalendarDays className="w-5 h-5" />,
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/10 dark:to-indigo-900/10 dark:border-blue-800/30',
    highlight: true,
  },
  {
    type: 'QUARTERLY',
    label: 'Quarterly Pass',
    duration: '90 Days',
    icon: <Star className="w-5 h-5" />,
    color: 'text-purple-600',
    gradient: 'from-purple-50 to-violet-50 border-purple-200 dark:from-purple-900/10 dark:to-violet-900/10 dark:border-purple-800/30',
  },
  {
    type: 'YEARLY',
    label: 'Yearly Pass',
    duration: '365 Days',
    icon: <Crown className="w-5 h-5" />,
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/10 dark:to-teal-900/10 dark:border-emerald-800/30',
  },
];

export default function PassesPage() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [activeTab, setActiveTab] = useState<'buy' | 'my-passes'>('buy');
  const [selectedType, setSelectedType] = useState<PassType>('MONTHLY');
  const [selectedZone, setSelectedZone] = useState<number>(1);
  const [isFirstClass, setIsFirstClass] = useState(false);
  const [coachClass, setCoachClass] = useState<'SECOND' | 'FIRST' | 'AC'>('SECOND');
  const [isBuying, setIsBuying] = useState(false);
  const [success, setSuccess] = useState<Pass | null>(null);
  const [error, setError] = useState('');

  const selectedFare = PASS_FARES[selectedType][selectedZone] * CLASS_MULTIPLIER[coachClass];
  const selectedConfig = PASS_CONFIGS.find(p => p.type === selectedType)!;;

  useEffect(() => {
    if (activeTab === 'my-passes') {
      fetchPasses();
    }
  }, [activeTab]);

  const fetchPasses = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('http://localhost:5000/api/passes/my-passes', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setPasses(data.data);
    } catch (err) {
      console.error('Failed to load passes', err);
    }
  };

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBuying(true);
    setError('');
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('http://localhost:5000/api/passes/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ type: selectedType, zone: selectedZone, coachClass })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(data.data.pass);
      } else {
        setError(data.message || 'Failed to purchase pass');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  const daysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="space-y-6 page-enter pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Railway Passes</h1>
        <p className="text-muted-foreground mt-2">Buy daily, monthly, quarterly or yearly passes for unlimited travel.</p>
      </div>

      {/* Tab Switch */}
      <div className="flex bg-secondary/50 p-1 rounded-lg w-fit">
        {(['buy', 'my-passes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSuccess(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all capitalize ${
              activeTab === tab
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'buy' ? 'Buy Pass' : 'My Passes'}
          </button>
        ))}
      </div>

      {/* ─── BUY TAB ─── */}
      {activeTab === 'buy' && (
        <div className="space-y-8">
          {success ? (
            <div className="max-w-md mx-auto bg-green-500/10 border border-green-500/20 rounded-2xl p-10 text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">Pass Activated!</h3>
              <p className="text-muted-foreground">{success.passNumber}</p>
              <p className="text-sm text-muted-foreground">
                Valid until{' '}
                {new Date(success.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <button
                onClick={() => setActiveTab('my-passes')}
                className="mt-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                View My Passes
              </button>
            </div>
          ) : (
            <form onSubmit={handleBuy} className="space-y-8">
              {/* Pass Type Cards */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Choose Pass Type</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PASS_CONFIGS.map(config => (
                    <button
                      key={config.type}
                      type="button"
                      onClick={() => setSelectedType(config.type)}
                      className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                        selectedType === config.type
                          ? `bg-gradient-to-br ${config.gradient} border-current ${config.color} shadow-sm`
                          : 'bg-card border-border hover:border-border/80'
                      }`}
                    >
                      {config.highlight && (
                        <span className="absolute -top-2.5 right-3 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">
                          Popular
                        </span>
                      )}
                      <div className={`mb-3 ${selectedType === config.type ? config.color : 'text-muted-foreground'}`}>
                        {config.icon}
                      </div>
                      <p className="font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.duration} validity</p>
                      <p className={`text-lg font-bold mt-3 ${selectedType === config.type ? config.color : ''}`}>
                        ₹{PASS_FARES[config.type][selectedZone] * CLASS_MULTIPLIER[coachClass]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone + Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Zone</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(zone => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setSelectedZone(zone)}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                          selectedZone === zone
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card border-border text-foreground hover:border-primary/50'
                        }`}
                      >
                        Zone {zone}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mumbai is divided into 6 fare zones. Zones cover progressively longer distances.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Travel Class</h2>
                  <div className="flex bg-secondary/50 p-1 rounded-lg gap-1">
                    {(['SECOND', 'FIRST', 'AC'] as const).map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setCoachClass(cls)}
                        className={`flex-1 py-3 text-sm font-semibold rounded-md transition-all ${
                          coachClass === cls
                            ? cls === 'AC'
                              ? 'bg-cyan-500 text-white shadow-sm'
                              : cls === 'FIRST'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-background shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {cls === 'SECOND' ? '2nd Class' : cls === 'FIRST' ? '1st Class' : '❄ AC Local'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    2nd: base fare · 1st: 10× · AC Local: 20× (air-conditioned coaches)
                  </p>
                </div>
              </div>

              {/* Summary Banner */}
              <div
                className={`bg-gradient-to-br ${selectedConfig.gradient} rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border`}
              >
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Your selected pass</p>
                  <p className="font-bold text-lg">
                    {selectedConfig.label} · Zone {selectedZone} · {coachClass === 'AC' ? '❄ AC Local' : coachClass === 'FIRST' ? '1st Class' : '2nd Class'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Valid for {selectedConfig.duration}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-4xl font-bold">₹{selectedFare}</p>
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-medium">{error}</p>}

              <button
                type="submit"
                disabled={isBuying}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm text-base"
              >
                {isBuying ? (
                  'Processing...'
                ) : (
                  <>
                    <BadgeCheck className="w-5 h-5" />
                    Buy Pass for ₹{selectedFare}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ─── MY PASSES TAB ─── */}
      {activeTab === 'my-passes' && (
        <div>
          {passes.length === 0 ? (
            <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
              <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No passes found</h3>
              <p className="text-muted-foreground mt-1">You haven't purchased any passes yet.</p>
              <button
                onClick={() => setActiveTab('buy')}
                className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
              >
                Buy Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passes.map(pass => {
                const config = PASS_CONFIGS.find(c => c.type === pass.type)!;
                const isActive = pass.status === 'ACTIVE' && new Date(pass.endDate) > new Date();
                const remaining = daysRemaining(pass.endDate);
                const progressPct = Math.min(
                  100,
                  ((Date.now() - new Date(pass.startDate).getTime()) /
                    (new Date(pass.endDate).getTime() - new Date(pass.startDate).getTime())) *
                    100
                );

                return (
                  <div
                    key={pass.id}
                    className={`rounded-2xl border overflow-hidden shadow-sm ${
                      isActive ? 'bg-card' : 'bg-secondary/10 opacity-70'
                    }`}
                  >
                    {/* Pass Card Header */}
                    <div className={`bg-gradient-to-br ${config.gradient} p-5 border-b border-border/30`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`inline-flex items-center gap-1.5 font-semibold text-sm ${config.color} mb-1`}>
                            {config.icon} {config.label}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">{pass.passNumber}</p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {isActive ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>

                      <div className="mt-4 flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Zone</p>
                          <p className="font-bold text-lg">Zone {pass.zone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-0.5">Fare Paid</p>
                          <p className="font-bold text-lg">₹{pass.fare}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pass Card Body */}
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Start Date</p>
                          <p className="font-medium">{new Date(pass.startDate).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Expiry Date</p>
                          <p className="font-medium">{new Date(pass.endDate).toLocaleDateString('en-IN')}</p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Usage Progress</span>
                            <span className="font-medium text-foreground">{remaining} days left</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${config.color.replace('text-', 'bg-')}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
