import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onLimitChange?: (limit: number) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, onLimitChange }) => {
  const currentYear = dayjs().year();
  const lastYear = currentYear - 1;

  // 최근 N일
  const handleRecentDays = (days: number) => {
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');
    onDateRangeChange(startDate, endDate);
  };

  // 특정 월
  const handleMonth = (year: number, month: number) => {
    const startDate = dayjs(`${year}-${month}-01`).format('YYYY-MM-DD');
    const endDate = dayjs(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');
    onDateRangeChange(startDate, endDate);
  };

  // 분기
  const handleQuarter = (year: number, quarter: number) => {
    const startMonth = (quarter - 1) * 3 + 1;
    const startDate = dayjs(`${year}-${startMonth}-01`).format('YYYY-MM-DD');
    const endDate = dayjs(`${year}-${startMonth}-01`).add(2, 'month').endOf('month').format('YYYY-MM-DD');
    onDateRangeChange(startDate, endDate);
  };

  // 반기
  const handleHalf = (year: number, half: number) => {
    if (half === 1) {
      // 전반기 (1-6월)
      const startDate = dayjs(`${year}-01-01`).format('YYYY-MM-DD');
      const endDate = dayjs(`${year}-06-30`).format('YYYY-MM-DD');
      onDateRangeChange(startDate, endDate);
    } else {
      // 하반기 (7-12월)
      const startDate = dayjs(`${year}-07-01`).format('YYYY-MM-DD');
      const endDate = dayjs(`${year}-12-31`).format('YYYY-MM-DD');
      onDateRangeChange(startDate, endDate);
    }
  };

  // 연도
  const handleYear = (year: number) => {
    const startDate = dayjs(`${year}-01-01`).format('YYYY-MM-DD');
    const endDate = dayjs(`${year}-12-31`).format('YYYY-MM-DD');
    onDateRangeChange(startDate, endDate);
  };

  // 최근 N일 메뉴
  const recentDaysMenu: MenuProps = {
    items: [
      { key: '2', label: '최근 2일', onClick: () => handleRecentDays(2) },
      { key: '3', label: '최근 3일', onClick: () => handleRecentDays(3) },
      { key: '5', label: '최근 5일', onClick: () => handleRecentDays(5) },
      { key: '7', label: '최근 7일', onClick: () => handleRecentDays(7) },
      { key: '10', label: '최근 10일', onClick: () => handleRecentDays(10) },
      { key: '14', label: '최근 14일 (2주)', onClick: () => handleRecentDays(14) },
      { key: '21', label: '최근 21일 (3주)', onClick: () => handleRecentDays(21) },
    ],
  };

  // 최근 한달 메뉴
  const monthMenu: MenuProps = {
    items: [
      {
        key: 'last-year',
        type: 'group',
        label: `전년도 (${lastYear}년)`,
        children: Array.from({ length: 12 }, (_, i) => ({
          key: `last-${i + 1}`,
          label: `${lastYear}년 ${i + 1}월`,
          onClick: () => handleMonth(lastYear, i + 1),
        })),
      },
      {
        key: 'current-year',
        type: 'group',
        label: `이번년도 (${currentYear}년)`,
        children: Array.from({ length: 12 }, (_, i) => ({
          key: `current-${i + 1}`,
          label: `${currentYear}년 ${i + 1}월${i + 1 > dayjs().month() + 1 ? ' (이번달)' : ''}`,
          onClick: () => handleMonth(currentYear, i + 1),
          danger: i + 1 > dayjs().month() + 1,
        })),
      },
    ],
  };

  // 이번분기 메뉴
  const quarterMenu: MenuProps = {
    items: [
      {
        key: 'last-year-quarters',
        type: 'group',
        label: `전년도 분기 (${lastYear}년)`,
        children: [
          { key: 'last-q1', label: `${lastYear}년 1/4 분기`, onClick: () => handleQuarter(lastYear, 1) },
          { key: 'last-q2', label: `${lastYear}년 2/4 분기`, onClick: () => handleQuarter(lastYear, 2) },
          { key: 'last-q3', label: `${lastYear}년 3/4 분기`, onClick: () => handleQuarter(lastYear, 3) },
          { key: 'last-q4', label: `${lastYear}년 4/4 분기`, onClick: () => handleQuarter(lastYear, 4) },
        ],
      },
      {
        key: 'current-year-quarters',
        type: 'group',
        label: `이번년도 분기 (${currentYear}년)`,
        children: [
          { key: 'current-q1', label: `${currentYear}년 1/4 분기`, onClick: () => handleQuarter(currentYear, 1) },
          { key: 'current-q2', label: `${currentYear}년 2/4 분기`, onClick: () => handleQuarter(currentYear, 2) },
          { key: 'current-q3', label: `${currentYear}년 3/4 분기`, onClick: () => handleQuarter(currentYear, 3) },
          { key: 'current-q4', label: `${currentYear}년 4/4 분기 (이번분기)`, onClick: () => handleQuarter(currentYear, 4), danger: true },
        ],
      },
      { type: 'divider' },
      {
        key: 'half-years',
        type: 'group',
        label: '반기',
        children: [
          { key: 'last-h1', label: `${lastYear}년 전반기`, onClick: () => handleHalf(lastYear, 1) },
          { key: 'last-h2', label: `${lastYear}년 하반기`, onClick: () => handleHalf(lastYear, 2) },
          { key: 'current-h1', label: `${currentYear}년 전반기`, onClick: () => handleHalf(currentYear, 1) },
          { key: 'current-h2', label: `${currentYear}년 하반기 (이번반기)`, onClick: () => handleHalf(currentYear, 2), danger: true },
        ],
      },
    ],
  };

  // 이번년도 메뉴
  const yearMenu: MenuProps = {
    items: [
      { key: '2026', label: '2026년 (올해)', onClick: () => handleYear(2026), disabled: currentYear < 2026 },
      { key: '2025', label: '2025년 (올해)', onClick: () => handleYear(2025), danger: currentYear === 2025 },
      { key: '2024', label: '2024년', onClick: () => handleYear(2024) },
      { key: '2023', label: '2023년', onClick: () => handleYear(2023) },
      { key: '2022', label: '2022년', onClick: () => handleYear(2022) },
      { key: '2021', label: '2021년', onClick: () => handleYear(2021) },
      { key: '2020', label: '2020년', onClick: () => handleYear(2020) },
      { key: '2019', label: '2019년', onClick: () => handleYear(2019) },
      { key: '2018', label: '2018년', onClick: () => handleYear(2018) },
      { key: '2017', label: '2017년', onClick: () => handleYear(2017) },
      { key: '2016', label: '2016년', onClick: () => handleYear(2016) },
      { key: '2015', label: '2015년', onClick: () => handleYear(2015) },
    ],
  };

  // 최근자료 메뉴
  const limitMenu: MenuProps = {
    items: [
      { key: '100', label: '100개', onClick: () => onLimitChange?.(100) },
      { key: '300', label: '300개', onClick: () => onLimitChange?.(300) },
      { key: '500', label: '500개', onClick: () => onLimitChange?.(500) },
      { key: '1000', label: '1000개', onClick: () => onLimitChange?.(1000) },
      { key: '2000', label: '2000개', onClick: () => onLimitChange?.(2000) },
    ],
  };

  return (
    <Space size="small" wrap>
      <Dropdown menu={recentDaysMenu} trigger={['click']}>
        <Button size="small">
          최근7일 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown menu={monthMenu} trigger={['click']}>
        <Button size="small">
          최근 한달 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown menu={quarterMenu} trigger={['click']}>
        <Button size="small">
          이번분기 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown menu={yearMenu} trigger={['click']}>
        <Button size="small">
          이번년도 <DownOutlined />
        </Button>
      </Dropdown>

      {onLimitChange && (
        <Dropdown menu={limitMenu} trigger={['click']}>
          <Button size="small">
            최근자료 <DownOutlined />
          </Button>
        </Dropdown>
      )}
    </Space>
  );
};

export default DateRangeFilter;
