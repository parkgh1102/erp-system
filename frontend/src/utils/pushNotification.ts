// Push Notification Utility

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
  }

  // 서비스 워커 등록
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.swRegistration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  // 현재 권한 상태 확인
  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  // 로컬 알림 표시 (서비스 워커 없이)
  showLocalNotification(options: PushNotificationOptions): void {
    if (!this.isSupported || Notification.permission !== 'granted') {
      console.log('Cannot show notification:', Notification.permission);
      return;
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || 'erp-notification',
      data: options.data,
      requireInteraction: options.requireInteraction || false,
    });

    notification.onclick = () => {
      window.focus();
      if (options.data?.url) {
        window.location.href = options.data.url;
      }
      notification.close();
    };
  }

  // 서비스 워커를 통한 알림 표시
  async showPushNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.swRegistration) {
      // 서비스 워커가 없으면 로컬 알림 사용
      this.showLocalNotification(options);
      return;
    }

    try {
      await this.swRegistration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'erp-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        vibrate: [200, 100, 200],
      } as NotificationOptions);
    } catch (error) {
      console.error('Failed to show push notification:', error);
      // 폴백으로 로컬 알림 사용
      this.showLocalNotification(options);
    }
  }

  // 지원 여부 확인
  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

// 싱글톤 인스턴스
export const pushNotificationService = new PushNotificationService();

// 편의 함수들
export const registerPushNotification = () => pushNotificationService.register();
export const requestPushPermission = () => pushNotificationService.requestPermission();
export const getPushPermission = () => pushNotificationService.getPermission();
export const showNotification = (options: PushNotificationOptions) =>
  pushNotificationService.showPushNotification(options);
export const isPushSupported = () => pushNotificationService.isNotificationSupported();
