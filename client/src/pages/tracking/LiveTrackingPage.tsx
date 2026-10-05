import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Clock, Activity, ArrowLeft, RefreshCcw } from 'lucide-react';
import { getLiveTrainStatus, TrainSearchResult } from '../../lib/services/railway';
import { useSocket } from '../../hooks/useSocket';

export default function LiveTrackingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const train = location.state?.train as TrainSearchResult;

  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLiveStatus = async () => {
    if (!train) return;
    try {
      setLoading(true);
      setError('');
      // Use today's date for live tracking
      const today = new Date().toISOString().split('T')[0];
      const data = await getLiveTrainStatus(train.trainNumber, today);
      setStatusData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch live train status. The train might not be running today or the service is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const { onEvent, offEvent } = useSocket();

  useEffect(() => {
    if (!train) {
      navigate('/search');
      return;
    }
    fetchLiveStatus();
  }, [train, navigate]);

  useEffect(() => {
    const handleUpdate = (data: any) => {
      if (data.trainNumber === train?.trainNumber) {
        setStatusData((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            liveStatus: {
              ...prev.liveStatus,
              lastReportedStationCode: data.currentStationId, // Assuming admin sends code
              delayInMins: data.delayMinutes || 0,
              status: data.status,
            }
          };
        });
      }
    };

    onEvent('train_location_update', handleUpdate);
    return () => {
      offEvent('train_location_update', handleUpdate);
    };
  }, [train, onEvent, offEvent]);

  if (!train) return null;

  return (
    <div className="space-y-6 page-enter pb-12">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            Live Train Status
          </h1>
          <p className="text-muted-foreground mt-1">
            {train.trainName} ({train.trainNumber})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Current Status
              </p>
              {loading ? (
                <div className="h-8 w-32 bg-secondary animate-pulse rounded-lg" />
              ) : statusData && statusData.liveStatus ? (
                <div className="flex items-center gap-2 text-xl font-bold">
                  {statusData.liveStatus.delayInMins > 0 ? (
                    <span className="text-amber-500">Delayed by {statusData.liveStatus.delayInMins} mins</span>
                  ) : (
                    <span className="text-emerald-500">On Time</span>
                  )}
                </div>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Information unavailable</p>
              )}
            </div>
            <button
              onClick={fetchLiveStatus}
              disabled={loading}
              className="p-3 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all active:scale-95"
            >
              <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Route Timetable
            </h3>
            
            {loading && !statusData && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="w-4 h-4 rounded-full bg-secondary animate-pulse" />
                    <div className="flex-1 h-12 bg-secondary animate-pulse rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {statusData && statusData.route && (
              <div className="relative border-l-2 border-primary/30 pl-6 space-y-6 py-2 ml-2">
                {statusData.route.map((stop: any, index: number) => {
                  // Determine if the train has passed this stop based on liveStatus
                  const hasPassed = statusData.liveStatus && stop.distanceFromSourceKm <= statusData.liveStatus.distanceTravelledKm;
                  const isCurrent = statusData.liveStatus && stop.stationCode === statusData.liveStatus.lastReportedStationCode;

                  return (
                    <div key={index} className="relative">
                      <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                        isCurrent ? 'border-primary ring-4 ring-primary/20' : 
                        hasPassed ? 'border-primary' : 'border-muted'
                      }`}>
                        {hasPassed && !isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                      </div>
                      
                      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl transition-all ${
                        isCurrent ? 'bg-primary/10 border border-primary/30' : 
                        hasPassed ? 'opacity-70' : 'bg-secondary/30'
                      }`}>
                        <div>
                          <p className={`font-bold ${isCurrent ? 'text-primary' : ''}`}>
                            {stop.stationName} <span className="text-xs font-mono text-muted-foreground ml-1">({stop.stationCode})</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {stop.distanceFromSourceKm} km
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-mono font-medium text-sm">
                            {stop.scheduledArrivalTime || stop.scheduledDepartureTime || '--:--'}
                          </p>
                          {stop.actualArrivalTime && (
                            <p className="text-xs text-emerald-500 mt-1">Act: {stop.actualArrivalTime}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Train Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Train No</span>
                <span className="font-semibold">{train.trainNumber}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Name</span>
                <span className="font-semibold text-right max-w-[150px] truncate">{train.trainName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Line</span>
                <span className="font-semibold">{train.line?.name}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold">{train.trainType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Journey Date</span>
                <span className="font-semibold">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
