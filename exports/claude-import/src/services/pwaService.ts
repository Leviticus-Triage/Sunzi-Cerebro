/**
 * PWA Service - Progressive Web App Management
 * Handles service worker registration, updates, and PWA features
 */

interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CacheStatus {
  version: string;
  caches: Record<string, { entries: number; urls: string[] }>;
  totalSize: number;
}

class PWAService {
  private deferredPrompt: PWAInstallPromptEvent | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  /**
   * Initialize PWA features
   */
  async initialize(): Promise<void> {
    console.log('[PWA] Initializing PWA service...');

    // Register service worker
    await this.registerServiceWorker();

    // Setup install prompt
    this.setupInstallPrompt();

    // Setup push notifications
    this.setupPushNotifications();

    // Monitor connection status
    this.monitorConnectionStatus();

    // Setup background sync
    this.setupBackgroundSync();

    console.log('[PWA] PWA service initialized successfully');
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service workers not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.serviceWorkerRegistration = registration;

      console.log('[PWA] Service worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      // Initial update check
      registration.update();
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  /**
   * Setup install prompt for A2HS (Add to Home Screen)
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as PWAInstallPromptEvent;

      console.log('[PWA] Install prompt ready');

      // Dispatch custom event to notify app
      window.dispatchEvent(new CustomEvent('pwa-install-ready'));
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.deferredPrompt = null;

      // Track installation analytics
      this.trackEvent('pwa_installed');
    });
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;

      console.log('[PWA] Install prompt result:', choiceResult.outcome);

      this.deferredPrompt = null;

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if app can be installed
   */
  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return;
    }

    console.log('[PWA] Push notification permission:', Notification.permission);
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('[PWA] Notification permission granted');
        await this.subscribeToNotifications();
      }

      return permission;
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  private async subscribeToNotifications(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('[PWA] Service worker not registered');
      return;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // VAPID public key - replace with your own
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8XjqWqFuPv3T6WZZuNq0DPWUqn0jzqXNb5GmPgHkj5tWxYj3F8pDnI'
        )
      });

      console.log('[PWA] Push subscription created:', subscription);

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
    }
  }

  /**
   * Send push subscription to backend
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('http://localhost:8890/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        console.log('[PWA] Subscription sent to backend');
      } else {
        console.error('[PWA] Failed to send subscription to backend');
      }
    } catch (error) {
      console.error('[PWA] Error sending subscription:', error);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('[PWA] Notification permission not granted');
      return;
    }

    if (!this.serviceWorkerRegistration) {
      console.warn('[PWA] Service worker not registered');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      ...options
    };

    await this.serviceWorkerRegistration.showNotification(title, defaultOptions);
  }

  /**
   * Monitor connection status
   */
  private monitorConnectionStatus(): void {
    window.addEventListener('online', () => {
      console.log('[PWA] Connection restored - online');
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      console.log('[PWA] Connection lost - offline');
      this.handleOffline();
    });

    // Initial check
    if (!navigator.onLine) {
      this.handleOffline();
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    window.dispatchEvent(new CustomEvent('pwa-online'));

    // Trigger background sync
    this.triggerBackgroundSync();

    // Show notification
    this.showNotification('Verbindung wiederhergestellt', {
      body: 'Synchronisierung läuft...',
      tag: 'connection-status'
    });
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    window.dispatchEvent(new CustomEvent('pwa-offline'));

    console.warn('[PWA] App is now offline - limited functionality');
  }

  /**
   * Check if app is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if (!('sync' in self.registration)) {
      console.warn('[PWA] Background sync not supported');
      return;
    }

    console.log('[PWA] Background sync ready');
  }

  /**
   * Trigger background sync
   */
  async triggerBackgroundSync(tag: string = 'sync-all'): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('[PWA] Service worker not registered');
      return;
    }

    if (!('sync' in this.serviceWorkerRegistration)) {
      console.warn('[PWA] Background sync not supported');
      return;
    }

    try {
      await (this.serviceWorkerRegistration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<CacheStatus | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.serviceWorkerRegistration?.active?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('[PWA] Service worker not registered');
      return;
    }

    this.serviceWorkerRegistration.active?.postMessage({ type: 'CLEAR_CACHE' });

    console.log('[PWA] Cache cleared');
  }

  /**
   * Notify update available
   */
  private notifyUpdateAvailable(): void {
    console.log('[PWA] Update available');

    window.dispatchEvent(new CustomEvent('pwa-update-available'));

    this.showNotification('Update verfügbar', {
      body: 'Eine neue Version ist verfügbar. Klicken Sie, um zu aktualisieren.',
      tag: 'update-available',
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Aktualisieren' },
        { action: 'dismiss', title: 'Später' }
      ]
    });
  }

  /**
   * Apply update
   */
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      console.warn('[PWA] Service worker not registered');
      return;
    }

    const waiting = this.serviceWorkerRegistration.waiting;

    if (!waiting) {
      console.warn('[PWA] No waiting service worker');
      return;
    }

    waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload when new service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Helper: Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Track analytics event
   */
  private trackEvent(eventName: string): void {
    // Send to analytics service
    console.log('[PWA] Event tracked:', eventName);
  }
}

// Export singleton instance
export const pwaService = new PWAService();

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  pwaService.initialize().catch(console.error);
}

export default pwaService;
