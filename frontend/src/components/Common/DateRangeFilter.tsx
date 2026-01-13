import React from 'react';
import { Button, Dropdown, Space, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  onLimitChange?: (limit: number) => void;
  isMobile?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, onLimitChange, isMobile = false }) => {
  const currentYear = dayjs().year();
  const lastYear = currentYear - 1;
  const currentMonth = dayjs().month() + 1;

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

  // 최근 한달 메뉴 - 2열 그리드 레이아웃
  const monthMenuContent = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0',
      minWidth: '400px',
      backgroundColor: '#fff',
      border: '1px solid #d9d9d9',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      {/* 전년도 */}
      <div style={{ padding: '8px', borderRight: '1px solid #f0f0f0' }}>
        <div style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#666',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '4px'
        }}>
          전년도 ({lastYear}년)
        </div>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`last-${i + 1}`}
            onClick={() => handleMonth(lastYear, i + 1)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
              borderRadius: '4px',
              margin: '2px 4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {lastYear}년 {i + 1}월
          </div>
        ))}
      </div>

      {/* 이번년도 */}
      <div style={{ padding: '8px' }}>
        <div style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#1890ff',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '4px'
        }}>
          이번년도 ({currentYear}년)
        </div>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`current-${i + 1}`}
            onClick={() => handleMonth(currentYear, i + 1)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
              borderRadius: '4px',
              margin: '2px 4px',
              color: i + 1 === currentMonth ? '#ff4d4f' : 'inherit',
              fontWeight: i + 1 === currentMonth ? 'bold' : 'normal'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e6f7ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {currentYear}년 {i + 1}월{i + 1 === currentMonth ? ' (이번달)' : ''}
          </div>
        ))}
      </div>
    </div>
  );

  // 이번분기 메뉴 - 세로 레이아웃
  const quarterMenuContent = (
    <div style={{
      minWidth: '280px',
      backgroundColor: '#fff',
      border: '1px solid #d9d9d9',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      padding: '8px'
    }}>
      {/* 전년도 분기 */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#666',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '4px'
        }}>
          전년도 분기 ({lastYear}년)
        </div>
        {[1, 2, 3, 4].map((q) => (
          <div
            key={`last-q${q}`}
            onClick={() => handleQuarter(lastYear, q)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
              borderRadius: '4px',
              margin: '2px 4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {lastYear}년 {q}/4 분기
          </div>
        ))}
      </div>

      {/* 이번년도 분기 */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#1890ff',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '4px'
        }}>
          이번년도 분기 ({currentYear}년)
        </div>
        {[1, 2, 3, 4].map((q) => {
          const isCurrentQuarter = Math.ceil(currentMonth / 3) === q;
          return (
            <div
              key={`current-q${q}`}
              onClick={() => handleQuarter(currentYear, q)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
                borderRadius: '4px',
                margin: '2px 4px',
                color: isCurrentQuarter ? '#ff4d4f' : 'inherit',
                fontWeight: isCurrentQuarter ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e6f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {currentYear}년 {q}/4 분기{isCurrentQuarter ? ' (이번분기)' : ''}
            </div>
          );
        })}
      </div>

      {/* 구분선 */}
      <div style={{ borderTop: '1px solid #f0f0f0', margin: '8px 0' }} />

      {/* 반기 */}
      <div>
        <div style={{
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: '13px',
          color: '#666',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '4px'
        }}>
          반기
        </div>
        <div
          onClick={() => handleHalf(lastYear, 1)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            borderRadius: '4px',
            margin: '2px 4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {lastYear}년 전반기
        </div>
        <div
          onClick={() => handleHalf(lastYear, 2)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            borderRadius: '4px',
            margin: '2px 4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {lastYear}년 하반기
        </div>
        <div
          onClick={() => handleHalf(currentYear, 1)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            borderRadius: '4px',
            margin: '2px 4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e6f7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {currentYear}년 전반기
        </div>
        <div
          onClick={() => handleHalf(currentYear, 2)}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '13px',
            transition: 'all 0.2s',
            borderRadius: '4px',
            margin: '2px 4px',
            color: currentMonth >= 7 ? '#ff4d4f' : 'inherit',
            fontWeight: currentMonth >= 7 ? 'bold' : 'normal'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e6f7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {currentYear}년 하반기{currentMonth >= 7 ? ' (이번반기)' : ''}
        </div>
      </div>
    </div>
  );

  // 이번년도 메뉴 - 동적으로 생성
  const yearMenuItems = [];
  for (let year = currentYear; year >= 2015; year--) {
    const isCurrentYear = year === currentYear;
    const isLastYear = year === lastYear;
    yearMenuItems.push({
      key: String(year),
      label: `${year}년${isCurrentYear ? ' (올해)' : isLastYear ? ' (작년)' : ''}`,
      onClick: () => handleYear(year),
      danger: isCurrentYear,
    });
  }
  const yearMenu: MenuProps = { items: yearMenuItems };

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

  // 모바일 버튼 스타일
  const mobileButtonStyle: React.CSSProperties = isMobile
    ? { padding: '0 10px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }
    : {};

  const content = (
    <Space size="small" wrap={!isMobile} style={isMobile ? { flexWrap: 'nowrap' } : undefined}>
      <Dropdown menu={recentDaysMenu} trigger={['click']}>
        <Button size={isMobile ? 'small' : 'middle'} style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', color: 'white', ...mobileButtonStyle }}>
          최근7일 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown popupRender={() => monthMenuContent} trigger={['click']}>
        <Button size={isMobile ? 'small' : 'middle'} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white', ...mobileButtonStyle }}>
          최근 한달 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown popupRender={() => quarterMenuContent} trigger={['click']}>
        <Button size={isMobile ? 'small' : 'middle'} style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16', color: 'white', ...mobileButtonStyle }}>
          이번분기 <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown menu={yearMenu} trigger={['click']}>
        <Button size={isMobile ? 'small' : 'middle'} style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: 'white', ...mobileButtonStyle }}>
          이번년도 <DownOutlined />
        </Button>
      </Dropdown>

      <Button
        size={isMobile ? 'small' : 'middle'}
        style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: 'white', ...mobileButtonStyle }}
        onClick={() => {
          const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
          const startDate = dayjs().subtract(2, 'month').startOf('month').format('YYYY-MM-DD');
          onDateRangeChange(startDate, endDate);
        }}
      >
        최근 3달
      </Button>

      <Button
        size={isMobile ? 'small' : 'middle'}
        style={{ backgroundColor: '#eb2f96', borderColor: '#eb2f96', color: 'white', ...mobileButtonStyle }}
        onClick={() => {
          const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
          const startDate = dayjs().subtract(5, 'month').startOf('month').format('YYYY-MM-DD');
          onDateRangeChange(startDate, endDate);
        }}
      >
        최근 6달
      </Button>

      {onLimitChange && (
        <Dropdown menu={limitMenu} trigger={['click']}>
          <Button size={isMobile ? 'small' : 'middle'} style={{ backgroundColor: '#595959', borderColor: '#595959', color: 'white', ...mobileButtonStyle }}>
            최근자료 <DownOutlined />
          </Button>
        </Dropdown>
      )}
    </Space>
  );

  // 모바일: 가로 스크롤 컨테이너
  if (isMobile) {
    return (
      <div style={{
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        margin: '0 -8px',
        padding: '4px 8px'
      }}>
        <style>{`.date-range-filter-mobile::-webkit-scrollbar { display: none; }`}</style>
        <div className="date-range-filter-mobile" style={{ display: 'inline-flex', gap: '6px' }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default DateRangeFilter;
