import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Input, Form, Space, Row, Col, Upload, message, Tabs } from 'antd';
import { SaveOutlined, ClearOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons';

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
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureType, setSignatureType] = useState<'text' | 'image' | 'handwritten'>('text');
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue(initialData);
      setSignatureType(initialData.signatureType);
      if (initialData.signatureType === 'image') {
        setImageUrl(initialData.signatureData);
      } else if (initialData.signatureType === 'handwritten') {
        // 캔버스에 기존 서명 로드
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
      };
      img.src = dataUrl;
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'handwritten') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || signatureType !== 'handwritten') return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  const tabItems = [
    {
      key: 'text',
      label: '텍스트 서명',
      children: (
        <div style={{ padding: '20px' }}>
          <Form.Item
            label="서명으로 사용할 이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input
              placeholder="홍길동"
              style={{ fontSize: '18px', textAlign: 'center' }}
            />
          </Form.Item>
          <div style={{
            border: '2px dashed #d9d9d9',
            borderRadius: '6px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              fontSize: '32px',
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
      label: '이미지 서명',
      children: (
        <div style={{ padding: '20px' }}>
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
                <div>서명 이미지 업로드</div>
              </div>
            )}
          </Upload>
          <p style={{ marginTop: '16px', color: '#666', fontSize: '12px' }}>
            PNG, JPG 형식의 투명 배경 이미지를 권장합니다.
          </p>
        </div>
      )
    },
    {
      key: 'handwritten',
      label: '손글씨 서명',
      children: (
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <canvas
              ref={canvasRef}
              width={400}
              height={200}
              style={{
                border: '2px solid #d9d9d9',
                borderRadius: '6px',
                cursor: 'crosshair',
                backgroundColor: 'white'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <Button
              icon={<ClearOutlined />}
              onClick={clearCanvas}
            >
              지우기
            </Button>
          </div>
          <p style={{ marginTop: '16px', color: '#666', fontSize: '12px', textAlign: 'center' }}>
            마우스를 드래그하여 서명을 그려주세요.
          </p>
        </div>
      )
    }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && signatureType === 'handwritten') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureType]);

  return (
    <Modal
      title="전자서명 편집"
      open={open}
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          취소
        </Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          저장
        </Button>
      ]}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="이름"
              name="name"
              rules={[{ required: true, message: '이름을 입력해주세요' }]}
            >
              <Input placeholder="김철수" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="직급/직책"
              name="position"
            >
              <Input placeholder="대표이사" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="연락처"
              name="phone"
            >
              <Input placeholder="02-1234-5678" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="이메일"
              name="email"
              rules={[{ type: 'email', message: '올바른 이메일 형식이 아닙니다' }]}
            >
              <Input placeholder="kim@company.com" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="서명 방식">
          <Tabs
            activeKey={signatureType}
            onChange={(key) => setSignatureType(key as any)}
            items={tabItems}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SignatureEditModal;