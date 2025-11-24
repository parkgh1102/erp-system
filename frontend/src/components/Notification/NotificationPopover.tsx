import React, { useEffect } from 'react';
import { List, Empty, Button, Typography, Space, Spin, Popover, Tag } from 'antd';
import {
  DeleteOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  WalletOutlined,
  BellOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNotificationStore, Notification } from '../../stores/notificationStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Text, Title } = Typography;

interface NotificationPopoverProps {
  children: React.ReactNode;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ children }) => {
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationStore();

  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconStyle = { fontSize: '20px' };

    if (priority === 'error') {
      return <WarningOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
    }
    if (priority === 'warning') {
      return <WarningOutlined style={{ ...iconStyle, color: '#faad14' }} />;
    }

    switch (type) {
      case 'sales':
        return <ShoppingCartOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'purchase':
        return <ShoppingOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'payment':
      case 'receipt':
        return <WalletOutlined style={{ ...iconStyle, color: '#722ed1' }} />;
      case 'system':
        return <BellOutlined style={{ ...iconStyle, color: '#13c2c2' }} />;
      default:
        return <InfoCircleOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
    }
  };

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'error':
        return <Tag color="red">긴급</Tag>;
      case 'warning':
        return <Tag color="orange">중요</Tag>;
      case 'success':
        return <Tag color="green">완료</Tag>;
      default:
        return null;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
  };

  const content = (
    <div style={{ width: '400px', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          알림
        </Title>
        <Space size="small">
          {notifications.length > 0 && (
            <>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
              >
                모두 읽음
              </Button>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={handleDeleteAll}
              >
                모두 삭제
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* 알림 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="알림이 없습니다"
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  cursor: notification.link ? 'pointer' : 'default',
                  backgroundColor: notification.isRead ? 'transparent' : '#f0f7ff',
                  transition: 'background-color 0.3s',
                  borderBottom: '1px solid #f0f0f0',
                }}
                onMouseEnter={(e) => {
                  if (notification.link) {
                    e.currentTarget.style.backgroundColor = '#e6f4ff';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.isRead
                    ? 'transparent'
                    : '#f0f7ff';
                }}
                onClick={() => handleNotificationClick(notification)}
                actions={[
                  <Button
                    key={`delete-${notification.id}`}
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type, notification.priority)}
                  title={
                    <Space>
                      <Text strong={!notification.isRead}>{notification.title}</Text>
                      {getPriorityTag(notification.priority)}
                      {!notification.isRead && (
                        <Tag color="blue" style={{ marginLeft: 'auto' }}>
                          NEW
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <>
                      <Text
                        type="secondary"
                        style={{
                          display: 'block',
                          marginBottom: '4px',
                          fontSize: '13px',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {notification.message}
                      </Text>
                      <Space size="small">
                        <ClockCircleOutlined style={{ fontSize: '12px' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(notification.createdAt).fromNow()}
                        </Text>
                      </Space>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      overlayStyle={{ padding: 0 }}
    >
      {children}
    </Popover>
  );
};

export default NotificationPopover;
