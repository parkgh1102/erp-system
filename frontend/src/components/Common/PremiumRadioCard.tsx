import React from 'react';

export interface PremiumRadioOption {
  value: string | number;
  /** 카드 제목 (굵게) */
  label: React.ReactNode;
  /** 카드 부제/설명 (한 줄) */
  description?: React.ReactNode;
  /** 좌측 아이콘 (선택) */
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface PremiumRadioCardProps {
  options: PremiumRadioOption[];
  /** antd Form.Item이 주입 */
  value?: string | number;
  /** antd Form.Item이 주입 */
  onChange?: (value: string | number) => void;
  /** 그리드 열 수 (기본 2) */
  columns?: number;
  /** 세로 정렬 (한 줄에 하나씩) */
  vertical?: boolean;
}

/**
 * 카드형 라디오 버튼 (인스타 "Premium Radio Button" 스타일).
 * 각 옵션이 아이콘 + 제목 + 설명을 가진 카드로 렌더되고, 선택 시 파랑 강조.
 * antd Form.Item의 value/onChange 주입 규약을 그대로 따르므로
 * <Form.Item name="type"><PremiumRadioCard options={...} /></Form.Item> 형태로 사용.
 * 스타일은 styles/effects.css의 .erp-radio-card 계열 참조.
 */
const PremiumRadioCard: React.FC<PremiumRadioCardProps> = ({
  options,
  value,
  onChange,
  columns = 2,
  vertical = false,
}) => {
  return (
    <div
      className="erp-radio-cards"
      role="radiogroup"
      style={
        vertical
          ? { display: 'flex', flexDirection: 'column', gap: 10 }
          : {
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: 10,
            }
      }
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            className={[
              'erp-radio-card',
              selected ? 'erp-radio-card-selected' : '',
              opt.disabled ? 'erp-radio-card-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              if (opt.disabled) return;
              onChange?.(opt.value);
            }}
          >
            <span className="erp-radio-dot" aria-hidden="true" />
            {opt.icon != null && (
              <span className="erp-radio-icon" aria-hidden="true">
                {opt.icon}
              </span>
            )}
            <span className="erp-radio-body">
              <span className="erp-radio-title">{opt.label}</span>
              {opt.description != null && (
                <span className="erp-radio-desc">{opt.description}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PremiumRadioCard;
