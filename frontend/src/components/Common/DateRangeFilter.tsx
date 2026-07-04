import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { DownOutlined, CalendarOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onLimitChange?: (limit: number) => void;
  isMobile?: boolean;
}

/**
 * 기간 선택 필터.
 * 기존에는 프리셋 6개 버튼(각각 드롭다운)이 나열되어 있었으나,
 * 단일 "기간 선택" 드롭다운 하나로 통합(자주 쓰는 프리셋은 최상위, 월/분기/반기/연도는 하위 메뉴).
 * 드롭다운 메뉴는 antd darkAlgorithm이 자동 테마 처리하므로 별도 다크모드 분기 불필요.
 */
const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, onLimitChange, isMobile = false }) => {
  const currentYear = dayjs().year();
  const lastYear = currentYear - 1;
  const currentMonth = dayjs().month() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // 최근 N일
  const handleRecentDays = (days: number) => {
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD');
    onDateRangeChange(startDate, endDate);
  };

  // 최근 N개월 (이번 달 포함, 월초~월말)
  const handleRecentMonths = (months: number) => {
    const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
    const startDate = dayjs().subtract(months - 1, 'month').startOf('month').format('YYYY-MM-DD');
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
      onDateRangeChange(dayjs(`${year}-01-01`).format('YYYY-MM-DD'), dayjs(`${year}-06-30`).format('YYYY-MM-DD'));
    } else {
      onDateRangeChange(dayjs(`${year}-07-01`).format('YYYY-MM-DD'), dayjs(`${year}-12-31`).format('YYYY-MM-DD'));
    }
  };

  // 연도
  const handleYear = (year: number) => {
    onDateRangeChange(dayjs(`${year}-01-01`).format('YYYY-MM-DD'), dayjs(`${year}-12-31`).format('YYYY-MM-DD'));
  };

  const monthItems = (year: number): MenuProps['items'] =>
    Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const isThisMonth = year === currentYear && m === currentMonth;
      return {
        key: `m-${year}-${m}`,
        label: `${m}월${isThisMonth ? ' (이번달)' : ''}`,
        danger: isThisMonth,
        onClick: () => handleMonth(year, m),
      };
    });

  const quarterItems = (year: number): MenuProps['items'] =>
    [1, 2, 3, 4].map((q) => {
      const isThisQuarter = year === currentYear && currentQuarter === q;
      return {
        key: `q-${year}-${q}`,
        label: `${q}/4 분기${isThisQuarter ? ' (이번분기)' : ''}`,
        danger: isThisQuarter,
        onClick: () => handleQuarter(year, q),
      };
    });

  const yearItems: MenuProps['items'] = [];
  for (let year = currentYear; year >= 2015; year--) {
    yearItems.push({
      key: `y-${year}`,
      label: `${year}년${year === currentYear ? ' (올해)' : year === lastYear ? ' (작년)' : ''}`,
      danger: year === currentYear,
      onClick: () => handleYear(year),
    });
  }

  // 통합 기간 메뉴
  const periodMenu: MenuProps = {
    items: [
      { key: 'r7', label: '최근 7일', onClick: () => handleRecentDays(7) },
      { key: 'r30', label: '최근 30일', onClick: () => handleRecentDays(30) },
      { key: 'r3m', label: '최근 3개월', onClick: () => handleRecentMonths(3) },
      { key: 'r6m', label: '최근 6개월', onClick: () => handleRecentMonths(6) },
      { type: 'divider' },
      {
        key: 'days',
        label: '일 단위 선택',
        children: [2, 3, 5, 7, 10, 14, 21].map((d) => ({
          key: `d-${d}`,
          label: `최근 ${d}일`,
          onClick: () => handleRecentDays(d),
        })),
      },
      {
        key: 'month',
        label: '월별 선택',
        children: [
          { type: 'group', label: `올해 (${currentYear}년)`, children: monthItems(currentYear) },
          { type: 'group', label: `작년 (${lastYear}년)`, children: monthItems(lastYear) },
        ],
      },
      {
        key: 'quarter',
        label: '분기별 선택',
        children: [
          { type: 'group', label: `올해 (${currentYear}년)`, children: quarterItems(currentYear) },
          { type: 'group', label: `작년 (${lastYear}년)`, children: quarterItems(lastYear) },
        ],
      },
      {
        key: 'half',
        label: '반기별 선택',
        children: [
          { key: `h-${currentYear}-1`, label: `${currentYear}년 전반기`, onClick: () => handleHalf(currentYear, 1) },
          {
            key: `h-${currentYear}-2`,
            label: `${currentYear}년 하반기${currentMonth >= 7 ? ' (이번반기)' : ''}`,
            danger: currentMonth >= 7,
            onClick: () => handleHalf(currentYear, 2),
          },
          { key: `h-${lastYear}-1`, label: `${lastYear}년 전반기`, onClick: () => handleHalf(lastYear, 1) },
          { key: `h-${lastYear}-2`, label: `${lastYear}년 하반기`, onClick: () => handleHalf(lastYear, 2) },
        ],
      },
      { key: 'year', label: '연도별 선택', children: yearItems },
    ],
  };

  // 최근자료(건수) 메뉴 — onLimitChange가 있을 때만 노출
  const limitMenu: MenuProps = {
    items: [100, 300, 500, 1000, 2000].map((n) => ({
      key: `limit-${n}`,
      label: `${n}개`,
      onClick: () => onLimitChange?.(n),
    })),
  };

  return (
    <Space size="small" wrap={!isMobile}>
      <Dropdown menu={periodMenu} trigger={['click']}>
        <Button size={isMobile ? 'small' : 'middle'} icon={<CalendarOutlined />}>
          기간 선택 <DownOutlined />
        </Button>
      </Dropdown>
      {onLimitChange && (
        <Dropdown menu={limitMenu} trigger={['click']}>
          <Button size={isMobile ? 'small' : 'middle'}>
            최근자료 <DownOutlined />
          </Button>
        </Dropdown>
      )}
    </Space>
  );
};

export default DateRangeFilter;
