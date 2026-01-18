import React, { useState, useEffect } from 'react';
import { Camera, Package, Truck, CheckCircle, AlertTriangle, LogOut, Download, Shield, ChevronRight, DollarSign, Map, TrendingUp, Bell, Eye } from 'lucide-react';

const useStorage = () => {
  const [data, setData] = useState({
    batches: [], dispatches: [], receipts: [], incidents: [], notifications: [],
    analytics: { transporterScores: {} },
    users: [
      { id: 1, name: 'John Keeper', role: 'storekeeper', pin: '1111', trustScore: 98 },
      { id: 2, name: 'Mary Dispatch', role: 'dispatcher', pin: '2222', trustScore: 95 },
      { id: 3, name: 'Peter Driver', role: 'driver', pin: '3333', trustScore: 92 },
      { id: 4, name: 'Sarah Receiver', role: 'receiver', pin: '4444', trustScore: 96 },
      { id: 5, name: 'Owner Boss', role: 'manager', pin: '5555', trustScore: 100 }
    ]
  });

  const save = (key, value) => {
    setData(prev => {
      const updated = { ...prev, [key]: value };
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('flowledger_data', JSON.stringify(updated)); } catch (e) {}
      }
      return updated;
    });
  };

  const addNotification = (type, message, severity = 'info') => {
    const notif = { id: Date.now(), type, message, severity, timestamp: new Date().toISOString(), read: false };
    save('notifications', [notif, ...data.notifications].slice(0, 50));
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flowledger_data');
      if (stored) {
        try { setData(prev => ({ ...prev, ...JSON.parse(stored) })); } catch (e) {}
      }
    }
  }, []);

  const updateAnalytics = () => {
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
  };

  return { data, save, addNotification, updateAnalytics };
};

const PhotoCapture = ({ onCapture, label }) => {
  const [captured, setCaptured] = useState(null);
  const handleCapture = () => {
    const photo = { id: Date.now(), timestamp: new Date().toISOString() };
    setCaptured(photo);
    onCapture(photo);
  };
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      {captured ? (
        <div className="space-y-2">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-32 rounded flex items-center justify-center relative">
            <Camera className="w-10 h-10 text-gray-500" />
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">✓</div>
          </div>
          <p className="text-xs text-center text-gray-600">{new Date(captured.timestamp).toLocaleString()}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-gray-50 h-32 rounded flex items-center justify-center"><Camera className="w-10 h-10 text-gray-400" /></div>
          <button onClick={handleCapture} className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold">Take Photo</button>
          <p className="text-xs text-gray-500 text-center">{label}</p>
        </div>
      )}
    </div>
  );
};

const TrustBadge = ({ score }) => {
  const color = score >= 95 ? 'text-green-600' : score >= 80 ? 'text-yellow-600' : 'text-red-600';
  return <div className={`flex items-center gap-1 ${color} font-semibold text-sm`}><Shield className="w-4 h-4" /><span>{score}%</span></div>;
};

