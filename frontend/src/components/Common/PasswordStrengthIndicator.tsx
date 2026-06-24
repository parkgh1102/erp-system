import React from 'react';
import { Typography, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { PasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from '../../utils/passwordValidator';

const { Text } = Typography;

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: PasswordStrength;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  strength,
  showRequirements = true
}) => {
  if (!password) {
    return null;
  }

  const percentage = (strength.score / 4) * 100;
  const strengthText = getPasswordStrengthText(strength.score);
  const strengthColor = getPasswordStrengthColor(strength.score);

  return (
    <div style={{ marginTop: '8px' }}>
      {/* 비밀번호 강도 바 */}
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <Text style={{ fontSize: '14px', color: '#666' }}>비밀번호 강도</Text>
            <AnimatePresence mode="wait">
              <motion.span
                key={strengthText}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: '14px', fontWeight: 'bold', color: strengthColor }}
              >
                {strengthText}
              </motion.span>
            </AnimatePresence>
          </div>
          {/* 부드럽게 차오르는 강도 바 */}
          <div style={{ height: 8, borderRadius: 6, background: '#f0f0f0', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${percentage}%`, backgroundColor: strengthColor }}
              transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              style={{ height: '100%', borderRadius: 6 }}
            />
          </div>
        </div>

        {/* 피드백 메시지 */}
        {strength.feedback.length > 0 && (
          <div>
            {strength.feedback.map((feedback, index) => (
              <Text
                key={index}
                style={{
                  fontSize: '14px',
                  color: strength.isValid && index === 0 ? '#52c41a' : '#ff4d4f',
                  display: 'block',
                  marginBottom: '2px'
                }}
              >
                {feedback}
              </Text>
            ))}
          </div>
        )}

        {/* 요구사항 체크리스트 */}
        {showRequirements && (
          <div>
            <Divider style={{ margin: '8px 0 4px 0' }} />
            <Text style={{ fontSize: '14px', color: '#666', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
              비밀번호 요구사항
            </Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <RequirementItem
                text="8자 이상"
                met={strength.requirements.length}
              />
              <RequirementItem
                text="대문자 포함"
                met={strength.requirements.uppercase}
              />
              <RequirementItem
                text="소문자 포함"
                met={strength.requirements.lowercase}
              />
              <RequirementItem
                text="숫자 포함"
                met={strength.requirements.number}
              />
              <RequirementItem
                text="특수문자 포함"
                met={strength.requirements.special}
              />
              <RequirementItem
                text="안전한 패턴"
                met={strength.requirements.noCommon}
              />
            </div>
          </div>
        )}
      </Space>
    </div>
  );
};

interface RequirementItemProps {
  text: string;
  met: boolean;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ text, met }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
    <motion.span
      key={met ? 'met' : 'unmet'}
      animate={{ scale: met ? [1, 1.4, 1] : 1 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'inline-flex' }}
    >
      {met ? (
        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
      ) : (
        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />
      )}
    </motion.span>
    <Text style={{
      fontSize: '13px',
      color: met ? '#52c41a' : '#666',
      lineHeight: 1.3,
      fontWeight: met ? '500' : '400'
    }}>
      {text}
    </Text>
  </div>
);

export default PasswordStrengthIndicator;