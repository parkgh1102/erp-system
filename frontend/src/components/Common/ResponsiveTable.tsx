import React, { useMemo } from 'react';
import { Table, Card, List, Space, Typography, Tag, Button, Dropdown, Skeleton } from 'antd';
import { MoreOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TableProps, ColumnsType } from 'antd/es/table';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import '../../styles/responsive-tables.css';

const { Text, Title } = Typography;

export interface ResponsiveColumn<T> {
  key: string;
  dataIndex?: string | string[];
  title: React.ReactNode;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  // Mobile-specific config
  mobileTitle?: string;
  mobilePrimary?: boolean; // Show as main title in card
  mobileSecondary?: boolean; // Show below title
  mobileHidden?: boolean; // Hide on mobile
  mobileBadge?: boolean; // Show as badge/tag
  priority?: number; // 1 = highest priority (always show), higher = lower priority
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sorter?: TableProps<T>['columns'] extends Array<infer U> ? U extends { sorter?: infer S } ? S : never : never;
  fixed?: 'left' | 'right' | boolean;
}

interface ResponsiveTableProps<T extends object> {
  columns: ResponsiveColumn<T>[];
  dataSource: T[];
  rowKey: string | ((record: T) => string);
  loading?: boolean;
  pagination?: TableProps<T>['pagination'];
  onRow?: TableProps<T>['onRow'];
  rowSelection?: TableProps<T>['rowSelection'];
  scroll?: TableProps<T>['scroll'];
  expandable?: TableProps<T>['expandable'];
  onChange?: TableProps<T>['onChange'];
  onView?: (record: T) => void;
  onEdit?: (record: T) => void;
  onDelete?: (record: T) => void;
  mobileActions?: (record: T) => React.ReactNode;
  cardTitle?: (record: T) => React.ReactNode;
  cardDescription?: (record: T) => React.ReactNode;
  cardExtra?: (record: T) => React.ReactNode;
  emptyText?: string;
  className?: string;
  size?: 'small' | 'middle' | 'large';
}

function ResponsiveTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  pagination,
  onRow,
  rowSelection,
  scroll,
  expandable,
  onChange,
  onView,
  onEdit,
  onDelete,
  mobileActions,
  cardTitle,
  cardDescription,
  cardExtra,
  emptyText = '데이터가 없습니다.',
  className = '',
  size = 'middle',
}: ResponsiveTableProps<T>) {
  const { isMobile, isTablet } = useMediaQuery();

  const getValue = (record: T, dataIndex?: string | string[]) => {
    if (!dataIndex) return undefined;
    if (Array.isArray(dataIndex)) {
      return dataIndex.reduce((obj: any, key) => obj?.[key], record);
    }
    return (record as any)[dataIndex];
  };

  // Get primary column for card title
  const primaryColumn = useMemo(() => {
    return columns.find(col => col.mobilePrimary) || columns[0];
  }, [columns]);

  // Get secondary columns for card
  const secondaryColumns = useMemo(() => {
    return columns.filter(col => col.mobileSecondary && !col.mobileHidden);
  }, [columns]);

  // Get badge columns
  const badgeColumns = useMemo(() => {
    return columns.filter(col => col.mobileBadge && !col.mobileHidden);
  }, [columns]);

  // Get detail columns for card body
  const detailColumns = useMemo(() => {
    return columns.filter(
      col => !col.mobilePrimary && !col.mobileSecondary && !col.mobileBadge && !col.mobileHidden
    ).slice(0, 4); // Show max 4 detail items
  }, [columns]);

  // Desktop columns
  const tableColumns: ColumnsType<T> = useMemo(() => {
    return columns
      .filter(col => {
        if (isTablet && col.priority && col.priority > 3) return false;
        return true;
      })
      .map(col => ({
        key: col.key,
        dataIndex: col.dataIndex,
        title: col.title,
        render: col.render,
        width: col.width,
        align: col.align,
        sorter: col.sorter as any,
        fixed: col.fixed,
      }));
  }, [columns, isTablet]);

  // Actions dropdown for mobile
  const getActionsDropdown = (record: T) => {
    if (mobileActions) {
      return mobileActions(record);
    }

    const items = [];
    if (onView) {
      items.push({
        key: 'view',
        icon: <EyeOutlined />,
        label: '보기',
        onClick: () => onView(record),
      });
    }
    if (onEdit) {
      items.push({
        key: 'edit',
        icon: <EditOutlined />,
        label: '수정',
        onClick: () => onEdit(record),
      });
    }
    if (onDelete) {
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '삭제',
        danger: true,
        onClick: () => onDelete(record),
      });
    }

    if (items.length === 0) return null;

    return (
      <Dropdown menu={{ items }} trigger={['click']}>
        <Button type="text" icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  // Render card for mobile
  const renderCard = (record: T, index: number) => {
    const key = typeof rowKey === 'function' ? rowKey(record) : (record as any)[rowKey];

    const title = cardTitle
      ? cardTitle(record)
      : primaryColumn.render
        ? primaryColumn.render(getValue(record, primaryColumn.dataIndex), record, index)
        : getValue(record, primaryColumn.dataIndex);

    const description = cardDescription
      ? cardDescription(record)
      : secondaryColumns.map((col, i) => {
          const value = col.render
            ? col.render(getValue(record, col.dataIndex), record, index)
            : getValue(record, col.dataIndex);
          return (
            <span key={col.key}>
              {i > 0 && ' | '}
              <Text type="secondary">{value}</Text>
            </span>
          );
        });

    const extra = cardExtra ? cardExtra(record) : getActionsDropdown(record);

    return (
      <Card
        key={key}
        className="responsive-card"
        size="small"
        style={{ marginBottom: 8 }}
      >
        <div className="responsive-card-header">
          <div className="responsive-card-title-section">
            <div className="responsive-card-title">
              <Text strong style={{ fontSize: 15 }}>{title}</Text>
            </div>
            {description && (
              <div className="responsive-card-description">
                {description}
              </div>
            )}
          </div>
          <div className="responsive-card-extra">
            {extra}
          </div>
        </div>

        {badgeColumns.length > 0 && (
          <div className="responsive-card-badges">
            <Space size={4} wrap>
              {badgeColumns.map(col => {
                const value = col.render
                  ? col.render(getValue(record, col.dataIndex), record, index)
                  : getValue(record, col.dataIndex);
                return <span key={col.key}>{value}</span>;
              })}
            </Space>
          </div>
        )}

        {detailColumns.length > 0 && (
          <div className="responsive-card-details">
            {detailColumns.map(col => {
              const value = col.render
                ? col.render(getValue(record, col.dataIndex), record, index)
                : getValue(record, col.dataIndex);
              return (
                <div key={col.key} className="responsive-card-detail-item">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {col.mobileTitle || col.title}
                  </Text>
                  <Text style={{ fontSize: 13 }}>{value}</Text>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  // Mobile view
  if (isMobile) {
    if (loading) {
      return (
        <div className="responsive-table-mobile">
          {[1, 2, 3].map(i => (
            <Card key={i} size="small" style={{ marginBottom: 8 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ))}
        </div>
      );
    }

    if (dataSource.length === 0) {
      return (
        <div className="responsive-table-empty">
          <Text type="secondary">{emptyText}</Text>
        </div>
      );
    }

    return (
      <div className={`responsive-table-mobile ${className}`}>
        {dataSource.map((record, index) => renderCard(record, index))}
        {pagination && (
          <div className="responsive-table-pagination">
            <Table
              columns={[]}
              dataSource={[]}
              pagination={pagination}
              onChange={onChange}
              showHeader={false}
              locale={{ emptyText: ' ' }}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop/Tablet view
  return (
    <Table<T>
      columns={tableColumns}
      dataSource={dataSource}
      rowKey={rowKey}
      loading={loading}
      pagination={pagination}
      onRow={onRow}
      rowSelection={rowSelection}
      scroll={scroll || { x: 'max-content' }}
      expandable={expandable}
      onChange={onChange}
      className={`responsive-table ${className}`}
      size={size}
      locale={{ emptyText }}
    />
  );
}

export default ResponsiveTable;
