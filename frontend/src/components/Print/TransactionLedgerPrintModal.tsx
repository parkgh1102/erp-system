import React, { useRef } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';

interface LedgerEntry {
  id: number;
  date: string;
  type: 'sales' | 'purchase' | 'receipt' | 'payment';
  description: string;
  customerName: string;
  amount: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  balance: number;
  memo?: string;
  itemInfo?: {
    itemCode: string;
    itemName: string;
    spec?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  };
  itemCount?: number;
}

interface Customer {
  id: number;
  name: string;
  customerCode: string;
  businessNumber?: string;
  representative?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface TransactionLedgerPrintModalProps {
  open: boolean;
  onClose: () => void;
  ledgerEntries: LedgerEntry[];
  customer?: Customer | null;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  title: string;
}

export const TransactionLedgerPrintModal: React.FC<TransactionLedgerPrintModalProps> = ({
  open,
  onClose,
  ledgerEntries,
  customer,
  dateRange,
  title
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: '거래원장',
  });

  // 집계 계산
  const totalSalesSupply = ledgerEntries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
  const totalSalesVat = ledgerEntries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
  const totalSalesAmount = ledgerEntries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const totalPurchaseSupply = ledgerEntries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
  const totalPurchaseVat = ledgerEntries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
  const totalPurchaseAmount = ledgerEntries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const totalReceiptAmount = ledgerEntries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const totalPaymentAmount = ledgerEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const finalBalance = totalSalesAmount - totalPurchaseAmount - totalReceiptAmount + totalPaymentAmount;

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
          fontFamily: 'Malgun Gothic, sans-serif',
          fontSize: '10pt',
          lineHeight: '1.4',
          color: '#000',
          padding: '20px',
          margin: '0',
          backgroundColor: '#fff'
        }}
      >
        {/* 제목 */}
        <div style={{
          fontSize: '24pt',
          fontWeight: 'bold',
          textAlign: 'left',
          marginBottom: '20px'
        }}>
          {title}
        </div>

        {/* 거래처 정보 */}
        {customer && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <strong>거래처명:</strong> {customer.name}
              </div>
              <div style={{ flex: 1 }}>
                <strong>거래처코드:</strong> {customer.customerCode}
              </div>
              <div style={{ flex: 1 }}>
                <strong>사업자번호:</strong> {customer.businessNumber || '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>대표자:</strong> {customer.representative || '미등록'}
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 2 }}>
                <strong>주소:</strong> {customer.address || '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>전화번호:</strong> {customer.phone || '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>이메일:</strong> {customer.email || '미등록'}
              </div>
            </div>
          </div>
        )}

        {/* 거래 내역 테이블 */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '10px',
          fontSize: '9pt',
          border: '1px solid #000'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>일자</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>거래처</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>구분</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>품목명</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>공급가액</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>세액</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>합계</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>잔액</th>
              <th style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>비고</th>
            </tr>
          </thead>
          <tbody>
            {/* 거래 내역 */}
            {ledgerEntries.map((entry, index) => {
              // 품목명 표시 로직
              const getItemDisplay = () => {
                if (entry.type === 'receipt' || entry.type === 'payment') {
                  return entry.description;
                }
                if (entry.itemCount && entry.itemCount > 1) {
                  const firstItem = entry.itemInfo?.itemName || entry.description;
                  return `${firstItem} 외 ${entry.itemCount - 1}`;
                }
                if (entry.itemInfo) {
                  return entry.itemInfo.itemName;
                }
                return entry.description;
              };

              return (
                <tr key={index}>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    {dayjs(entry.date).format('YYYY-MM-DD')}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    {entry.customerName || customer?.name}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center',
                    color: entry.type === 'sales' ? '#1890ff' : entry.type === 'purchase' ? '#000' : entry.type === 'receipt' ? '#52c41a' : '#fa8c16'
                  }}>
                    {entry.type === 'sales' ? '매출' : entry.type === 'purchase' ? '매입' : entry.type === 'receipt' ? '수금' : '지급'}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    {getItemDisplay()}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    color: entry.type === 'sales' ? '#1890ff' : entry.type === 'receipt' ? '#ff4d4f' : '#000'
                  }}>
                    {entry.supplyAmount ? `${entry.supplyAmount.toLocaleString()}원` : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right'
                  }}>
                    {entry.vatAmount ? `${entry.vatAmount.toLocaleString()}원` : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {entry.totalAmount ? `${entry.totalAmount.toLocaleString()}원` : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: entry.balance >= 0 ? '#1890ff' : '#ff4d4f'
                  }}>
                    {entry.balance.toLocaleString()}원
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center',
                    fontSize: '8pt'
                  }}>
                    {entry.memo || '-'}
                  </td>
                </tr>
              );
            })}

            {/* 합계 행 */}
            <tr style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
              <td colSpan={4} style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                합계
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center'
              }}>-</td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center'
              }}>-</td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center'
              }}>-</td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                color: finalBalance >= 0 ? '#1890ff' : '#ff4d4f'
              }}>
                {finalBalance.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center'
              }}>-</td>
            </tr>

            {/* 매출 합계 / 수금 합계 */}
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td colSpan={4} style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                매출 합계
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                color: '#1890ff',
                fontWeight: 'bold'
              }}>
                {totalSalesSupply.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                color: '#1890ff',
                fontWeight: 'bold'
              }}>
                {totalSalesVat.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                color: '#1890ff',
                fontWeight: 'bold'
              }}>
                {totalSalesAmount.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                수금 합계
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                color: '#ff4d4f',
                fontWeight: 'bold',
                fontSize: '10pt'
              }}>
                {totalReceiptAmount.toLocaleString()}원
              </td>
            </tr>

            {/* 매입 합계 / 지급 합계 */}
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td colSpan={4} style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                매입 합계
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {totalPurchaseSupply.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {totalPurchaseVat.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                {totalPurchaseAmount.toLocaleString()}원
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                지급 합계
              </td>
              <td style={{
                border: '1px solid #000',
                padding: '8px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '10pt'
              }}>
                {totalPaymentAmount.toLocaleString()}원
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default TransactionLedgerPrintModal;
