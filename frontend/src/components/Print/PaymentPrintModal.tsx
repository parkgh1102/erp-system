import React, { useRef } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  managerContact?: string;
  businessType?: string;
  businessItem?: string;
  customerType: string;
  isActive: boolean;
  createdAt: string;
  memo?: string;
}

interface Payment {
  id: number;
  paymentDate: string;
  customerId: number;
  customer?: Customer;
  type: 'receipt' | 'payment';
  amount: number;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaymentPrintModalProps {
  open: boolean;
  onClose: () => void;
  payments: Payment[];
  title: string;
}

export const PaymentPrintModal: React.FC<PaymentPrintModalProps> = ({
  open,
  onClose,
  payments,
  title
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: '수금/지급 관리',
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Modal
      title="인쇄 미리보기"
      open={open}
      onCancel={onClose}
      width={1200}
      style={{ top: 20 }}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            style={{ marginRight: 8 }}
          >
            인쇄
          </Button>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div
        ref={printRef}
        style={{
          backgroundColor: 'white',
          padding: '20px',
          fontSize: '12px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#333' }}>
            {title}
          </h1>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div>출력일시: {new Date().toLocaleString('ko-KR')}</div>
            <div>총 {payments.length}건 / 합계: {totalAmount.toLocaleString()}원</div>
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          textAlign: 'center',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          border: '1px solid #ddd'
        }}>
          <strong>회사명:</strong> 가온에프에스유한회사 |
          <strong>사업자번호:</strong> 818-87-01513 |
          <strong>연락처:</strong> 031-527-3564 |
          <strong>이메일:</strong> business@gaonfscorp.com
        </div>

        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          border: '1px solid #000',
          fontSize: '10px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>결제일</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>거래처명</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>유형</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>금액</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {payments.filter(p => p.isActive).map((payment, index) => (
              <tr key={payment.id} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {dayjs(payment.paymentDate).format('YYYY-MM-DD')}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                  {payment.customer?.name || '-'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {payment.type === 'receipt' ? '수금' : '지급'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {payment.amount.toLocaleString()}원
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                  {payment.memo || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #ccc',
          fontSize: '10px',
          color: '#666',
          textAlign: 'center'
        }}>
          <p>본 문서는 ERP 시스템에서 자동 생성되었습니다.</p>
          <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentPrintModal;