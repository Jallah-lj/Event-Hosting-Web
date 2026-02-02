import React, { useState } from 'react';
import { Bell, Check, ShoppingCart, Calendar, ShieldCheck, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'event' | 'system' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'New Ticket Purchased',
    message: 'John Doe bought 2 VIP tickets for Liberia Music Fest.',
    time: '5 mins ago',
    read: false
  },
  {
    id: '2',
    type: 'event',
    title: 'Event Approved',
    message: 'Your event "Beach Cleanup 2024" has been approved by moderators.',
    time: '2 hours ago',
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'Payout Successful',
    message: 'Your payout of $1,200.00 has been processed.',
    time: 'Yesterday',
    read: true
  },
  {
    id: '4',
    type: 'alert',
    title: 'Profile Incomplete',
    message: 'Please verify your phone number to enable instant payouts.',
    time: '2 days ago',
    read: true
  }
];

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'event': return <Calendar className="w-4 h-4 text-green-500" />;
      case 'system': return <Check className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-6 shadow-sm overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                {unreadCount}
              </span>
            )}
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-medium text-liberia-blue hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="divide-y dark:divide-gray-700 max-h-[300px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">All caught up!</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                !notification.read ? 'bg-white dark:bg-gray-800 shadow-sm border border-blue-100 dark:border-blue-900' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className={`text-sm font-semibold truncate ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/30 border-t dark:border-gray-700 text-center">
           <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
             View All Notifications
           </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
