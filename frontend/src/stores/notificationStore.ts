import { create } from 'zustand';
import api from '../utils/api';
import {
  registerPushNotification,
  requestPushPermission,
  getPushPermission,
  showNotification,
  isPushSupported
} from '../utils/pushNotification';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  priority: string;
  metadata?: any;
  userId: number;
  businessId?: number;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  pushPermission: NotificationPermission | 'unsupported';
  pushEnabled: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  initPushNotifications: () => Promise<void>;
  requestPushPermission: () => Promise<void>;
  sendPushNotification: (title: string, body: string, url?: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  pushPermission: 'default',
  pushEnabled: false,

  // 알림 조회
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications?limit=50');
      if (response.data.success) {
        set({
          notifications: response.data.data.notifications,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('알림 조회 실패:', error);
      set({ isLoading: false });
    }
  },

  // 미읽은 알림 개수 조회
  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      if (response.data.success) {
        set({ unreadCount: response.data.data.count });
      }
    } catch (error) {
      console.error('미읽은 알림 개수 조회 실패:', error);
    }
  },

  // 알림을 읽음으로 표시
  markAsRead: async (id: number) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        const notifications = get().notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        set({ notifications });
        get().fetchUnreadCount();
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  },

  // 모든 알림을 읽음으로 표시
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      if (response.data.success) {
        const notifications = get().notifications.map(n => ({ ...n, isRead: true }));
        set({ notifications, unreadCount: 0 });
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  },

  // 알림 삭제
  deleteNotification: async (id: number) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data.success) {
        const notifications = get().notifications.filter(n => n.id !== id);
        set({ notifications });
        get().fetchUnreadCount();
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  },

  // 모든 알림 삭제
  deleteAllNotifications: async () => {
    try {
      const response = await api.delete('/notifications');
      if (response.data.success) {
        set({ notifications: [], unreadCount: 0 });
      }
    } catch (error) {
      console.error('모든 알림 삭제 실패:', error);
    }
  },

  // 푸시 알림 초기화
  initPushNotifications: async () => {
    if (!isPushSupported()) {
      set({ pushPermission: 'unsupported', pushEnabled: false });
      return;
    }

    const registered = await registerPushNotification();
    const permission = getPushPermission();

    set({
      pushPermission: permission as NotificationPermission,
      pushEnabled: registered && permission === 'granted'
    });
  },

  // 푸시 알림 권한 요청
  requestPushPermission: async () => {
    const permission = await requestPushPermission();
    set({
      pushPermission: permission,
      pushEnabled: permission === 'granted'
    });
  },

  // 푸시 알림 전송
  sendPushNotification: (title: string, body: string, url?: string) => {
    const { pushEnabled } = get();
    if (!pushEnabled) return;

    showNotification({
      title,
      body,
      data: url ? { url } : undefined
    });
  },
}));
