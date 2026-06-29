import React, { useRef } from 'react';
import { Modal, Button } from 'antd';
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';

interface LedgerItemInfo {
  itemCode: string;
  itemName: string;
  spec?: string;
  quantity: number;
  unitPrice: number;
  amount: number;  // 공급가액
  taxAmount?: number;  // 세액
  totalAmount?: number;  // 합계
}

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
  itemInfo?: LedgerItemInfo;
  itemCount?: number;
  items?: LedgerItemInfo[];
}

interface ExpandedLedgerEntry extends LedgerEntry {
  rowKey: string;
  isFirstRow: boolean;
  itemIndex: number;
  currentItemInfo?: LedgerItemInfo;
  cumulativeBalance: number;
  isCarryOver?: boolean;
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
  expandedEntries?: ExpandedLedgerEntry[];  // 조회 화면에서 계산된 품목별 펼침 데이터
  customer?: Customer | null;
  dateRange?: [dayjs.Dayjs, dayjs.Dayjs];
  title: string;
  previousBalance?: number;
}

export const TransactionLedgerPrintModal: React.FC<TransactionLedgerPrintModalProps> = ({
  open,
  onClose,
  ledgerEntries,
  expandedEntries,
  customer,
  dateRange,
  title,
  previousBalance = 0
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

  // 합계 잔액은 전체 거래의 마지막 잔액을 표시
  const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

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
      {/* 인쇄 방향 설정 - 가로 */}
      <style>
        {`
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
            }
            html, body {
              background: white !important;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

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
                <strong>사업자번호:</strong> {customer.businessNumber ? customer.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3') : '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>대표자:</strong> {customer.representative || '미등록'}
              </div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ flex: 1.5 }}>
                <strong>주소:</strong> {customer.address || '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>전화번호:</strong> {customer.phone || '미등록'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>이메일:</strong> {customer.email || '미등록'}
              </div>
              <div style={{ flex: 1.2 }}>
                <strong>조회기간:</strong> {dateRange ? `${dateRange[0].format('YYYY-MM-DD')} ~ ${dateRange[1].format('YYYY-MM-DD')}` : '-'}
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
            <tr>
              {(['일자','거래처','구분','품목명','수량','공급가액','세액','합계','잔액','비고'] as const).map(label => (
                <th key={label} style={{
                  border: '1px solid #000',
                  padding: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  backgroundColor: '#f0f0f0'
                }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 이월잔액 행 */}
            {previousBalance !== 0 && dateRange && dateRange[0] && (
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', backgroundColor: '#fffbe6' }}>
                  {dateRange[0].subtract(1, 'day').format('YYYY-MM-DD')}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', backgroundColor: '#fffbe6' }}>
                  {customer?.name}
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', backgroundColor: '#fffbe6', color: '#faad14' }}>
                  이월
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', backgroundColor: '#fffbe6' }}>
                  이월잔액
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center' }}></td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fffbe6', color: previousBalance >= 0 ? '#1B61A8' : '#ff4d4f' }}>
                  {previousBalance.toLocaleString()}원
                </td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'center', backgroundColor: '#fffbe6' }}>-</td>
              </tr>
            )}

            {/* 거래 내역 - 품목별 펼침 (expandedEntries 사용) */}
            {(expandedEntries || []).filter(e => !e.isCarryOver).map((entry, index) => {
              const { isFirstRow, currentItemInfo, cumulativeBalance } = entry;

              // 품목명 표시
              const getItemDisplay = () => {
                if (entry.type === 'receipt' || entry.type === 'payment') {
                  return entry.description;
                }
                if (currentItemInfo) {
                  return currentItemInfo.itemName;
                }
                return entry.description;
              };

              // 공급가액 표시: 품목별 금액
              const displaySupplyAmount = currentItemInfo?.amount ?? (isFirstRow ? entry.supplyAmount : 0);

              return (
                <tr key={entry.rowKey || index}>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    {isFirstRow ? dayjs(entry.date).format('YYYY-MM-DD') : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center'
                  }}>
                    {isFirstRow ? (entry.customerName || customer?.name) : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center',
                    color: entry.type === 'sales' ? '#1B61A8' : entry.type === 'purchase' ? '#000' : entry.type === 'receipt' ? '#52c41a' : '#fa8c16'
                  }}>
                    {isFirstRow ? (entry.type === 'sales' ? '매출' : entry.type === 'purchase' ? '매입' : entry.type === 'receipt' ? '수금' : '지급') : ''}
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
                    textAlign: 'right'
                  }}>
                    {(entry.type !== 'receipt' && entry.type !== 'payment' && currentItemInfo?.quantity != null)
                      ? currentItemInfo.quantity.toLocaleString()
                      : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    color: displaySupplyAmount < 0 ? '#ff4d4f' : (entry.type === 'sales' ? '#1B61A8' : entry.type === 'receipt' ? '#ff4d4f' : '#000')
                  }}>
                    {displaySupplyAmount !== undefined ? `${displaySupplyAmount.toLocaleString()}원` : ''}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right'
                  }}>
                    {(() => {
                      const displayTax = currentItemInfo?.taxAmount ?? (isFirstRow ? entry.vatAmount : 0);
                      const isNegative = displayTax < 0;
                      return displayTax !== undefined ? (
                        <span style={{ color: isNegative ? '#ff4d4f' : undefined }}>
                          {displayTax.toLocaleString()}원
                        </span>
                      ) : '';
                    })()}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    {(() => {
                      const displayTotal = currentItemInfo?.totalAmount ?? (isFirstRow ? entry.totalAmount : 0);
                      const isNegative = displayTotal < 0;
                      return displayTotal !== undefined ? (
                        <span style={{ color: isNegative ? '#ff4d4f' : undefined }}>
                          {displayTotal.toLocaleString()}원
                        </span>
                      ) : '';
                    })()}
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: cumulativeBalance >= 0 ? '#1B61A8' : '#ff4d4f'
                  }}>
                    {cumulativeBalance.toLocaleString()}원
                  </td>
                  <td style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'center',
                    fontSize: '8pt'
                  }}>
                    {isFirstRow ? (entry.memo || '') : ''}
                  </td>
                </tr>
              );
            })}

            {/* 합계 행 */}
            {(() => {
              const totalQty = (expandedEntries || []).filter((e: any) => !e.isCarryOver && e.type !== 'receipt' && e.type !== 'payment')
                .reduce((sum: number, e: any) => sum + (e.currentItemInfo?.quantity || 0), 0);
              return (
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                    합계
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
                    {totalQty > 0 ? totalQty.toLocaleString() : ''}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fafafa', color: finalBalance >= 0 ? '#1B61A8' : '#ff4d4f' }}>
                    {finalBalance.toLocaleString()}원
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}></td>
                </tr>
              );
            })()}

            {/* 매출 합계 / 수금 합계 */}
            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                매출 합계
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalSalesSupply.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalSalesVat.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalSalesAmount.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                수금 합계
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', color: '#ff4d4f', fontWeight: 'bold', backgroundColor: '#f0f0f0', fontSize: '10pt' }}>
                {totalReceiptAmount.toLocaleString()}원
              </td>
            </tr>

            {/* 매입 합계 / 지급 합계 */}
            <tr>
              <td colSpan={4} style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                매입 합계
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}></td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalPurchaseSupply.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalPurchaseVat.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                {totalPurchaseAmount.toLocaleString()}원
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                지급 합계
              </td>
              <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f0f0f0', fontSize: '10pt' }}>
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
