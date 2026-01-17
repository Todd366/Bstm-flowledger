import React, { useState } from 'react';
import { Camera, Package, Truck, CheckCircle, AlertTriangle, Clock, LogOut, Download, Shield, ChevronRight, DollarSign } from 'lucide-react';

const useStorage = () => {
  const [data, setData] = useState({
    batches: [],
    dispatches: [],
    receipts: [],
    incidents: [],
    users: [
      { id: 1, name: 'John Keeper', role: 'storekeeper', pin: '1111', trustScore: 98 },
      { id: 2, name: 'Mary Dispatch', role: 'dispatcher', pin: '2222', trustScore: 95 },
      { id: 3, name: 'Peter Driver', role: 'driver', pin: '3333', trustScore: 92 },
      { id: 4, name: 'Sarah Receiver', role: 'receiver', pin: '4444', trustScore: 96 },
      { id: 5, name: 'Owner Boss', role: 'manager', pin: '5555', trustScore: 100 }
    ]
  });
  const save = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  return { data, save };
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
          <div className="bg-gray-200 h-32 rounded flex items-center justify-center">
            <Camera className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-sm text-green-600 text-center">✓ Captured</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-gray-50 h-32 rounded flex items-center justify-center">
            <Camera className="w-10 h-10 text-gray-400" />
          </div>
          <button onClick={handleCapture} className="bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold">
            Take Photo
          </button>
          <p className="text-xs text-gray-500 text-center">{label}</p>
        </div>
      )}
    </div>
  );
};

const TrustBadge = ({ score }) => {
  const color = score >= 95 ? 'text-green-600' : score >= 80 ? 'text-yellow-600' : 'text-red-600';
  return (
    <div className={`flex items-center gap-1 ${color} font-semibold text-sm`}>
      <Shield className="w-4 h-4" />
      <span>{score}%</span>
    </div>
  );
};

