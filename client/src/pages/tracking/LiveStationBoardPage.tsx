import { useState, useEffect, useCallback, useRef } from 'react';
import { getStations, getLiveStationBoard, Station } from '../../lib/services/railway';
import {
  Activity, Clock, Search, AlertCircle, ArrowRight,
  Train, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

// ─── Types (matching the backend MappedTrain shape) ─────────────────────────
interface MappedTrain {
  number: string;
  name: string;
  source: string;
  destination: string;
  status: string;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  expectedTime: string | null;
  platform: string | null;
  delayMinutes: number;
}

interface BoardData {
  station: { code: string; name: string };
  trains: MappedTrain[];
  count: number;
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  // ISO datetime: parse it
  if (iso.includes('T') || iso.includes('+')) {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }
  // Already HH:mm
  if (/^\d{2}:\d{2}/.test(iso)) {
    const [h, m] = iso.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return iso;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'at-station': return 'AT STATION';
    case 'upcoming':   return 'UPCOMING';
    case 'scheduled':  return 'SCHEDULED';
    default:           return status.toUpperCase();
  }
}

function getStatusColors(status: string): string {
  switch (status) {
    case 'at-station': return 'bg-blue-500/15 text-blue-500 border border-blue-500/30';
    case 'upcoming':   return 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30';
    case 'scheduled':  return 'bg-slate-500/15 text-slate-500 border border-slate-500/30';
    default:           return 'bg-secondary text-secondary-foreground';
  }
}

const AUTO_REFRESH_INTERVAL = 60_000; // 60 seconds

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiveStationBoardPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationCode, setSelectedStationCode] = useState<string>('');
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load stations on mount
  useEffect(() => {
    getStations().then(data => {
      setStations(data);
      if (data.length > 0) {
        setSelectedStationCode(data[0].code);
      }
    });
  }, []);

  // ── Fetch board ─────────────────────────────────────────────────────────────
  const fetchBoard = useCallback(async (code?: string) => {
    const stationCode = code ?? selectedStationCode;
    if (!stationCode) return;

    setLoading(true);
    setError('');

    try {
      const res = await getLiveStationBoard(stationCode);
      // res = { station, trains, count, lastUpdated }
      setBoardData(res ?? null);
      const now = new Date();
      setLastUpdated(now);
      setSecondsAgo(0);
    } catch (err: any) {
      // Propagate the specific error message from the backend
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch live station board. Please try again later.';
      setError(msg);
      setBoardData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedStationCode]);

  // ── Auto-refresh every 60s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStationCode) return;

    fetchBoard(selectedStationCode);

    // Auto-refresh
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      fetchBoard(selectedStationCode);
    }, AUTO_REFRESH_INTERVAL);

    // "Seconds ago" ticker
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setSecondsAgo(s => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (tickRef.current)    clearInterval(tickRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStationCode]);

  // ── Friendly "last updated" label ──────────────────────────────────────────
  const lastUpdatedLabel = (): string => {
    if (!lastUpdated) return '';
    if (secondsAgo < 10) return 'Updated just now';
    if (secondsAgo < 60) return `Updated ${secondsAgo}s ago`;
    const m = Math.floor(secondsAgo / 60);
    return `Updated ${m}m ago`;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 page-enter pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" />
          Live Station Board
        </h1>
        <p className="text-muted-foreground mt-1">Real-time arrivals and departures via RailRadar.</p>
      </div>

      {/* Station selector + refresh */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Select Station
            </label>
            <select
              value={selectedStationCode}
              onChange={(e) => setSelectedStationCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
            >
              {stations.map(st => (
                <option key={st.id} value={st.code}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          <button
            id="refresh-station-board"
            onClick={() => fetchBoard()}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold flex justify-center items-center gap-2 hover:opacity-90 transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* Live indicator + last-updated */}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          {lastUpdated ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                Live
              </span>
              <span>• {lastUpdatedLabel()}</span>
              <span className="ml-auto opacity-60">Auto-refreshes every 60 s</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <WifiOff className="w-3.5 h-3.5" />
              Not connected
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        /* Loading skeletons */
        <div className="space-y-4">
          <div className="h-6 w-48 bg-secondary/50 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 animate-pulse">
                <div className="h-5 w-2/3 bg-secondary/60 rounded" />
                <div className="h-3 w-1/3 bg-secondary/40 rounded" />
                <div className="h-3 w-1/2 bg-secondary/30 rounded" />
                <div className="pt-3 flex justify-between border-t border-border">
                  <div className="h-6 w-20 bg-secondary/50 rounded" />
                  <div className="h-5 w-10 bg-secondary/40 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        /* Error state with specific message */
        <div className="p-6 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-3">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Could not load live board</p>
            <p className="text-sm mt-1 opacity-80">{error}</p>
          </div>
        </div>
      ) : boardData && boardData.trains.length === 0 ? (
        /* Valid empty response */
        <div className="p-12 text-center border border-border rounded-2xl bg-card">
          <Train className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold">No upcoming trains</p>
          <p className="text-sm text-muted-foreground mt-1">
            No upcoming or at-station trains found for <strong>{boardData.station.name}</strong> in the next 4 hours.
          </p>
        </div>
      ) : boardData && boardData.trains.length > 0 ? (
        /* Train cards */
        <div className="space-y-4">
          <h2 className="text-xl font-bold">
            Upcoming Trains — {boardData.station.name}
            <span className="ml-2 text-muted-foreground font-normal text-base">
              ({boardData.count})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardData.trains.map((train, idx) => {
              const displayTime = formatTime(train.expectedTime ?? train.scheduledDeparture ?? train.scheduledArrival);
              const isDelayed   = train.delayMinutes > 0;

              return (
                <div
                  key={`${train.number}-${idx}`}
                  className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 relative overflow-hidden hover:border-primary/30 transition-colors group"
                >
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getStatusColors(train.status)}`}>
                      {getStatusLabel(train.status)}
                    </span>
                  </div>

                  {/* Train name + number */}
                  <div className="pr-20">
                    <h3 className="font-bold text-base leading-tight">{train.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Train No. {train.number}
                    </p>
                  </div>

                  {/* Source → Destination */}
                  {(train.source || train.destination) && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="font-semibold">{train.source || '—'}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">{train.destination || '—'}</span>
                    </div>
                  )}

                  {/* Time + platform */}
                  <div className="pt-3 flex items-center justify-between border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono font-bold text-lg">{displayTime}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Delay badge */}
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${isDelayed ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'}`}>
                        {isDelayed ? `+${train.delayMinutes} min` : 'On Time'}
                      </span>

                      {/* Platform */}
                      {train.platform && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded font-semibold text-secondary-foreground border border-border">
                          PF {train.platform}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Initial state before any fetch */
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
          <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Select a station and click Refresh to load live trains.</p>
        </div>
      )}
    </div>
  );
}
