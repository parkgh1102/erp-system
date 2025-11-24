import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

interface OTPInputProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export const OTPInput: React.FC<OTPInputProps> = ({ email, onVerified, onCancel }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60); // 1분
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState('');
  const [sendCount, setSendCount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 타이머
  useEffect(() => {
    if (timeLeft > 0 && !isExpired) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsExpired(true);
    }
  }, [timeLeft, isExpired]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // 숫자만 허용

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // 마지막 한 자리만
    setOtp(newOtp);

    // 다음 입력으로 자동 이동
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 6자리 모두 입력되면 자동 검증
    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
    setOtp(newOtp);

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleResend = async () => {
    try {
      setIsSending(true);
      setError('');

      const response = await api.post('/otp/send', { email });

      setOtp(['', '', '', '', '', '']);
      setTimeLeft(60);
      setIsExpired(false);
      setSendCount(response.data.sendCount);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP 재전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      setIsVerifying(true);
      setError('');

      const response = await api.post('/otp/verify', { email, code });

      if (response.data.verified) {
        onVerified();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP 검증에 실패했습니다.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">OTP 인증</h2>

        <p className="text-gray-600 mb-6 text-center">
          {email}로 전송된<br />
          6자리 인증번호를 입력해주세요
        </p>

        <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              disabled={isExpired || isVerifying}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
          ))}
        </div>

        <div className="text-center mb-4">
          {isExpired ? (
            <p className="text-red-600 font-medium">인증번호가 만료되었습니다</p>
          ) : (
            <p className="text-gray-600">
              남은 시간: <span className="font-bold text-blue-600">{formatTime(timeLeft)}</span>
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            전송 횟수: {sendCount}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleResend}
            disabled={!isExpired || isSending}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSending ? '전송 중...' : '재전송'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};
