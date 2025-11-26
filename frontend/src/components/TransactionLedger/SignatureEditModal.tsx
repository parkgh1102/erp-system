import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Input, Form, Space, Row, Col, Upload, message, Tabs } from 'antd';
import { SaveOutlined, ClearOutlined, UploadOutlined } from '@ant-design/icons';

interface SignatureEditModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (signatureData: SignatureData) => void;
  initialData?: SignatureData;
}

interface SignatureData {
  name: string;
  position: string;
  phone: string;
  email: string;
  signatureType: 'text' | 'image' | 'handwritten';
  signatureData: string;
}

const SignatureEditModal: React.FC<SignatureEditModalProps> = ({
  open,
  onCancel,
  onSave,
  initialData
}) => {
  const [form] = Form.useForm();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'text' | 'image' | 'handwritten'>('text');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });
  const [hasDrawn, setHasDrawn] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 캔버스 크기 조정
  const updateCanvasSize = useCallback(() => {
    if (!canvasContainerRef.current) return;
    const containerWidth = canvasContainerRef.current.clientWidth - 16;
    const width = Math.min(400, containerWidth);
    const height = isMobile ? Math.min(250, window.innerHeight * 0.3) : 200;
    setCanvasSize({ width, height });
  }, [isMobile]);

  useEffect(() => {
    if (open && signatureType === 'handwritten') {
      setTimeout(updateCanvasSize, 100);
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }
  }, [open, signatureType, updateCanvasSize]);

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      setSignatureType(initialData.signatureType);
      if (initialData.signatureType === 'image') {
        setImageUrl(initialData.signatureData);
      } else if (initialData.signatureType === 'handwritten') {
        loadCanvasSignature(initialData.signatureData);
      }
    }
  }, [initialData, form]);

  const loadCanvasSignature = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (canvas && dataUrl) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = dataUrl;
    }
  };

  // 좌표 계산 헬퍼 함수
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const handleCanvasStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'handwritten') return;
    e.preventDefault();
    e.stopPropagation();

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    }
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureType !== 'handwritten') return;
    e.preventDefault();
    e.stopPropagation();

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasDrawn(true);
      }
    }
  };

  const handleCanvasEnd = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done' || info.file.originFileObj) {
      const file = info.file.originFileObj || info.file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let signatureData = '';

      switch (signatureType) {
        case 'text':
          signatureData = values.name;
          break;
        case 'image':
          signatureData = imageUrl;
          break;
        case 'handwritten':
          const canvas = canvasRef.current;
          if (canvas) {
            signatureData = canvas.toDataURL();
          }
          break;
      }

      onSave({
        ...values,
        signatureType,
        signatureData
      });

      message.success('전자서명이 저장되었습니다.');
    } catch (error) {
      message.error('입력 정보를 확인해주세요.');
    }
  };

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && signatureType === 'handwritten') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = isMobile ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureType, canvasSize, isMobile]);

  const tabItems = [
    {
      key: 'text',
      label: isMobile ? '텍스트' : '텍스트 서명',
      children: (
        <div style={{ padding: isMobile ? '12px' : '20px' }}>
          <Form.Item
            label="서명으로 사용할 이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input
              placeholder="홍길동"
              style={{ fontSize: isMobile ? '16px' : '18px', textAlign: 'center' }}
            />
          </Form.Item>
          <div style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '6px',
            padding: isMobile ? '12px' : '20px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            minHeight: isMobile ? '60px' : '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '24px' : '32px',
              fontFamily: 'serif',
              color: '#1890ff',
              fontWeight: 'bold'
            }}>
              {form.getFieldValue('name') || '미리보기'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'image',
      label: isMobile ? '이미지' : '이미지 서명',
      children: (
        <div style={{ padding: isMobile ? '12px' : '20px' }}>
          <Upload
            name="signature"
            listType="picture-card"
            className="signature-uploader"
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleImageUpload}
            accept="image/*"
          >
            {imageUrl ? (
              <img src={imageUrl} alt="signature" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div>
                <UploadOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>{isMobile ? '업로드' : '서명 이미지 업로드'}</div>
              </div>
            )}
          </Upload>
          <p style={{ marginTop: '12px', color: '#666', fontSize: '12px' }}>
            PNG, JPG 형식의 투명 배경 이미지를 권장합니다.
          </p>
        </div>
      )
    },
    {
      key: 'handwritten',
      label: isMobile ? '손글씨' : '손글씨 서명',
      children: (
        <div style={{ padding: isMobile ? '12px' : '20px' }}>
          <div
            ref={canvasContainerRef}
            style={{
              marginBottom: '12px',
              textAlign: 'center',
              position: 'relative',
              width: '100%'
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                border: '2px solid #1890ff',
                borderRadius: '8px',
                cursor: 'crosshair',
                backgroundColor: 'white',
                touchAction: 'none',
                width: '100%',
                height: 'auto',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseDown={handleCanvasStart}
              onMouseMove={handleCanvasMove}
              onMouseUp={handleCanvasEnd}
              onMouseLeave={handleCanvasEnd}
              onTouchStart={handleCanvasStart}
              onTouchMove={handleCanvasMove}
              onTouchEnd={handleCanvasEnd}
              onTouchCancel={handleCanvasEnd}
            />

            {/* 서명 안내 워터마크 */}
            {!hasDrawn && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: '#d9d9d9',
                fontSize: isMobile ? 14 : 18,
                pointerEvents: 'none',
                userSelect: 'none'
              }}>
                여기에 서명하세요
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={clearCanvas}
              size={isMobile ? 'large' : 'middle'}
            >
              지우기
            </Button>
          </div>
          <p style={{
            marginTop: '12px',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            {isMobile ? '손가락으로 서명을 그려주세요' : '마우스 또는 터치로 서명을 그려주세요'}
          </p>
        </div>
      )
    }
  ];

  return (
    <Modal
      title="전자서명 편집"
      open={open}
      onCancel={onCancel}
      width={isMobile ? '95vw' : 600}
      style={isMobile ? { top: 20, maxWidth: '100%' } : undefined}
      styles={{
        body: { padding: isMobile ? 12 : 24 }
      }}
      centered={isMobile}
      footer={
        isMobile ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              onClick={onCancel}
              size="large"
              style={{ flex: 1 }}
            >
              취소
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              size="large"
              style={{ flex: 1 }}
            >
              저장
            </Button>
          </div>
        ) : [
          <Button key="cancel" onClick={onCancel}>
            취소
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            저장
          </Button>
        ]
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '김철수',
          position: '대표이사',
          phone: '02-1234-5678',
          email: 'kim@company.com',
          signatureType: 'text'
        }}
      >
        <Row gutter={isMobile ? 8 : 16}>
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              label="이름"
              name="name"
              rules={[{ required: true, message: '이름을 입력해주세요' }]}
            >
              <Input placeholder="김철수" size={isMobile ? 'large' : 'middle'} />
            </Form.Item>
          </Col>
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              label="직급/직책"
              name="position"
            >
              <Input placeholder="대표이사" size={isMobile ? 'large' : 'middle'} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={isMobile ? 8 : 16}>
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              label="연락처"
              name="phone"
            >
              <Input placeholder="02-1234-5678" size={isMobile ? 'large' : 'middle'} />
            </Form.Item>
          </Col>
          <Col span={isMobile ? 24 : 12}>
            <Form.Item
              label="이메일"
              name="email"
              rules={[{ type: 'email', message: '올바른 이메일 형식이 아닙니다' }]}
            >
              <Input placeholder="kim@company.com" size={isMobile ? 'large' : 'middle'} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="서명 방식">
          <Tabs
            activeKey={signatureType}
            onChange={(key) => setSignatureType(key as any)}
            items={tabItems}
            size={isMobile ? 'small' : 'middle'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SignatureEditModal;
