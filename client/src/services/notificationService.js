import apiUrl from '../apiConfig';

class NotificationService {
  constructor() {
    this.swRegistration = null;
    this.vapidPublicKey = null;
    this.isSubscribed = false;
  }

  // Initialize the service
  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);

      // Get VAPID public key
      await this.getVapidPublicKey();
      
      // Check if already subscribed
      await this.checkSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  // Get VAPID public key from server
  async getVapidPublicKey() {
    try {
      const response = await fetch(`${apiUrl}/api/vapid-public-key`);
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      throw error;
    }
  }

  // Check current subscription status
  async checkSubscription() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;
      return this.isSubscribed;
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    try {
      // Request permission first
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Check if we have a service worker and VAPID key
      if (!this.swRegistration || !this.vapidPublicKey) {
        throw new Error('Service worker or VAPID key not available');
      }

      // Convert VAPID key
      const convertedVapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push manager
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      this.isSubscribed = true;
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        this.isSubscribed = false;
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`${apiUrl}/api/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')),
          deviceType: this.getDeviceType()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(subscription) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${apiUrl}/api/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  // Get user notifications from server
  async getNotifications(limit = 20, offset = 0) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `${apiUrl}/api/notifications?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(
        `${apiUrl}/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  // Show browser notification (for testing)
  showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    }
  }

  // Utility functions
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios';
    return 'web';
  }

  // Auto-register device info
  async registerDevice() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const deviceInfo = {
        device_id: this.generateDeviceId(),
        device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        platform: this.getDeviceType(),
        app_version: '1.0.0'
      };

      await fetch(`${apiUrl}/api/device/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(deviceInfo)
      });
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  }

  generateDeviceId() {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      // Generate new device ID
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;