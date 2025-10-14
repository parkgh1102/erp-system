import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Space,
  message,
  Spin
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { businessAPI } from '../../utils/api';
import type { Business } from '../../types/business';

interface BusinessFormProps {
  initialValues?: Business | null;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
}

export const BusinessForm: React.FC<BusinessFormProps> = ({
  initialValues,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [businessNumberValidation, setBusinessNumberValidation] = useState<{
    status: 'validating' | 'success' | 'error' | '';
    message: string;
  }>({ status: '', message: '' });

  const validateBusinessNumber = async (businessNumber: string) => {
    if (!businessNumber || businessNumber === initialValues?.businessNumber) {
      setBusinessNumberValidation({ status: '', message: '' });
      return;
    }

    // 형식 검증
    const businessNumberPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/;
    if (!businessNumberPattern.test(businessNumber)) {
      setBusinessNumberValidation({
        status: 'error',
        message: '올바른 사업자번호 형식이 아닙니다. (예: 123-45-67890)'
      });
      return;
    }

    setBusinessNumberValidation({ status: 'validating', message: '확인 중...' });

    try {
      const response = await businessAPI.validateBusinessNumber(businessNumber);
      if (response.isValid) {
        setBusinessNumberValidation({
          status: 'success',
          message: '사용 가능한 사업자번호입니다.'
        });
      } else {
        setBusinessNumberValidation({
          status: 'error',
          message: '이미 등록된 사업자번호입니다.'
        });
      }
    } catch (error) {
      setBusinessNumberValidation({
        status: 'error',
        message: '사업자번호 확인 중 오류가 발생했습니다.'
      });
    }
  };

  const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9-]/g, '');
    form.setFieldsValue({ businessNumber: value });

    // 디바운스를 위한 타이머
    setTimeout(() => {
      validateBusinessNumber(value);
    }, 500);
  };

  const handleSubmit = async (values: any) => {
    if (businessNumberValidation.status === 'error') {
      message.error('사업자번호를 확인해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues || {}}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="사업자번호"
              name="businessNumber"
              rules={[
                { required: true, message: '사업자번호를 입력해주세요.' },
                {
                  pattern: /^[0-9]{3}-[0-9]{2}-[0-9]{5}$/,
                  message: '올바른 사업자번호 형식이 아닙니다.'
                }
              ]}
              hasFeedback
              validateStatus={businessNumberValidation.status}
              help={businessNumberValidation.message}
            >
              <Input
                placeholder="예: 123-45-67890"
                maxLength={12}
                onChange={handleBusinessNumberChange}
                suffix={
                  businessNumberValidation.status === 'success' ? (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  ) : businessNumberValidation.status === 'error' ? (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  ) : null
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="상호명"
              name="companyName"
              rules={[
                { required: true, message: '상호명을 입력해주세요.' },
                { max: 200, message: '상호명은 200자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="회사명을 입력하세요" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="대표자명"
              name="representative"
              rules={[
                { required: true, message: '대표자명을 입력해주세요.' },
                { max: 100, message: '대표자명은 100자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="대표자명을 입력하세요" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="업태"
              name="businessType"
              rules={[
                { max: 100, message: '업태는 100자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="예: 제조업, 서비스업" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="종목"
              name="businessItem"
              rules={[
                { max: 100, message: '종목은 100자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="예: 소프트웨어 개발" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="전화번호"
              name="phone"
              rules={[
                { max: 20, message: '전화번호는 20자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="예: 02-1234-5678" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="팩스번호"
              name="fax"
              rules={[
                { max: 20, message: '팩스번호는 20자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="예: 02-1234-5679" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="이메일"
              name="email"
              rules={[
                { type: 'email', message: '올바른 이메일 형식이 아닙니다.' },
                { max: 100, message: '이메일은 100자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="example@company.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="홈페이지"
              name="homepage"
              rules={[
                { type: 'url', message: '올바른 URL 형식이 아닙니다.' },
                { max: 200, message: '홈페이지 URL은 200자 이내로 입력해주세요.' }
              ]}
            >
              <Input placeholder="https://www.company.com" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="주소"
          name="address"
          rules={[
            { max: 500, message: '주소는 500자 이내로 입력해주세요.' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="회사 주소를 입력하세요"
          />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>
              취소
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={businessNumberValidation.status === 'error'}
            >
              {initialValues ? '수정' : '등록'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Spin>
  );
};