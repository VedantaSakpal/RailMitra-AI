import { useState, useEffect, useCallback } from 'react';
import {
  Train, ArrowRight, ArrowRightLeft, Users, CreditCard, CheckCircle2,
  Ticket as TicketIcon, Zap, AlertTriangle, RefreshCw, Smartphone,
  Building2, MapPin, Clock, Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Station {
  id: string;
  name: string;
  code: string;
  lineId: string;
}

interface Estimate {
  originStation: Station;
  destStation: Station;
  distanceKm: number;
  baseFare: number;
  farePerPerson: number;
  totalFare: number;
  passengerCount: number;
  isReturn: boolean;
  coachClass: CoachClass;
}

interface BookedTicket {
  id: string;
  ticketNumber: string;
  originStation: Station;
  destStation: Station;
  passengerCount: number;
  fare: number;
  status: string;
  travelDate: string;
  validUntil: string;
  qrCode: string;
  payment: { method: string; status: string };
}

type CoachClass = 'SECOND' | 'FIRST' | 'AC';
type Step = 'book' | 'checkout' | 'payment' | 'ticket' | 'my-tickets';
type PaymentTab = 'UPI' | 'CARD' | 'NETBANKING';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CLASS_LABELS: Record<CoachClass, string> = {
  SECOND: '2nd Class',
  FIRST: '1st Class',
  AC: '❄ AC Local',
};

const CLASS_MULTIPLIER: Record<CoachClass, number> = {
  SECOND: 1, FIRST: 10, AC: 20,
};

function getBaseFare(km: number): number {
  if (km <= 10) return 5;
  if (km <= 25) return 10;
  return 15;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TicketsPage() {
  const [step, setStep] = useState<Step>('book');

  // Booking form
  const [stations, setStations] = useState<Station[]>([]);
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);
  const [isReturn, setIsReturn] = useState(false);
  const [coachClass, setCoachClass] = useState<CoachClass>('SECOND');

  // Estimate
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState('');

  // Payment
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('UPI');
  const [upiId, setUpiId] = useState('demo@upi');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [netbankBank, setNetbankBank] = useState('SBI');
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');

  // Generated ticket
  const [generatedTicket, setGeneratedTicket] = useState<BookedTicket | null>(null);

  // My Tickets
  const [myTickets, setMyTickets] = useState<BookedTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // ── Fetch Stations ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('http://localhost:5000/api/railway/stations')
      .then(r => r.json())
      .then(d => { if (d.success) setStations(d.data); })
      .catch(console.error);
  }, []);

  // ── Estimate Fare ──────────────────────────────────────────────────────────
  const fetchEstimate = useCallback(async () => {
    if (!originId || !destId || originId === destId) {
      setEstimate(null);
      return;
    }
    setEstimating(true);
    setEstimateError('');
    try {
      const res = await fetch('http://localhost:5000/api/tickets/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originStationId: originId, destStationId: destId, passengerCount, isReturn, coachClass }),
      });
      const data = await res.json();
      if (data.success) {
        setEstimate(data.data);
      } else {
        setEstimateError(data.message);
        setEstimate(null);
      }
    } catch {
      setEstimateError('Network error');
      setEstimate(null);
    } finally {
      setEstimating(false);
    }
  }, [originId, destId, passengerCount, isReturn, coachClass]);

  useEffect(() => { fetchEstimate(); }, [fetchEstimate]);

  // ── Fetch My Tickets ────────────────────────────────────────────────────────
  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('http://localhost:5000/api/tickets/my-tickets', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setMyTickets(data.data);
    } catch (e) { console.error(e); }
    finally { setLoadingTickets(false); }
  };

  useEffect(() => {
    if (step === 'my-tickets') fetchMyTickets();
  }, [step]);

  // ── Mock Payment & Booking ──────────────────────────────────────────────────
  const handlePay = async () => {
    if (!estimate) return;
    setPaymentState('processing');

    // Simulate payment gateway delay
    await new Promise(r => setTimeout(r, 1800));

    // 90% success rate for demo
    const success = Math.random() < 0.9;

    if (!success) {
      setPaymentState('failed');
      return;
    }

    // Book on backend
    try {
      const token = useAuthStore.getState().token;
      const methodMap: Record<PaymentTab, string> = {
        UPI: 'MOCK_UPI',
        CARD: 'MOCK_CARD',
        NETBANKING: 'MOCK_NETBANKING',
      };

      const res = await fetch('http://localhost:5000/api/tickets/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          originStationId: estimate.originStation.id,
          destStationId: estimate.destStation.id,
          passengerCount: estimate.passengerCount,
          isReturn: estimate.isReturn,
          coachClass: estimate.coachClass,
          paymentMethod: methodMap[paymentTab],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedTicket(data.data.ticket);
        setPaymentState('success');
        setStep('ticket');
      } else {
        setPaymentState('failed');
      }
    } catch {
      setPaymentState('failed');
    }
  };

  const resetBooking = () => {
    setStep('book');
    setEstimate(null);
    setOriginId('');
    setDestId('');
    setPassengerCount(1);
    setIsReturn(false);
    setCoachClass('SECOND');
    setPaymentState('idle');
    setGeneratedTicket(null);
  };

  // ─── Rendered Steps ───────────────────────────────────────────────────────

  // ── STEP 1: Book Form ─────────────────────────────────────────────────────
  const renderBookStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Form */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Train className="w-5 h-5 text-primary" />
          Book a Journey
        </h2>

        {/* Stations */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">From Station</label>
            <select
              value={originId}
              onChange={e => { setOriginId(e.target.value); }}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Select origin...</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">To Station</label>
            <select
              value={destId}
              onChange={e => { setDestId(e.target.value); }}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Select destination...</option>
              {stations.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Journey Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Journey Type</label>
          <div className="flex bg-secondary/40 p-1 rounded-xl">
            {[false, true].map(ret => (
              <button key={String(ret)} type="button"
                onClick={() => setIsReturn(ret)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${isReturn === ret ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {ret ? '↔ Return' : '→ One-way'}
              </button>
            ))}
          </div>
        </div>

        {/* Coach Class */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Coach Class</label>
          <div className="flex bg-secondary/40 p-1 rounded-xl gap-1">
            {(['SECOND', 'FIRST', 'AC'] as CoachClass[]).map(cls => (
              <button key={cls} type="button"
                onClick={() => setCoachClass(cls)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  coachClass === cls
                    ? cls === 'AC' ? 'bg-cyan-500 text-white shadow-sm'
                      : cls === 'FIRST' ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cls === 'SECOND' ? '2nd' : cls === 'FIRST' ? '1st' : '❄ AC'}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">2nd: 1× · 1st: 10× · AC: 20×</p>
        </div>

        {/* Passengers */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Passengers
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
              className="w-10 h-10 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 font-bold transition-colors">−</button>
            <span className="flex-1 text-center font-bold text-lg">{passengerCount}</span>
            <button type="button" onClick={() => setPassengerCount(Math.min(10, passengerCount + 1))}
              className="w-10 h-10 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 font-bold transition-colors">+</button>
          </div>
        </div>
      </div>

      {/* Right: Fare Summary */}
      <div className="space-y-4">
        {estimating && (
          <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-muted-foreground text-sm">Calculating route...</span>
          </div>
        )}

        {!estimating && estimateError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{estimateError}</p>
          </div>
        )}

        {!estimating && estimate && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {/* Route Header */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 p-5">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="font-bold text-lg leading-none">{estimate.originStation.code}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]">{estimate.originStation.name}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full flex items-center">
                    <div className="flex-1 border-t-2 border-dashed border-primary/40" />
                    {isReturn ? <ArrowRightLeft className="w-5 h-5 text-primary mx-2" /> : <ArrowRight className="w-5 h-5 text-primary mx-2" />}
                    <div className="flex-1 border-t-2 border-dashed border-primary/40" />
                  </div>
                  <span className="text-xs text-primary font-semibold mt-1">{estimate.distanceKm} km</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg leading-none">{estimate.destStation.code}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[80px]">{estimate.destStation.name}</p>
                </div>
              </div>
            </div>

            {/* Fare Breakdown */}
            <div className="p-5 space-y-3">
              <div className="space-y-2 text-sm">
                {[
                  ['Distance', `${estimate.distanceKm} km`],
                  ['Base Fare (2nd class)', `₹${getBaseFare(estimate.distanceKm)}`],
                  ['Class', CLASS_LABELS[estimate.coachClass] + ` (${CLASS_MULTIPLIER[estimate.coachClass]}×)`],
                  ['Journey Type', estimate.isReturn ? 'Return (2×)' : 'One-way'],
                  ['Passengers', `${estimate.passengerCount} Adult${estimate.passengerCount > 1 ? 's' : ''}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-bold">Total Fare</span>
                  <span className="text-2xl font-bold text-primary">₹{estimate.totalFare}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('checkout')}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CreditCard className="w-5 h-5" />
                Proceed to Pay — ₹{estimate.totalFare}
              </button>
            </div>
          </div>
        )}

        {!estimating && !estimate && !estimateError && (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-background rounded-2xl shadow-sm border border-primary/20 flex items-center justify-center">
              <TicketIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Paperless Travel</h3>
              <p className="text-muted-foreground text-sm">Select stations to see live distance & fare</p>
            </div>
            <div className="w-full space-y-2 pt-2 text-sm">
              {['Fare: ₹5 · ₹10 · ₹15 by distance', 'Return tickets 2×', '1st Class 10× · AC 20×'].map(t => (
                <div key={t} className="flex items-center gap-2 bg-background/60 p-2.5 rounded-lg border border-primary/10">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── STEP 2: Checkout ─────────────────────────────────────────────────────
  const renderCheckout = () => {
    if (!estimate) return null;
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <button onClick={() => setStep('book')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          ← Back to booking
        </button>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-5 border-b border-border/50">
            <h2 className="font-bold text-xl mb-4">Booking Summary</h2>
            <div className="flex items-center gap-3">
              <div>
                <p className="font-bold text-xl">{estimate.originStation.code}</p>
                <p className="text-xs text-muted-foreground">{estimate.originStation.name}</p>
              </div>
              <div className="flex-1 text-center">
                {estimate.isReturn ? <ArrowRightLeft className="w-5 h-5 text-primary mx-auto" /> : <ArrowRight className="w-5 h-5 text-primary mx-auto" />}
              </div>
              <div className="text-right">
                <p className="font-bold text-xl">{estimate.destStation.code}</p>
                <p className="text-xs text-muted-foreground">{estimate.destStation.name}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3 text-sm">
            {[
              ['Distance', `${estimate.distanceKm} km`],
              ['Journey', estimate.isReturn ? 'Return' : 'One-way'],
              ['Class', CLASS_LABELS[estimate.coachClass]],
              ['Passengers', `${estimate.passengerCount}`],
              ['Fare / person', `₹${estimate.farePerPerson}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-muted-foreground">
                <span>{k}</span><span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary text-xl">₹{estimate.totalFare}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep('payment')}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Continue to Payment
        </button>
      </div>
    );
  };

  // ── STEP 3: Payment ─────────────────────────────────────────────────────
  const renderPayment = () => {
    if (!estimate) return null;

    if (paymentState === 'processing') {
      return (
        <div className="max-w-md mx-auto flex flex-col items-center justify-center py-24 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Processing Payment...</h3>
            <p className="text-muted-foreground mt-1 text-sm">Please wait, do not close this window</p>
          </div>
          <div className="text-2xl font-bold text-primary">₹{estimate.totalFare}</div>
        </div>
      );
    }

    if (paymentState === 'failed') {
      return (
        <div className="max-w-md mx-auto flex flex-col items-center justify-center py-16 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-destructive">Payment Failed</h3>
            <p className="text-muted-foreground mt-2 text-sm">Your payment could not be processed. No amount was charged.</p>
          </div>
          <button
            onClick={() => setPaymentState('idle')}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          <button onClick={() => setStep('checkout')} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to summary
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <button onClick={() => setStep('checkout')} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          ← Back
        </button>

        {/* Demo Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">DEMO PAYMENT – No real money will be charged</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80 mt-0.5">This is a college project demonstration. All payment fields are mock/demo only.</p>
          </div>
        </div>

        {/* Amount */}
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">Amount to Pay</p>
          <p className="text-5xl font-bold text-primary mt-1">₹{estimate.totalFare}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {estimate.originStation.code} → {estimate.destStation.code} · {CLASS_LABELS[estimate.coachClass]} · {estimate.passengerCount} pax
          </p>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex bg-secondary/40 p-1 rounded-xl">
          {(['UPI', 'CARD', 'NETBANKING'] as PaymentTab[]).map(tab => (
            <button key={tab} onClick={() => setPaymentTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${paymentTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'UPI' ? '📱 UPI' : tab === 'CARD' ? '💳 Card' : '🏦 Net Banking'}
            </button>
          ))}
        </div>

        {/* UPI */}
        {paymentTab === 'UPI' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="w-4 h-4 text-primary" /> UPI Payment (DEMO)
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">UPI ID</label>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="demo@upi"
                className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground">Demo UPI ID: demo@upi · Any format accepted in demo mode</p>
            </div>
          </div>
        )}

        {/* Card */}
        {paymentTab === 'CARD' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4 text-primary" /> Card Payment (DEMO)
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Card Holder Name</label>
                <input value={cardName} onChange={e => setCardName(e.target.value)}
                  placeholder="Demo User" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Card Number (DEMO)</label>
                <input value={cardNumber} onChange={e => setCardNumber(e.target.value)}
                  placeholder="4111 1111 1111 1111" maxLength={19}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Expiry (DEMO)</label>
                  <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)}
                    placeholder="12/28" maxLength={5}
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">CVV (DEMO)</label>
                  <input value={cardCvv} onChange={e => setCardCvv(e.target.value)}
                    placeholder="123" maxLength={3} type="password"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚠ DEMO ONLY – Never enter real card details</p>
            </div>
          </div>
        )}

        {/* Net Banking */}
        {paymentTab === 'NETBANKING' && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="w-4 h-4 text-primary" /> Net Banking (DEMO)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'BOB'].map(bank => (
                <button key={bank} onClick={() => setNetbankBank(bank)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${netbankBank === bank ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40'}`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handlePay}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <Zap className="w-5 h-5" />
          Pay ₹{estimate.totalFare} (Demo)
        </button>
      </div>
    );
  };

  // ── STEP 4: Generated Ticket ─────────────────────────────────────────────
  const renderTicket = () => {
    const t = generatedTicket;
    if (!t) return null;

    const isExpired = new Date(t.validUntil) < new Date();
    const parts = t.qrCode?.split(':') ?? [];
    const cls = (parts[4] as CoachClass) ?? 'SECOND';
    const distKm = parts[5] ?? '';

    return (
      <div className="max-w-md mx-auto space-y-6">
        {/* Success Banner */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">Booking Confirmed!</h2>
          <p className="text-muted-foreground text-sm">Your digital ticket is ready</p>
        </div>

        {/* Ticket Card */}
        <div className="bg-card border-2 border-primary/30 rounded-3xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Train className="w-5 h-5" />
                  <span className="font-bold text-lg">RailMitra</span>
                </div>
                <p className="text-primary-foreground/80 text-xs font-mono">{t.ticketNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isExpired ? 'bg-white/20 text-white/70' : 'bg-green-400/20 text-green-200 border border-green-400/30'}`}>
                {isExpired ? 'EXPIRED' : 'VALID'}
              </span>
            </div>
          </div>

          {/* Route */}
          <div className="px-5 py-4 border-b border-dashed border-border/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-black">{t.originStation.code}</p>
                <p className="text-xs text-muted-foreground">{t.originStation.name}</p>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className="w-6 h-6 text-primary" />
                <span className="text-xs text-primary font-semibold">{distKm}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">{t.destStation.code}</p>
                <p className="text-xs text-muted-foreground">{t.destStation.name}</p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-5 grid grid-cols-2 gap-4 text-sm">
            {[
              ['Class', CLASS_LABELS[cls]],
              ['Journey', parts[3] === 'RETURN' ? 'Return' : 'One-way'],
              ['Passengers', `${t.passengerCount}`],
              ['Fare Paid', `₹${t.fare}`],
              ['Payment', t.payment?.status ?? 'SUCCESS'],
              ['Method', (t.payment?.method ?? '').replace('MOCK_', '')],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-muted-foreground mb-0.5">{k}</p>
                <p className="font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {/* Validity */}
          <div className="bg-secondary/30 border-t border-dashed border-border/60 px-5 py-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Booked: {formatDate(t.travelDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span className={isExpired ? 'text-destructive font-medium' : 'text-green-600 dark:text-green-400 font-medium'}>
                Valid Until: {formatDate(t.validUntil)}
              </span>
            </div>
          </div>

          {/* QR Placeholder */}
          {!isExpired && (
            <div className="p-5 flex justify-center border-t border-border/40">
              <div className="w-24 h-24 border-2 border-dashed border-primary/40 rounded-xl flex flex-col items-center justify-center gap-1">
                <div className="grid grid-cols-3 gap-0.5">
                  {Array(9).fill(0).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-primary' : 'bg-primary/20'}`} />
                  ))}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1">DEMO QR</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={resetBooking}
            className="flex-1 py-3 border border-border rounded-xl text-sm font-medium hover:bg-secondary/30 transition-colors">
            Book Another
          </button>
          <button onClick={() => { setStep('my-tickets'); }}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            My Tickets
          </button>
        </div>
      </div>
    );
  };

  // ── My Tickets ───────────────────────────────────────────────────────────
  const renderMyTickets = () => (
    <div className="space-y-4">
      {loadingTickets && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loadingTickets && myTickets.length === 0 && (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
          <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold text-lg">No tickets found</h3>
          <p className="text-muted-foreground text-sm mt-1">You haven't booked any tickets yet.</p>
          <button onClick={() => setStep('book')}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90">
            Book Now
          </button>
        </div>
      )}
      {!loadingTickets && myTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myTickets.map(ticket => {
            const isExpired = new Date(ticket.validUntil) < new Date();
            const parts = ticket.qrCode?.split(':') ?? [];
            const cls = (parts[4] as CoachClass) ?? 'SECOND';

            return (
              <div key={ticket.id} className={`rounded-2xl border overflow-hidden shadow-sm ${isExpired ? 'opacity-60 bg-secondary/20' : 'bg-card'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</p>
                      <div className="flex gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isExpired ? 'bg-secondary text-secondary-foreground' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {isExpired ? 'EXPIRED' : 'VALID'}
                        </span>
                        {cls === 'AC' && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">AC</span>}
                        {cls === 'FIRST' && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">1st</span>}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-primary">₹{ticket.fare}</p>
                  </div>
                </div>

                {/* Route */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{ticket.originStation.code}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[90px]">{ticket.originStation.name}</p>
                    </div>
                    <div className="text-muted-foreground">
                      {parts[3] === 'RETURN' ? <ArrowRightLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{ticket.destStation.code}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[90px]">{ticket.destStation.name}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-border/60 pt-3 flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ticket.passengerCount} pax
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className={isExpired ? 'text-destructive' : 'text-green-600 dark:text-green-400'}>
                        {isExpired ? 'Expired' : `Until ${new Date(ticket.validUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Root Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 page-enter pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground mt-1">Book paperless Mumbai Local train tickets instantly.</p>
      </div>

      {/* Tab Navigation (only shown on non-payment/ticket steps) */}
      {step !== 'payment' && step !== 'ticket' && (
        <div className="flex bg-secondary/50 p-1 rounded-xl w-fit">
          {[
            { key: 'book', label: 'Book Ticket' },
            { key: 'my-tickets', label: 'My Tickets' },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => { setStep(tab.key as Step); setPaymentState('idle'); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${step === tab.key || (step === 'checkout' && tab.key === 'book') ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Step Content */}
      {(step === 'book' || step === 'checkout') && (
        step === 'book' ? renderBookStep() : renderCheckout()
      )}
      {step === 'payment' && renderPayment()}
      {step === 'ticket' && renderTicket()}
      {step === 'my-tickets' && renderMyTickets()}
    </div>
  );
}
