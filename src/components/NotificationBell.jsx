import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ notifications = [] }) => {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="relative cursor-pointer">
      <Bell className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
