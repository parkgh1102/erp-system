import React, { useRef } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';

interface Product {
  id: number;
  productCode: string;
  name: string;
  spec?: string;
  unit?: string;
  buyPrice?: number;
  sellPrice?: number;
  category?: string;
  taxType: string;
  memo?: string;
  businessId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductPrintModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  title: string;
}

export const ProductPrintModal: React.FC<ProductPrintModalProps> = ({
  open,
  onClose,
  products,
  title
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: '품목 관리',
  });

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
            <div>총 {products.filter(p => p.isActive).length}건</div>
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
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>품목코드</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>품목명</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>규격</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>단위</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>매입단가</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>매출단가</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>분류</th>
              <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>세금구분</th>
            </tr>
          </thead>
          <tbody>
            {products.filter(p => p.isActive).map((product, index) => (
              <tr key={product.id} style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{product.productCode}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>{product.name}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{product.spec || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{product.unit || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {product.buyPrice ? product.buyPrice.toLocaleString() + '원' : '-'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                  {product.sellPrice ? product.sellPrice.toLocaleString() + '원' : '-'}
                </td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{product.category || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                  {product.taxType === 'tax_separate' ? '별도과세' :
                   product.taxType === 'tax_inclusive' ? '부가세포함' : '면세'}
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

export default ProductPrintModal;