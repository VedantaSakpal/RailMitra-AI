import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStations,
  getLines,
  searchTrains,
  Station,
  RailwayLine,
  TrainSearchResult,
} from '../../lib/services/railway';
import {
  ArrowRightLeft,
  Search,
  Clock,
  MapPin,
  Train as TrainIcon,
  ChevronRight,
  Filter,
  Info,
  CheckCircle2,
  Ticket,
  Navigation,
} from 'lucide-react';

export default function TrainSearchPage() {
  const navigate = useNavigate();

  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<RailwayLine[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  const [fromStationId, setFromStationId] = useState<string>('');
  const [toStationId, setToStationId] = useState<string>('');
  const [selectedLine, setSelectedLine] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'EARLIEST' | 'FASTEST' | 'FEWEST_STOPS'>('EARLIEST');

  const [results, setResults] = useState<TrainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedTrainId, setExpandedTrainId] = useState<string | null>(null);

  // Load stations & lines on mount
  useEffect(() => {
    async function initData() {
      try {
        const [stData, lineData] = await Promise.all([getStations(), getLines()]);
        setStations(stData);
        setLines(lineData);

        // Pre-select defaults if available (e.g., CSMT to Kalyan)
        if (stData.length >= 2) {
          setFromStationId(stData[0].id);
          setToStationId(stData[stData.length - 1].id);
        }
      } catch (err) {
        console.error('Failed to load initial search data', err);
      } finally {
        setLoadingStations(false);
      }
    }
    initData();
  }, []);

  const handleSwap = () => {
    setFromStationId(toStationId);
    setToStationId(fromStationId);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fromStationId || !toStationId) return;

    setIsSearching(true);
    setHasSearched(true);
    setExpandedTrainId(null);

    try {
      const lineFilter = selectedLine !== 'ALL' ? selectedLine : undefined;
      const typeFilter = selectedType !== 'ALL' ? selectedType : undefined;

      const data = await searchTrains(fromStationId, toStationId, lineFilter, typeFilter);
      setResults(data);
    } catch (err) {
      console.error('Error conducting train search', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Sort results based on selected tab
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'FASTEST') {
      return a.durationMinutes - b.durationMinutes;
    }
    if (sortBy === 'FEWEST_STOPS') {
      return a.stopsCount - b.stopsCount;
    }
    // Default: EARLIEST
    return a.departureTime.localeCompare(b.departureTime);
  });

  const fromStation = stations.find((s) => s.id === fromStationId);
  const toStation = stations.find((s) => s.id === toStationId);

  return (
    <div className="space-y-6 page-enter pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <TrainIcon className="w-8 h-8 text-primary" />
          Train Search
        </h1>
        <p className="text-muted-foreground mt-1">
          Find local trains, view timetables, and discover transfer routes across Central, Western, & Harbour lines.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-lg">
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* From Station */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                From Station
              </label>
              <select
                value={fromStationId}
                onChange={(e) => setFromStationId(e.target.value)}
                disabled={loadingStations}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) — {st.line?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-2 flex justify-center pt-2 md:pt-6">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-transform hover:rotate-180 duration-300"
                title="Swap origin and destination"
              >
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* To Station */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-destructive" />
                To Station
              </label>
              <select
                value={toStationId}
                onChange={(e) => setToStationId(e.target.value)}
                disabled={loadingStations}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) — {st.line?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Line:
              </span>
              {['ALL', ...lines.map((l) => l.id)].map((lineKey) => {
                const lineObj = lines.find((l) => l.id === lineKey);
                const label = lineKey === 'ALL' ? 'All Lines' : lineObj?.name || lineKey;
                const isSelected = selectedLine === lineKey;
                return (
                  <button
                    key={lineKey}
                    type="button"
                    onClick={() => setSelectedLine(lineKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">Type:</span>
              {['ALL', 'FAST', 'SLOW'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'
                  }`}
                >
                  {t === 'ALL' ? 'All Types' : t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Search Button */}
          <button
            type="submit"
            disabled={isSearching || !fromStationId || !toStationId}
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Trains Now
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">
              Available Trains ({sortedResults.length})
            </h2>

            {/* Sorting Tabs */}
            {results.length > 0 && (
              <div className="flex items-center bg-card p-1 rounded-xl border border-border">
                {[
                  { id: 'EARLIEST', label: 'Earliest' },
                  { id: 'FASTEST', label: 'Fastest' },
                  { id: 'FEWEST_STOPS', label: 'Fewest Stops' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSortBy(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sortBy === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results List */}
          {sortedResults.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-border bg-card space-y-3">
              <Info className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No direct or connecting trains found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try clearing your line or train type filters, or search between different major stations like Dadar, Kurla, or CSMT.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedResults.map((train) => {
                const isExpanded = expandedTrainId === train.id;

                return (
                  <div
                    key={train.id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {train.isDirect ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Direct Train
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-xs flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            {train.interchangeStation || 'Transfer'}
                          </span>
                        )}

                        <span
                          className="px-2.5 py-1 rounded-full font-bold text-xs"
                          style={{
                            backgroundColor: `${train.line?.color || '#3b82f6'}20`,
                            color: train.line?.color || '#3b82f6',
                          }}
                        >
                          {train.line?.name || 'Local'}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium text-xs">
                          {train.trainType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          ● {train.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Train Main Details */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
                      {/* Train Name */}
                      <div className="md:col-span-4">
                        <h3 className="font-bold text-lg">{train.trainName}</h3>
                        <p className="text-xs text-muted-foreground font-mono">#{train.trainNumber}</p>
                      </div>

                      {/* Journey Timing Diagram */}
                      <div className="md:col-span-5 flex items-center justify-between gap-3 bg-secondary/30 p-3 rounded-xl">
                        <div className="text-center">
                          <p className="text-lg font-bold">{train.departureTime}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[90px]">
                            {fromStation?.name}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {train.durationMinutes} mins
                          </span>
                          <div className="w-full h-1 bg-border rounded-full relative my-1">
                            <div className="absolute inset-y-0 left-0 right-0 bg-primary/40 rounded-full" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {train.stopsCount} stops
                          </span>
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold">{train.arrivalTime}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[90px]">
                            {toStation?.name}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-3 flex items-center gap-2 justify-end">
                        <button
                          onClick={() =>
                            navigate('/tickets', {
                              state: { fromStation, toStation, train },
                            })
                          }
                          className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Ticket className="w-3.5 h-3.5" /> Book Ticket
                        </button>
                        <button
                          onClick={() =>
                            navigate('/tracking', {
                              state: { train },
                            })
                          }
                          className="p-2.5 rounded-xl border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                          title="Live Tracking"
                        >
                          <Navigation className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expand Stops toggle */}
                    {train.stopsList && train.stopsList.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <button
                          onClick={() => setExpandedTrainId(isExpanded ? null : train.id)}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? 'Hide Route Details' : 'View Intermediate Stops'}
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-4 rounded-xl bg-secondary/20 space-y-2 text-xs">
                            <p className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mb-2">
                              Station Route & Schedule
                            </p>
                            <div className="space-y-1.5 border-l-2 border-primary/30 pl-3">
                              {train.stopsList.map((stop, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-1 text-foreground"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary -ml-[17px]" />
                                    <span className="font-medium">{stop.stationName}</span>
                                    {stop.stationCode && (
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        ({stop.stationCode})
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground font-mono">
                                    {stop.arrivalTime || stop.departureTime || '—'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
