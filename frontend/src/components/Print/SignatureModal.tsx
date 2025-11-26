import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal, Button, Space, message } from 'antd';
import { ClearOutlined, CheckOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 540, height: 200 });

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 'ontouchstart' in window;
      setIsMobile(mobile);
      if (mobile) {
        setIsFullscreen(true); // 모바일에서 자동 전체화면
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 캔버스 크기 조정
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 32; // padding 고려

    if (isFullscreen || isMobile) {
      const width = Math.min(containerWidth, window.innerWidth - 48);
      const height = Math.min(300, window.innerHeight * 0.4);
      setCanvasSize({ width, height });
    } else {
      setCanvasSize({ width: Math.min(540, containerWidth), height: 200 });
    }
  }, [isFullscreen, isMobile]);

  useEffect(() => {
    if (open) {
      setTimeout(updateCanvasSize, 100);
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, [open, updateCanvasSize]);

  // 캔버스 초기화
  useEffect(() => {
    if (open && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = isMobile ? 3 : 2; // 모바일에서 더 굵은 선
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [open, canvasSize, isMobile]);

  // 좌표 계산 헬퍼 함수
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

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
    e.stopPropagation();

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
    setIsFullscreen(false);
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
          <span>전자서명</span>
          {!isMobile && (
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              size="small"
            />
          )}
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      width={isFullscreen ? '95vw' : 600}
      style={isFullscreen ? { top: 20, maxWidth: '100%' } : undefined}
      styles={{
        body: { padding: isMobile ? 12 : 24 }
      }}
      maskClosable={false}
      centered={isMobile}
    >
      <div ref={containerRef} style={{ textAlign: 'center' }}>
        <p style={{
          marginBottom: isMobile ? 8 : 16,
          color: '#666',
          fontSize: isMobile ? 13 : 14
        }}>
          {isMobile ? '아래 영역에 손가락으로 서명하세요' : '아래 영역에 마우스 또는 터치로 서명을 입력하세요'}
        </p>

        <div style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
          maxWidth: canvasSize.width
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              border: '2px solid #1890ff',
              borderRadius: 8,
              cursor: 'crosshair',
              backgroundColor: '#fff',
              touchAction: 'none',
              width: '100%',
              height: 'auto',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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

          {/* 서명 안내 워터마크 */}
          {!hasSignature && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#d9d9d9',
              fontSize: isMobile ? 16 : 20,
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              여기에 서명하세요
            </div>
          )}
        </div>

        <div style={{
          marginTop: isMobile ? 12 : 16,
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? 8 : 12,
          flexWrap: 'wrap'
        }}>
          {isMobile ? (
            // 모바일 버튼 레이아웃
            <>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={clearSignature}
                style={{ flex: 1, maxWidth: 120 }}
              >
                지우기
              </Button>
              <Button
                size="large"
                onClick={handleClose}
                style={{ flex: 1, maxWidth: 120 }}
              >
                취소
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                onClick={handleConfirm}
                style={{ flex: 1, maxWidth: 120 }}
              >
                확인
              </Button>
            </>
          ) : (
            // PC 버튼 레이아웃
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
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SignatureModal;
