import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import useResponsive from '../hooks/useResponsive';

function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const { isMobile } = useResponsive();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      checkPushNotificationStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Initialize notification service when component mounts
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      const initialized = await notificationService.init();
      if (initialized) {
        setPushEnabled(notificationService.isSubscribed);
        // Register device info
        await notificationService.registerDevice();
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(20, 0);
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const checkPushNotificationStatus = async () => {
    try {
      const isSubscribed = await notificationService.checkSubscription();
      setPushEnabled(isSubscribed);
    } catch (error) {
      console.error('Failed to check push notification status:', error);
    }
  };

  const togglePushNotifications = async () => {
    try {
      if (pushEnabled) {
        await notificationService.unsubscribe();
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        await notificationService.subscribe();
        setPushEnabled(true);
        toast.success('Push notifications enabled');
      }
    } catch (error) {
      console.error('Failed to toggle push notifications:', error);
      toast.error('Failed to update notification settings');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'booking_confirmation': '📅',
      'lesson_reminder': '⏰',
      'payment_received': '💰',
      'lesson_completion': '✅',
      'default': '📢'
    };
    return iconMap[type] || iconMap.default;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Notification Panel */}
      <div className={`absolute ${isMobile ? 'inset-x-0 bottom-0' : 'right-0 top-0'} bg-white shadow-xl ${isMobile ? 'rounded-t-xl' : 'w-96'} flex flex-col max-h-screen`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold">Notifications</h2>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Push Notification Toggle */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Push Notifications</div>
              <div className="text-xs text-gray-600">
                Get notified about bookings and reminders
              </div>
            </div>
            <button
              onClick={togglePushNotifications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <div className="text-sm">No notifications yet</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.created_at)}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={() => {
              setNotifications(prev => 
                prev.map(notif => ({ ...notif, is_read: true }))
              );
              // Mark all as read on server
              notifications.filter(n => !n.is_read).forEach(notif => 
                notificationService.markAsRead(notif.id)
              );
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark All as Read
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Toast Component
export function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start space-x-3">
        <div className="text-xl">
          {notification.icon || '📢'}
        </div>
        <div className="flex-1">
          <div className="font-medium text-gray-900">
            {notification.title}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {notification.body}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Hook for managing notification toasts
export function useNotificationToasts() {
  const [toasts, setToasts] = useState([]);

  const showToast = (notification) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...notification, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}

export default NotificationCenter;