const StorekeeperView = ({ data, save, user }) => {
  const [view, setView] = useState('home');
  const [formData, setFormData] = useState({});
  const [photos, setPhotos] = useState({});

  const createBatch = () => {
    if (!photos.doc || !photos.items || !formData.name || !formData.qty) {
      alert('Missing required fields');
      return;
    }
    const batch = {
      id: `BAT-${Date.now()}`,
      productName: formData.name,
      quantity: parseInt(formData.qty),
      supplier: formData.supplier || 'Unknown',
      unitCost: parseFloat(formData.cost || 0),
      photos, createdBy: user.name, createdAt: new Date().toISOString(),
      status: 'in_storage', custody: 'company'
    };
    save('batches', [...data.batches, batch]);
    alert('Batch created');
    setView('home');
    setFormData({});
    setPhotos({});
  };

  const prepareDispatch = (batch) => {
    if (!photos.packed || !photos.sealed || !formData.qty) {
      alert('Missing required fields');
      return;
    }
    const dispatch = {
      id: `DSP-${Date.now()}`, batchId: batch.id, productName: batch.productName,
      quantity: parseInt(formData.qty), photos, preparedBy: user.name,
      preparedAt: new Date().toISOString(), status: 'pending_approval'
    };
    save('dispatches', [...data.dispatches, dispatch]);
    save('batches', data.batches.map(b => b.id === batch.id ? { ...b, status: 'prepared' } : b));
    alert('Dispatch prepared');
    setView('home');
    setFormData({});
    setPhotos({});
  };

  if (view === 'intake') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">New Intake</h2>
        <PhotoCapture label="Supplier doc" onCapture={(p) => setPhotos({...photos, doc: p})} />
        <input type="text" placeholder="Product name" className="w-full p-3 border-2 rounded-lg" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        <PhotoCapture label="Items photo" onCapture={(p) => setPhotos({...photos, items: p})} />
        <input type="number" placeholder="Quantity" className="w-full p-3 border-2 rounded-lg" value={formData.qty || ''} onChange={(e) => setFormData({...formData, qty: e.target.value})} />
        <input type="text" placeholder="Supplier" className="w-full p-3 border-2 rounded-lg" value={formData.supplier || ''} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
        <input type="number" placeholder="Unit cost" className="w-full p-3 border-2 rounded-lg" value={formData.cost || ''} onChange={(e) => setFormData({...formData, cost: e.target.value})} />
        <div className="flex gap-3">
          <button onClick={() => setView('home')} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
          <button onClick={createBatch} className="flex-1 bg-blue-600 text-white p-3 rounded-lg">Save</button>
        </div>
      </div>
    );
  }

  if (view === 'dispatch') {
    const storage = data.batches.filter(b => b.status === 'in_storage');
    if (formData.batchId) {
      const batch = data.batches.find(b => b.id === formData.batchId);
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Prepare Dispatch</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-bold">{batch.productName}</p>
            <p className="text-sm">Available: {batch.quantity}</p>
          </div>
          <input type="number" placeholder="Qty to dispatch" max={batch.quantity} className="w-full p-3 border-2 rounded-lg" value={formData.qty || ''} onChange={(e) => setFormData({...formData, qty: e.target.value})} />
          <PhotoCapture label="Packed" onCapture={(p) => setPhotos({...photos, packed: p})} />
          <PhotoCapture label="Sealed" onCapture={(p) => setPhotos({...photos, sealed: p})} />
          <div className="flex gap-3">
            <button onClick={() => setFormData({})} className="flex-1 bg-gray-200 p-3 rounded-lg">Back</button>
            <button onClick={() => prepareDispatch(batch)} className="flex-1 bg-green-600 text-white p-3 rounded-lg">Submit</button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Select Batch</h2>
        {storage.map(b => (
          <div key={b.id} onClick={() => setFormData({batchId: b.id})} className="border-2 p-4 rounded-lg cursor-pointer hover:border-blue-500">
            <p className="font-bold">{b.productName}</p>
            <p className="text-sm">Qty: {b.quantity}</p>
          </div>
        ))}
        <button onClick={() => setView('home')} className="w-full bg-gray-200 p-3 rounded-lg">Cancel</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Storekeeper</h2>
        <TrustBadge score={user.trustScore} />
      </div>
      <button onClick={() => setView('intake')} className="w-full bg-blue-600 text-white p-4 rounded-lg flex items-center justify-between">
        <span className="font-bold">New Intake</span>
        <ChevronRight />
      </button>
      <button onClick={() => setView('dispatch')} className="w-full bg-green-600 text-white p-4 rounded-lg flex items-center justify-between">
        <span className="font-bold">Prepare Dispatch</span>
        <ChevronRight />
      </button>
      <div>
        <h3 className="font-bold mb-2">Recent Batches</h3>
        {data.batches.slice(-5).reverse().map(b => (
          <div key={b.id} className="border p-3 rounded mb-2">
            <p className="font-semibold">{b.productName}</p>
            <p className="text-sm text-gray-600">{b.id}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const DispatcherView = ({ data, save, user }) => {
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});

  const approve = () => {
    if (!form.trans || !form.driver || !form.vehicle) {
      alert('All fields required');
      return;
    }
    const updated = { ...sel, status: 'approved', transporter: form.trans, driver: form.driver, vehicle: form.vehicle, expectedDelivery: form.exp, approvedBy: user.name, approvedAt: new Date().toISOString(), custody: 'transporter' };
    save('dispatches', data.dispatches.map(d => d.id === sel.id ? updated : d));
    alert('Approved');
    setSel(null);
    setForm({});
  };

  const pending = data.dispatches.filter(d => d.status === 'pending_approval');

  if (sel) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Approve</h2>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="font-bold">{sel.productName}</p>
          <p className="text-sm">Qty: {sel.quantity}</p>
        </div>
        <input type="text" placeholder="Transporter" className="w-full p-3 border-2 rounded-lg" value={form.trans || ''} onChange={(e) => setForm({...form, trans: e.target.value})} />
        <input type="text" placeholder="Driver" className="w-full p-3 border-2 rounded-lg" value={form.driver || ''} onChange={(e) => setForm({...form, driver: e.target.value})} />
        <input type="text" placeholder="Vehicle" className="w-full p-3 border-2 rounded-lg" value={form.vehicle || ''} onChange={(e) => setForm({...form, vehicle: e.target.value})} />
        <input type="datetime-local" className="w-full p-3 border-2 rounded-lg" value={form.exp || ''} onChange={(e) => setForm({...form, exp: e.target.value})} />
        <div className="flex gap-3">
          <button onClick={() => setSel(null)} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
          <button onClick={approve} className="flex-1 bg-green-600 text-white p-3 rounded-lg">Approve</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Dispatcher</h2>
      {pending.map(d => (
        <div key={d.id} onClick={() => setSel(d)} className="border-2 p-4 rounded-lg cursor-pointer hover:border-blue-500">
          <p className="font-bold">{d.productName}</p>
          <p className="text-sm">Qty: {d.quantity}</p>
        </div>
      ))}
    </div>
  );
};

const DriverView = ({ data, save, user }) => {
  const [sel, setSel] = useState(null);
  const [photo, setPhoto] = useState(null);

  const confirm = () => {
    if (!photo) {
      alert('Photo required');
      return;
    }
    const updated = { ...sel, status: 'in_transit', departurePhoto: photo, departedAt: new Date().toISOString() };
    save('dispatches', data.dispatches.map(d => d.id === sel.id ? updated : d));
    alert('Departed');
    setSel(null);
    setPhoto(null);
  };

  const mine = data.dispatches.filter(d => d.status === 'approved' && d.driver === user.name);

  if (sel) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Confirm Departure</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="font-bold">{sel.id}</p>
          <p className="text-sm">Vehicle: {sel.vehicle}</p>
        </div>
        <PhotoCapture label="Loaded vehicle" onCapture={setPhoto} />
        <div className="flex gap-3">
          <button onClick={() => setSel(null)} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
          <button onClick={confirm} className="flex-1 bg-blue-600 text-white p-3 rounded-lg">Confirm</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Driver</h2>
      {mine.map(d => (
        <div key={d.id} onClick={() => setSel(d)} className="border-2 p-4 rounded-lg cursor-pointer hover:border-blue-500">
          <p className="font-bold">{d.id}</p>
          <p className="text-sm">Vehicle: {d.vehicle}</p>
        </div>
      ))}
    </div>
  );
};

const ReceiverView = ({ data, save, user }) => {
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({});
  const [photos, setPhotos] = useState({});

  const complete = () => {
    if (!photos.received || !form.qty || !form.cond) {
      alert('Required fields missing');
      return;
    }
    const dispatch = data.dispatches.find(d => d.id === sel);
    const mismatch = parseInt(form.qty) !== dispatch.quantity;
    const damaged = form.cond === 'damaged';

    if (mismatch || damaged) {
      if (!photos.damage) {
        alert('Damage photo required');
        return;
      }
      const incident = { id: `INC-${Date.now()}`, dispatchId: dispatch.id, type: damaged ? 'damage' : 'mismatch', quantityExpected: dispatch.quantity, quantityReceived: parseInt(form.qty), condition: form.cond, reason: form.reason, photos, reportedBy: user.name, reportedAt: new Date().toISOString() };
      save('incidents', [...data.incidents, incident]);
    }

    const receipt = { id: `REC-${Date.now()}`, dispatchId: dispatch.id, quantityReceived: parseInt(form.qty), condition: form.cond, photos, receivedBy: user.name, receivedAt: new Date().toISOString(), hasIncident: mismatch || damaged };
    save('receipts', [...data.receipts, receipt]);
    save('dispatches', data.dispatches.map(d => d.id === dispatch.id ? { ...d, status: 'completed' } : d));
    alert(mismatch || damaged ? 'Receipt with incident' : 'Receipt complete');
    setSel(null);
    setForm({});
    setPhotos({});
  };

  const transit = data.dispatches.filter(d => d.status === 'in_transit');

  if (sel) {
    const dispatch = data.dispatches.find(d => d.id === sel);
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Receive</h2>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="font-bold">{dispatch.id}</p>
          <p className="text-sm">Expected: {dispatch.quantity}</p>
        </div>
        <PhotoCapture label="Items received" onCapture={(p) => setPhotos({...photos, received: p})} />
        <input type="number" placeholder="Qty received" className="w-full p-3 border-2 rounded-lg" value={form.qty || ''} onChange={(e) => setForm({...form, qty: e.target.value})} />
        <select className="w-full p-3 border-2 rounded-lg" value={form.cond || ''} onChange={(e) => setForm({...form, cond: e.target.value})}>
          <option value="">Condition</option>
          <option value="intact">Intact</option>
          <option value="damaged">Damaged</option>
        </select>
        {(form.cond === 'damaged' || (form.qty && parseInt(form.qty) !== dispatch.quantity)) && (
          <>
            <PhotoCapture label="Damage evidence" onCapture={(p) => setPhotos({...photos, damage: p})} />
            <select className="w-full p-3 border-2 rounded-lg" value={form.reason || ''} onChange={(e) => setForm({...form, reason: e.target.value})}>
              <option value="">Reason</option>
              <option value="broken">Broken</option>
              <option value="missing">Missing</option>
              <option value="wet">Wet</option>
            </select>
          </>
        )}
        <div className="flex gap-3">
          <button onClick={() => setSel(null)} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
          <button onClick={complete} className="flex-1 bg-green-600 text-white p-3 rounded-lg">Submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Receiver</h2>
      {transit.map(d => (
        <div key={d.id} onClick={() => setSel(d.id)} className="border-2 p-4 rounded-lg cursor-pointer hover:border-blue-500">
          <p className="font-bold">{d.id}</p>
          <p className="text-sm">Qty: {d.quantity}</p>
        </div>
      ))}
    </div>
  );
};

const ManagerView = ({ data }) => {
  const [view, setView] = useState('dash');
  const [selBatch, setSelBatch] = useState(null);

  const loss = data.incidents.reduce((sum, inc) => {
    const dispatch = data.dispatches.find(d => d.id === inc.dispatchId);
    const batch = data.batches.find(b => b.id === dispatch?.batchId);
    const qty = inc.quantityExpected - inc.quantityReceived;
    return sum + (qty * (batch?.unitCost || 0));
  }, 0);

  if (view === 'timeline' && selBatch) {
    const batch = data.batches.find(b => b.id === selBatch);
    const dispatches = data.dispatches.filter(d => d.batchId === batch.id);

    return (
      <div className="space-y-4">
        <button onClick={() => setView('dash')} className="text-blue-600">← Back</button>
        <h2 className="text-xl font-bold">{batch.productName}</h2>
        <div className="space-y-3">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="font-semibold">Created</p>
            <p className="text-sm">{new Date(batch.createdAt).toLocaleString()}</p>
          </div>
          {dispatches.map(d => (
            <div key={d.id}>
              <div className="border-l-4 border-yellow-500 pl-4">
                <p className="font-semibold">Dispatched</p>
                <p className="text-sm">{new Date(d.preparedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full bg-blue-600 text-white p-3 rounded-lg flex items-center justify-center gap-2">
          <Download className="w-5 h-5" />
          Export PDF
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manager</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <Package className="w-8 h-8 text-blue-600" />
          <p className="text-2xl font-bold">{data.batches.length}</p>
          <p className="text-sm">Batches</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <p className="text-2xl font-bold">{data.incidents.length}</p>
          <p className="text-sm">Incidents</p>
        </div>
      </div>
      {loss > 0 && (
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="font-semibold">Total Loss</p>
          <p className="text-3xl font-bold text-red-600">P {loss.toFixed(2)}</p>
        </div>
      )}
      <div>
        <h3 className="font-bold mb-2">Batches</h3>
        {data.batches.slice(-5).reverse().map(b => (
          <div key={b.id} onClick={() => { setSelBatch(b.id); setView('timeline'); }} className="border p-3 rounded mb-2 cursor-pointer">
            <p className="font-semibold">{b.productName}</p>
            <p className="text-xs text-blue-600">View timeline →</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  const { data, save } = useStorage();
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');

  const login = () => {
    const u = data.users.find(x => x.pin === pin);
    if (u) {
      setUser(u);
      setPin('');
    } else {
      alert('Invalid PIN');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Package className="w-16 h-16 text-blue-600 mx-auto mb-3" />
            <h1 className="text-3xl font-bold">FlowLedger-Ω</h1>
            <p className="text-gray-600 text-sm mt-2">Enterprise Edition</p>
          </div>
          <input type="password" placeholder="PIN" maxLength="4" className="w-full p-3 border-2 rounded-lg text-center text-2xl mb-4" value={pin} onChange={(e) => setPin(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && login()} />
          <button onClick={login} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold">Login</button>
          <div className="mt-6 p-4 bg-gray-50 rounded text-xs">
            <p className="font-bold mb-2">Demo PINs:</p>
            <p>1111 Storekeeper | 2222 Dispatcher</p>
            <p>3333 Driver | 4444 Receiver | 5555 Manager</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">FlowLedger-Ω</h1>
            <p className="text-sm">{user.name} - {user.role}</p>
          </div>
          <button onClick={() => setUser(null)} className="p-2 bg-blue-700 rounded">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto p-4">
        {user.role === 'storekeeper' && <StorekeeperView data={data} save={save} user={user} />}
        {user.role === 'dispatcher' && <DispatcherView data={data} save={save} user={user} />}
        {user.role === 'driver' && <DriverView data={data} save={save} user={user} />}
        {user.role === 'receiver' && <ReceiverView data={data} save={save} user={user} />}
        {user.role === 'manager' && <ManagerView data={data} />}
      </main>
    </div>
  );
};

export default App;
