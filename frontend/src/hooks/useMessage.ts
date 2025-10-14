import { App } from 'antd';

export const useMessage = () => {
  const { message } = App.useApp();
  return message;
};

export const useNotification = () => {
  const { notification } = App.useApp();
  return notification;
};

export const useModal = () => {
  const { modal } = App.useApp();
  return modal;
};