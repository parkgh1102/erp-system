import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Space, message } from 'antd';
import { ClearOutlined, CheckOutlined } from '@ant-design/icons';

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onClose,
  onConfirm
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open]);

  // 좌표 계산 헬퍼 함수
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      // 터치 이벤트
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // 마우스 이벤트
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasSignature) {
      message.warning('서명을 입력해주세요');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    onConfirm(signatureDataUrl);
    clearSignature();
  };

  const handleClose = () => {
    clearSignature();
    onClose();
  };

  return (
    <Modal
      title="전자서명"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: '#666' }}>
          아래 영역에 마우스 또는 터치로 서명을 입력하세요
        </p>
        <canvas
          ref={canvasRef}
          width={540}
          height={200}
          style={{
            border: '2px solid #d9d9d9',
            borderRadius: '4px',
            cursor: 'crosshair',
            backgroundColor: '#fff',
            touchAction: 'none',
            maxWidth: '100%'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
        <div style={{ marginTop: 16 }}>
          <Space>
            <Button
              icon={<ClearOutlined />}
              onClick={clearSignature}
            >
              지우기
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleConfirm}
            >
              확인
            </Button>
            <Button onClick={handleClose}>
              취소
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default SignatureModal;
