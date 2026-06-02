import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Package, Truck, CheckCircle, AlertTriangle, LogOut, Download, Shield,
  ChevronRight, DollarSign, Map, TrendingUp, Bell, X, Github, Settings, Lock,
  AlertCircle, CheckCircle2, Clock, Users, Activity, BarChart3, Home
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CONFIG from './config';
import { ValidationUtils, StorageUtils, ErrorHandler, DateUtils, NumberUtils, ArrayUtils } from './utils/helpers';
import { AuthService, SubscriptionService, CompanyService, SettingsService } from './utils/auth';

// ============ ERROR BOUNDARY ============
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    ErrorHandler.error('React Error Boundary', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white p-3 rounded-lg font-semibold hover:bg-red-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============ CAMERA COMPONENT ============
const PhotoCapture = ({ onCapture, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsOpen(true);
    } catch (err) {
      ErrorHandler.error('Camera access denied', err);
      setError('Camera access denied. Please enable in settings.');
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const reader = new FileReader();
      reader.onload = () => setCaptured(reader.result);
      reader.readAsDataURL(blob);
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const confirmPhoto = useCallback(() => {
    if (onCapture && captured) {
      onCapture({ data: captured, timestamp: new Date().toISOString() });
    }
    setIsOpen(false);
    setCaptured(null);
    stopCamera();
  }, [captured, onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCaptured(null);
  }, []);

  if (captured) {
    return (
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="bg-gray-200 h-48 rounded flex items-center justify-center relative overflow-hidden mb-3">
          <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Captured
          </div>
        </div>
        <p className="text-xs text-center text-gray-600 mb-3">{DateUtils.format(new Date(), 'long')}</p>
        <div className="flex gap-2">
          <button onClick={retakePhoto} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded font-semibold transition">Retake</button>
          <button onClick={confirmPhoto} className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded font-semibold transition">Use Photo</button>
        </div>
      </div>
    );
  }

  if (isOpen) {
    return (
      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
        <video ref={videoRef} autoPlay playsInline className="w-full rounded mb-3 bg-black" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex gap-2">
          <button onClick={() => { stopCamera(); setIsOpen(false); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 p-2 rounded font-semibold transition">Cancel</button>
          <button onClick={takePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-semibold transition">📸 Capture</button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50 text-center">
      <div className="bg-blue-100 h-32 rounded flex items-center justify-center mb-3">
        <Camera className="w-12 h-12 text-blue-500" />
      </div>
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <button onClick={startCamera} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-semibold transition">Open Camera</button>
      <p className="text-xs text-gray-600 mt-2">{label}</p>
    </div>
  );
};

// ============ TRUST BADGE ============
const TrustBadge = ({ score }) => {
  let bgColor = 'bg-green-100';
  let textColor = 'text-green-700';
  if (score < 95) bgColor = 'bg-yellow-100';
  if (score < 80) bgColor = 'bg-red-100';
  if (score < 95) textColor = 'text-yellow-700';
  if (score < 80) textColor = 'text-red-700';

  return (
    <div className={`flex items-center gap-2 ${textColor} font-semibold text-sm ${bgColor} px-3 py-1 rounded-full w-fit`}>
      <Shield className="w-4 h-4" />
      <span>{score}%</span>
    </div>
  );
};

// ============ LIVE MAP ============
const LiveMap = ({ dispatches }) => {
  const inTransit = dispatches.filter(d => d.status === 'in_transit');

  return (
    <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Map className="w-5 h-5" />Live Tracking</h3>
        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">{inTransit.length} Active</span>
      </div>
      <div className="space-y-3">
        {inTransit.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No active deliveries</p>
        ) : (
          inTransit.map((d, i) => (
            <div key={d.id} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">{d.productName}</p>
                    <p className="text-xs text-gray-600">{d.driver} • {d.vehicle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-semibold">{DateUtils.format(d.expectedDelivery, 'time')}</p>
                </div>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${30 + (i * 20)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============ ANALYTICS DASHBOARD ============
const AnalyticsDashboard = ({ data }) => {
  const totalBatches = data.batches.length;
  const totalValue = ArrayUtils.sum(data.batches, 'quantity');
  const completed = data.dispatches.filter(d => d.status === 'completed').length;
  const total = data.dispatches.length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const lossValue = data.incidents.reduce((s, inc) => {
    const d = data.dispatches.find(x => x.id === inc.dispatchId);
    const b = data.batches.find(x => x.id === d?.batchId);
    return s + ((inc.quantityExpected - inc.quantityReceived) * (b?.unitCost || 0));
  }, 0);

  const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className={`bg-gradient-to-br ${color} text-white rounded-lg p-4 shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs opacity-90">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtext && <p className="text-xs mt-1 opacity-75">{subtext}</p>}
        </div>
        <Icon className="w-10 h-10 opacity-80" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Package} label="Inventory" value={totalBatches} subtext={`₱${totalValue}`} color="from-blue-500 to-blue-600" />
        <StatCard icon={CheckCircle} label="Success" value={`${successRate}%`} subtext={`${completed}/${total}`} color="from-green-500 to-green-600" />
        <StatCard icon={Truck} label="In Transit" value={data.dispatches.filter(d => d.status === 'in_transit').length} color="from-purple-500 to-purple-600" />
        <StatCard icon={AlertTriangle} label="Loss" value={`₱${lossValue.toFixed(0)}`} subtext={`${data.incidents.length} incidents`} color="from-red-500 to-red-600" />
      </div>

      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />Transporter Performance</h3>
        {Object.keys(data.analytics.transporterScores).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(data.analytics.transporterScores).map(([name, score]) => (
              <div key={name} className="border rounded-lg p-3 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{name}</span>
                  <TrustBadge score={score.trustScore} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-gray-500">Deliveries</p><p className="font-semibold">{score.total}</p></div>
                  <div><p className="text-xs text-gray-500">Incidents</p><p className="font-semibold text-red-600">{score.incidents}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ DATA MANAGEMENT ============
const useAppData = () => {
  const [data, setData] = useState({
    batches: [],
    dispatches: [],
    receipts: [],
    incidents: [],
    notifications: [],
    analytics: { transporterScores: {} },
    users: CONFIG.DEMO_USERS
  });

  // Load data on mount
  useEffect(() => {
    const stored = StorageUtils.getItem(CONFIG.STORAGE_KEYS.APP_DATA);
    if (stored) {
      setData(prev => ({ ...prev, ...stored }));
    }
  }, []);

  const save = useCallback((key, value) => {
    setData(prev => {
      const updated = { ...prev, [key]: value };
      StorageUtils.setItem(CONFIG.STORAGE_KEYS.APP_DATA, updated);
      return updated;
    });
  }, []);

  const addNotification = useCallback((type, message, severity = 'info') => {
    const notif = {
      id: StringUtils.generateId('NOTIF'),
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      read: false
    };
    save('notifications', [notif, ...data.notifications].slice(0, 50));
  }, [data.notifications, save]);

  const updateAnalytics = useCallback(() => {
    const scores = {};
    data.dispatches.forEach(d => {
      if (d.transporter) {
        if (!scores[d.transporter]) scores[d.transporter] = { total: 0, incidents: 0 };
        scores[d.transporter].total++;
      }
    });
    data.incidents.forEach(inc => {
      const d = data.dispatches.find(x => x.id === inc.dispatchId);
      if (d?.transporter && scores[d.transporter]) scores[d.transporter].incidents++;
    });
    Object.keys(scores).forEach(t => {
      scores[t].trustScore = scores[t].total > 0 ? Math.round(((scores[t].total - scores[t].incidents) / scores[t].total) * 100) : 100;
    });
    save('analytics', { ...data.analytics, transporterScores: scores });
  }, [data, save]);

  return { data, save, addNotification, updateAnalytics };
};

// ============ STRING UTILS ============
const StringUtils = {
  generateId: (prefix = '') => `${prefix}${Date.now()}`,
  capitalize: (str) => str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase() || ''
};

// ============ STOREKEEPER VIEW ============
const StorekeeperView = ({ data, save, user, addNotification }) => {
  const [view, setView] = useState('home');
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState({});

  const createBatch = () => {
    if (!ValidationUtils.hasRequiredFields({ ...form, ...photos }, ['name', 'qty', 'doc', 'items'])) {
      ErrorHandler.warn('Missing required fields for batch creation');
      alert('❌ Missing required fields');
      return;
    }

    const batch = {
      id: StringUtils.generateId('BAT'),
      productName: form.name,
      quantity: parseInt(form.qty),
      supplier: form.supplier || 'Unknown',
      unitCost: parseFloat(form.cost || 0),
      photos,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      status: 'in_storage'
    };

    save('batches', [...data.batches, batch]);
    addNotification('Batch Created', `${form.name} added to inventory`, 'info');
    ErrorHandler.info(`Batch created: ${form.name}`);
    alert('✅ Batch created successfully');
    setView('home');
    setForm({});
    setPhotos({});
  };

  const prepareDispatch = (batch) => {
    if (!ValidationUtils.hasRequiredFields({ ...form, ...photos }, ['qty', 'packed', 'sealed'])) {
      ErrorHandler.warn('Missing required fields for dispatch');
      alert('❌ Missing required fields');
      return;
    }

    const dispatch = {
      id: StringUtils.generateId('DSP'),
      batchId: batch.id,
      productName: batch.productName,
      quantity: parseInt(form.qty),
      photos,
      preparedBy: user.name,
      preparedAt: new Date().toISOString(),
      status: 'pending_approval'
    };

    save('dispatches', [...data.dispatches, dispatch]);
    save('batches', data.batches.map(b => b.id === batch.id ? { ...b, status: 'dispatch_prepared' } : b));
    addNotification('Dispatch Prepared', `${batch.productName} ready for approval`, 'info');
    ErrorHandler.info(`Dispatch prepared: ${batch.productName}`);
    alert('✅ Dispatch prepared successfully');
    setView('home');
    setForm({});
    setPhotos({});
  };

  if (view === 'intake') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">📦 New Intake</h2>
          <button onClick={() => setView('home')} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <PhotoCapture label="Supplier document" onCapture={(p) => setPhotos({...photos, doc: p})} />
        <input type="text" placeholder="Product name *" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
        <PhotoCapture label="Items photo" onCapture={(p) => setPhotos({...photos, items: p})} />
        <div className="grid grid-cols-2 gap-3">
          <input type="number" placeholder="Quantity *" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" value={form.qty || ''} onChange={(e) => setForm({...form, qty: e.target.value})} />
          <input type="number" placeholder="Unit Cost" step="0.01" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" value={form.cost || ''} onChange={(e) => setForm({...form, cost: e.target.value})} />
        </div>
        <input type="text" placeholder="Supplier Name" className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none" value={form.supplier || ''} onChange={(e) => setForm({...form, supplier: e.target.value})} />
        <div className="flex gap-3">
          <button onClick={() => setView('home')} className="flex-1 bg-gray-200 hover:bg-gray-300 p-3 rounded-lg font-semibold transition">Cancel</button>
          <button onClick={createBatch} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition">Save Batch</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Storekeeper Dashboard</h2>
        <TrustBadge score={user.trustScore} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border-2 border-blue-200">
          <Package className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-2xl font-bold">{data.batches.filter(b => b.status === 'in_storage').length}</p>
          <p className="text-xs text-gray-600">In Storage</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border-2 border-green-200">
          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-2xl font-bold">₱{ArrayUtils.sum(data.batches, 'quantity').toFixed(0)}</p>
          <p className="text-xs text-gray-600">Total Value</p>
        </div>
      </div>
      <button onClick={() => setView('intake')} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-between shadow-lg transition font-semibold">
        <div className="flex items-center gap-3"><Package className="w-6 h-6" /><span>New Intake</span></div>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

// ============ MANAGER VIEW ============
const ManagerView = ({ data }) => {
  const [tab, setTab] = useState('analytics');

  const Tab = ({ id, label, badge, icon: Icon }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-4 py-2 font-semibold flex items-center gap-2 transition ${
        tab === id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge && <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>
        <TrustBadge score={100} />
      </div>

      <div className="flex gap-2 border-b overflow-x-auto pb-2">
        <Tab id="analytics" label="Analytics" icon={BarChart3} />
        <Tab id="map" label="Live Map" icon={Map} />
        <Tab id="notifications" label="Alerts" badge={data.notifications.filter(n => !n.read).length} icon={Bell} />
      </div>

      {tab === 'analytics' && <AnalyticsDashboard data={data} />}
      {tab === 'map' && <LiveMap dispatches={data.dispatches} />}
      {tab === 'notifications' && (
        <div className="space-y-3">
          {data.notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No notifications</p>
          ) : (
            data.notifications.slice(0, 10).map(n => (
              <div key={n.id} className={`border rounded-lg p-3 ${n.severity === 'critical' ? 'bg-red-50 border-red-200' : n.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{n.type}</p>
                    <p className="text-sm mt-1">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{DateUtils.format(n.timestamp, 'long')}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-red-600 rounded-full" />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============ MAIN APP ============
const App = () => {
  const { data, save, addNotification, updateAnalytics } = useAppData();
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');
  const [gateApproved, setGateApproved] = useState(false);
  const [gateLoading, setGateLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const emailVerified = AuthService.isEmailVerified();
    if (emailVerified) {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setGateApproved(true);
    } else {
      setGateApproved(false);
    }
    setGateLoading(false);
  }, []);

  const handleLogin = () => {
    if (!ValidationUtils.isValidPin(pin)) {
      ErrorHandler.warn('Invalid PIN format');
      alert('Invalid PIN format');
      return;
    }

    const loggedInUser = AuthService.login(pin);
    if (loggedInUser) {
      setUser(loggedInUser);
      setPin('');
    } else {
      ErrorHandler.warn('Login failed');
      alert('Invalid PIN. Please try again.');
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setUser(null);
    setPin('');
    ErrorHandler.info('User logged out');
  };

  if (gateLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 font-semibold">Initializing Application...</p>
        </div>
      </div>
    );
  }

  if (!gateApproved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">Your email has not been verified. Contact the administrator.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FlowLedger-Ω</h1>
            <p className="text-gray-600 text-sm mt-2">Enterprise Custody Intelligence</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">System Active</span>
            </div>
          </div>

          <input
            type="password"
            placeholder="Enter PIN"
            maxLength="4"
            className="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-3xl tracking-widest font-bold mb-4 focus:border-blue-500 focus:outline-none transition-colors"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />

          <button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white p-4 rounded-xl font-bold text-lg transition">
            Login
          </button>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-bold text-sm mb-3 text-gray-700 flex items-center gap-2"><Users className="w-4 h-4" /> Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { role: 'Storekeeper', pin: '1111', color: 'blue' },
                { role: 'Dispatcher', pin: '2222', color: 'purple' },
                { role: 'Driver', pin: '3333', color: 'green' },
                { role: 'Receiver', pin: '4444', color: 'orange' }
              ].map(({ role, pin: p, color }) => (
                <div key={p} className={`bg-${color}-50 border border-${color}-200 p-2 rounded`}>
                  <p className={`font-semibold text-${color}-600`}>{role}</p>
                  <p className="text-gray-600 font-mono">{p}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded border-2 border-yellow-500 mt-2">
              <p className="font-bold text-gray-800">👨‍💼 Manager</p>
              <p className="text-gray-800 font-mono">5555</p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500 space-y-1">
            <p>Powered by BSTM Systems</p>
            <p>v{CONFIG.APP_VERSION}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Home className="w-5 h-5" />FlowLedger-Ω</h1>
              <p className="text-sm opacity-90">{user.name} • {StringUtils.capitalize(user.role)}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 pb-20">
          {user.role === 'storekeeper' && <StorekeeperView data={data} save={save} user={user} addNotification={addNotification} />}
          {user.role === 'manager' && <ManagerView data={data} />}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 shadow-lg">
          <div className="max-w-6xl mx-auto flex justify-between items-center text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>System Active</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span>📦 Batches: {data.batches.length}</span>
              <span>🚚 Dispatches: {data.dispatches.length}</span>
              <span>⚠️ Incidents: {data.incidents.length}</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
