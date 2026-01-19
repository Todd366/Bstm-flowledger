import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

let notifications = [];
let listeners = [];

export const createNotification = (message, severity = 'info') => {
  const notif = { id: Date.now(), message, severity, read: false };
  notifications = [notif, ...notifications];
  listeners.forEach(cb => cb());
};

export const NotificationBell = ({ onClick }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(notifications.filter(n => !n.read).length);
    listeners.push(update);
    update();
    return () => { listeners = listeners.filter(cb => cb !== update); };
  }, []);
  return (
    <button onClick={onClick} className="relative p-3">
      <Bell className="w-6 h-6" />
      {count > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{count}</span>}
    </button>
  );
};

export const NotificationPanel = ({ isOpen, onClose }) => {
  const [, forceUpdate] = useState({});
  useEffect(() => {
    listeners.push(() => forceUpdate({}));
  }, []);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-6 max-h-96 overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-lg">Notifications</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        {notifications.length === 0 ? <p className="text-gray-500 text-center">No notifications</p> : notifications.map(n => (
          <div key={n.id} className={`p-3 rounded-lg mb-2 ${n.severity === 'success' ? 'bg-green-100' : n.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
            <p className="text-sm">{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