const LiveMap = ({ dispatches }) => {
  const inTransit = dispatches.filter(d => d.status === 'in_transit');
  return (
    <div className="bg-gradient-to-br from-blue-100 to-green-100 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2"><Map className="w-5 h-5" />Live Tracking</h3>
        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{inTransit.length} Active</span>
      </div>
      <div className="space-y-3">
        {inTransit.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No active deliveries</p>
        ) : (
          inTransit.map((d, i) => (
            <div key={d.id} className="bg-white bg-opacity-80 rounded-lg p-3 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-sm">{d.productName}</p>
                    <p className="text-xs text-gray-600">{d.driver} - {d.vehicle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">ETA</p>
                  <p className="text-sm font-semibold">{new Date(d.expectedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${30 + (i * 20)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AnalyticsDashboard = ({ data }) => {
  const totalBatches = data.batches.length;
  const totalValue = data.batches.reduce((s, b) => s + (b.quantity * b.unitCost), 0);
  const completed = data.dispatches.filter(d => d.status === 'completed').length;
  const total = data.dispatches.length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const lossValue = data.incidents.reduce((s, inc) => {
    const d = data.dispatches.find(x => x.id === inc.dispatchId);
    const b = data.batches.find(x => x.id === d?.batchId);
    return s + ((inc.quantityExpected - inc.quantityReceived) * (b?.unitCost || 0));
  }, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div><p className="text-xs opacity-90">Inventory</p><p className="text-2xl font-bold">{totalBatches}</p><p className="text-xs mt-1">P {totalValue.toFixed(0)}</p></div>
            <Package className="w-10 h-10 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div><p className="text-xs opacity-90">Success</p><p className="text-2xl font-bold">{successRate}%</p><p className="text-xs mt-1">{completed}/{total}</p></div>
            <CheckCircle className="w-10 h-10 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div><p className="text-xs opacity-90">In Transit</p><p className="text-2xl font-bold">{data.dispatches.filter(d => d.status === 'in_transit').length}</p></div>
            <Truck className="w-10 h-10 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div><p className="text-xs opacity-90">Loss</p><p className="text-2xl font-bold">P {lossValue.toFixed(0)}</p><p className="text-xs mt-1">{data.incidents.length}</p></div>
            <AlertTriangle className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border shadow-sm">
        <h3 className="font-bold mb-3 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />Transporters</h3>
        {Object.keys(data.analytics.transporterScores).length === 0 ? (
          <p className="text-gray-500 text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(data.analytics.transporterScores).map(([name, score]) => (
              <div key={name} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{name}</span>
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

const ManagerView = ({ data }) => {
  const [view, setView] = useState('dashboard');
  const [tab, setTab] = useState('analytics');
  const [selectedBatch, setSelectedBatch] = useState(null);

  if (view === 'timeline' && selectedBatch) {
    const batch = data.batches.find(b => b.id === selectedBatch);
    const dispatches = data.dispatches.filter(d => d.batchId === batch.id);
    const receipts = data.receipts.filter(r => dispatches.some(d => d.id === r.dispatchId));
    const incidents = data.incidents.filter(i => dispatches.some(d => d.id === i.dispatchId));

    return (
      <div className="space-y-4">
        <button onClick={() => setView('dashboard')} className="text-blue-600 font-semibold">← Back to Dashboard</button>
        <h2 className="text-xl font-bold">{batch.productName}</h2>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Batch ID: {batch.id}</p>
          <p className="text-sm">Quantity: {batch.quantity} • Cost: P {(batch.quantity * batch.unitCost).toFixed(0)}</p>
        </div>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-semibold">Created</p>
            <p className="text-sm text-gray-600">{new Date(batch.createdAt).toLocaleString()}</p>
            <p className="text-sm">By: {batch.createdBy}</p>
          </div>
          {dispatches.map(d => (
            <div key={d.id} className="space-y-2">
              <div className="border-l-4 border-yellow-500 pl-4 py-2">
                <p className="font-semibold">Dispatch Prepared</p>
                <p className="text-sm text-gray-600">{new Date(d.preparedAt).toLocaleString()}</p>
                <p className="text-sm">Qty: {d.quantity}</p>
              </div>
              {d.approvedAt && (
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="font-semibold">Approved</p>
                  <p className="text-sm text-gray-600">{new Date(d.approvedAt).toLocaleString()}</p>
                  <p className="text-sm">Transporter: {d.transporter} • Driver: {d.driver}</p>
                </div>
              )}
              {d.departedAt && (
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="font-semibold">Departed</p>
                  <p className="text-sm text-gray-600">{new Date(d.departedAt).toLocaleString()}</p>
                </div>
              )}
              {receipts.filter(r => r.dispatchId === d.id).map(r => (
                <div key={r.id} className={`border-l-4 ${r.hasIncident ? 'border-red-500 bg-red-50' : 'border-green-500'} pl-4 py-2`}>
                  <p className="font-semibold">Received {r.hasIncident && '(Incident)'}</p>
                  <p className="text-sm text-gray-600">{new Date(r.receivedAt).toLocaleString()}</p>
                  <p className="text-sm">Qty: {r.quantityReceived} • Condition: {r.condition}</p>
                </div>
              ))}
              {incidents.filter(i => i.dispatchId === d.id).map(inc => (
                <div key={inc.id} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50">
                  <p className="font-semibold text-red-800">Incident: {inc.type}</p>
                  <p className="text-sm">Expected: {inc.quantityExpected} • Received: {inc.quantityReceived}</p>
                  <p className="text-sm">Reason: {inc.reason}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={() => alert('PDF export would generate here')} className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Export PDF Timeline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manager Dashboard</h2>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab('analytics')} className={`px-4 py-2 font-semibold ${tab === 'analytics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Analytics</button>
        <button onClick={() => setTab('map')} className={`px-4 py-2 font-semibold ${tab === 'map' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Live Map</button>
        <button onClick={() => setTab('notifications')} className={`px-4 py-2 font-semibold ${tab === 'notifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          Notifications {data.notifications.filter(n => !n.read).length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{data.notifications.filter(n => !n.read).length}</span>}
        </button>
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
                    <p className="text-xs text-gray-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div>
        <h3 className="font-bold mb-3">Product Timelines</h3>
        {data.batches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No batches yet</p>
        ) : (
          data.batches.slice(-5).reverse().map(b => (
            <div key={b.id} onClick={() => { setSelectedBatch(b.id); setView('timeline'); }} className="border p-3 rounded mb-2 cursor-pointer hover:bg-gray-50">
              <p className="font-semibold">{b.productName}</p>
              <p className="text-sm text-gray-600">{b.id} • Status: {b.status}</p>
              <p className="text-xs text-blue-600 mt-1">View full timeline →</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const App = () => {
  const { data, save, addNotification, updateAnalytics } = useStorage();
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');

  const login = () => {
    const u = data.users.find(x => x.pin === pin);
    if (u) { setUser(u); setPin(''); } else { alert('Invalid PIN'); }
  };

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
              <span className="text-xs text-gray-500">Live System</span>
            </div>
          </div>

          <input 
            type="password" 
            placeholder="Enter PIN" 
            maxLength="4" 
            className="w-full p-4 border-2 border-gray-300 rounded-xl text-center text-3xl tracking-widest font-bold mb-4 focus:border-blue-500 focus:outline-none transition-colors" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && login()} 
          />
          
          <button onClick={login} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-bold text-lg hover:shadow-lg transition-all">
            Login
          </button>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="font-bold text-sm mb-3 text-gray-700">Demo Access:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border">
                <p className="font-semibold text-blue-600">Storekeeper</p>
                <p className="text-gray-600 font-mono">PIN: 1111</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="font-semibold text-purple-600">Dispatcher</p>
                <p className="text-gray-600 font-mono">PIN: 2222</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="font-semibold text-green-600">Driver</p>
                <p className="text-gray-600 font-mono">PIN: 3333</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <p className="font-semibold text-orange-600">Receiver</p>
                <p className="text-gray-600 font-mono">PIN: 4444</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-2 rounded border-2 border-yellow-500 mt-2">
              <p className="font-bold text-gray-800">Manager</p>
              <p className="text-gray-800 font-mono">PIN: 5555</p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Powered by BSTM Systems</p>
            <p className="mt-1">All data stored locally</p>
          </div>
        </div>
      </div>
    );
  }

  const StorekeeperView = ({ data, save, user, addNotification }) => {
    const [view, setView] = useState('home');
    const [form, setForm] = useState({});
    const [photos, setPhotos] = useState({});

    const createBatch = () => {
      if (!photos.doc || !photos.items || !form.name || !form.qty) { alert('❌ Missing fields'); return; }
      const batch = { id: `BAT-${Date.now()}`, productName: form.name, quantity: parseInt(form.qty), supplier: form.supplier || 'Unknown', unitCost: parseFloat(form.cost || 0), photos, createdBy: user.name, createdAt: new Date().toISOString(), status: 'in_storage', custody: 'company' };
      save('batches', [...data.batches, batch]);
      addNotification('Batch Created', `${form.name} added`, 'info');
      alert('✅ Created');
      setView('home'); setForm({}); setPhotos({});
    };

    const prepareDispatch = (batch) => {
      if (!photos.packed || !photos.sealed || !form.qty) { alert('❌ Missing fields'); return; }
      const dispatch = { id: `DSP-${Date.now()}`, batchId: batch.id, productName: batch.productName, quantity: parseInt(form.qty), photos, preparedBy: user.name, preparedAt: new Date().toISOString(), status: 'pending_approval' };
      save('dispatches', [...data.dispatches, dispatch]);
      save('batches', data.batches.map(b => b.id === batch.id ? { ...b, status: 'dispatch_prepared' } : b));
      addNotification('Dispatch Prepared', `${batch.productName} ready`, 'info');
      alert('✅ Prepared');
      setView('home'); setForm({}); setPhotos({});
    };

    if (view === 'intake') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">New Intake</h2><button onClick={() => setView('home')} className="text-2xl">×</button></div>
          <PhotoCapture label="Supplier doc" onCapture={(p) => setPhotos({...photos, doc: p})} />
          <input type="text" placeholder="Product name *" className="w-full p-3 border-2 rounded-lg" value={form.name || ''} onChange={(e) => setForm({...form, name: e.target.value})} />
          <PhotoCapture label="Items" onCapture={(p) => setPhotos({...photos, items: p})} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Qty *" className="w-full p-3 border-2 rounded-lg" value={form.qty || ''} onChange={(e) => setForm({...form, qty: e.target.value})} />
            <input type="number" placeholder="Cost" step="0.01" className="w-full p-3 border-2 rounded-lg" value={form.cost || ''} onChange={(e) => setForm({...form, cost: e.target.value})} />
          </div>
          <input type="text" placeholder="Supplier" className="w-full p-3 border-2 rounded-lg" value={form.supplier || ''} onChange={(e) => setForm({...form, supplier: e.target.value})} />
          <div className="flex gap-3">
            <button onClick={() => setView('home')} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
            <button onClick={createBatch} className="flex-1 bg-blue-600 text-white p-3 rounded-lg">Save</button>
          </div>
        </div>
      );
    }

    if (view === 'dispatch') {
      const storage = data.batches.filter(b => b.status === 'in_storage');
      if (form.batchId) {
        const batch = data.batches.find(b => b.id === form.batchId);
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Prepare Dispatch</h2>
            <div className="bg-blue-50 p-4 rounded-lg border"><p className="font-bold">{batch.productName}</p><p className="text-sm">Available: {batch.quantity}</p></div>
            <input type="number" placeholder="Qty *" max={batch.quantity} className="w-full p-3 border-2 rounded-lg" value={form.qty || ''} onChange={(e) => setForm({...form, qty: e.target.value})} />
            <PhotoCapture label="Packed" onCapture={(p) => setPhotos({...photos, packed: p})} />
            <PhotoCapture label="Sealed" onCapture={(p) => setPhotos({...photos, sealed: p})} />
            <div className="flex gap-3">
              <button onClick={() => setForm({})} className="flex-1 bg-gray-200 p-3 rounded-lg">Back</button>
              <button onClick={() => prepareDispatch(batch)} className="flex-1 bg-green-600 text-white p-3 rounded-lg">Submit</button>
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Select Batch</h2>
          {storage.map(b => <div key={b.id} onClick={() => setForm({batchId: b.id})} className="border-2 p-4 rounded-lg cursor-pointer hover:border-blue-500
