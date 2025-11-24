import { create } from 'zustand';
import api from '../utils/api';

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
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

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
}));
