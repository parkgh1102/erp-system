import React from 'react';
import dayjs from 'dayjs';

interface LedgerEntry {
  date: string;
  description: string;
  type: 'sales' | 'purchase' | 'receipt' | 'payment';
  purchase: number;
  payment: number;
  sales: number;
  receipt: number;
  amount: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  balance: number;
  memo?: string;
  companyInfo?: {
    name: string;
    businessNumber?: string;
    representative?: string;
  };
  itemInfo?: {
    itemCode: string;
    itemName: string;
    spec?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  };
  itemCount?: number;
  customerName?: string;
}

interface LedgerData {
  companyName: string;
  companyAddress?: string;
  fromCompany?: {
    name: string;
    businessNumber: string;
    representative: string;
    address: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  toCompany?: {
    name: string;
    businessNumber: string;
    representative: string;
    address: string;
    phone?: string;
    email?: string;
  };
  period: {
    start: string;
    end: string;
  };
  previousBalance: number;
  entries: LedgerEntry[];
  totalPurchase: number;
  totalPayment: number;
  totalSales: number;
  totalReceipt: number;
  finalBalance: number;
  transactionCount?: number;
  totalQuantity?: number;
}

interface TransactionLedgerProps {
  data: LedgerData;
  type: 'purchase' | 'sales';
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({ data, type: _type }) => {
  // 집계 계산
  const totalQuantity = data.entries
    .filter(e => e.type !== 'receipt' && e.type !== 'payment')
    .reduce((sum, e) => sum + (e.itemInfo?.quantity || 0), 0);

  const totalSalesSupply = data.entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
  const totalSalesVat = data.entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
  const totalSalesAmount = data.entries.filter(e => e.type === 'sales').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const totalPurchaseSupply = data.entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.supplyAmount || 0), 0);
  const totalPurchaseVat = data.entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.vatAmount || 0), 0);
  const totalPurchaseAmount = data.entries.filter(e => e.type === 'purchase').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const totalReceiptAmount = data.entries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const totalPaymentAmount = data.entries.filter(e => e.type === 'payment').reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  const finalBalance = data.previousBalance + totalSalesAmount - totalPurchaseAmount - totalReceiptAmount + totalPaymentAmount;

  // 공통 셀 스타일
  const cellBase = { border: '1px solid #000', padding: '6px' };
  const thBase = { border: '1px solid #000', padding: '8px', backgroundColor: '#f0f0f0', textAlign: 'center' as const, fontWeight: 'bold' };
  const summaryBg = '#f0f0f0';

  return (
    <div className="ledger-print-body" style={{
      fontFamily: 'Malgun Gothic, sans-serif',
      fontSize: '10pt',
      lineHeight: '1.4',
      color: '#000',
      padding: '20mm',
      margin: '0',
      backgroundColor: '#fff'
    }}>
      {/* 표 아래 하단 여백(패딩/마진)이 다음 페이지로 밀려 빈 페이지가 찍히는 것 방지 */}
      <style>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; }
          .ledger-print-body { padding-bottom: 0 !important; }
          .ledger-print-body > table { margin-bottom: 0 !important; }
        }
      `}</style>
      {/* 제목 */}
      <div style={{
        fontSize: '24pt',
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: '20mm'
      }}>
        거래원장 조회
      </div>

      {/* 거래처 정보 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '10mm',
        marginBottom: '15mm',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>
            <strong>거래처명:</strong> {data.toCompany?.name || data.companyName}
          </div>
          <div style={{ flex: 1 }}>
            <strong>거래처코드:</strong> {data.toCompany?.businessNumber || '-'}
          </div>
          <div style={{ flex: 1 }}>
            <strong>사업자번호:</strong> {data.toCompany?.businessNumber ? data.toCompany.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3') : '미등록'}
          </div>
          <div style={{ flex: 1 }}>
            <strong>대표자:</strong> {data.toCompany?.representative || '미등록'}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 2 }}>
            <strong>주소:</strong> {data.toCompany?.address || '미등록'}
          </div>
          <div style={{ flex: 1 }}>
            <strong>전화번호:</strong> {data.toCompany?.phone || '미등록'}
          </div>
          <div style={{ flex: 1 }}>
            <strong>이메일:</strong> {data.toCompany?.email || '미등록'}
          </div>
        </div>
      </div>

      {/* 거래 내역 테이블 */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '10mm',
        fontSize: '9pt',
        border: '1px solid #000'
      }}>
        <thead>
          <tr>
            <th style={thBase}>일자</th>
            <th style={thBase}>거래처</th>
            <th style={thBase}>구분</th>
            <th style={thBase}>품목명</th>
            <th style={thBase}>수량</th>
            <th style={thBase}>공급가액</th>
            <th style={thBase}>세액</th>
            <th style={thBase}>합계</th>
            <th style={thBase}>잔액</th>
            <th style={thBase}>비고</th>
          </tr>
        </thead>
        <tbody>
          {/* 전잔금 표시 */}
          {data.previousBalance !== 0 && (
            <tr>
              <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff9e6' }}>
                {dayjs(data.period.start).subtract(1, 'day').format('YYYY-MM-DD')}
              </td>
              <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff9e6' }}>
                {data.toCompany?.name || data.companyName}
              </td>
              <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fff9e6', color: '#fa8c16' }}>
                전잔금
              </td>
              <td style={{ ...cellBase, textAlign: 'center' }}></td>
              <td style={{ ...cellBase, textAlign: 'right' }}></td>
              <td style={{ ...cellBase, textAlign: 'right' }}></td>
              <td style={{ ...cellBase, textAlign: 'right' }}></td>
              <td style={{ ...cellBase, textAlign: 'right' }}></td>
              <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fff9e6', color: data.previousBalance >= 0 ? '#1B61A8' : '#ff4d4f', fontSize: '10pt' }}>
                {data.previousBalance.toLocaleString()}원
              </td>
              <td style={{ ...cellBase, textAlign: 'center', backgroundColor: '#fff9e6' }}>
                조회기간 이전 잔액
              </td>
            </tr>
          )}

          {/* 거래 내역 */}
          {data.entries.map((entry, index) => {
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
                <td style={{ ...cellBase, textAlign: 'center' }}>
                  {dayjs(entry.date).format('YYYY-MM-DD')}
                </td>
                <td style={{ ...cellBase, textAlign: 'center' }}>
                  {entry.customerName || data.companyName}
                </td>
                <td style={{ ...cellBase, textAlign: 'center', color: entry.type === 'sales' ? '#1B61A8' : entry.type === 'purchase' ? '#000' : entry.type === 'receipt' ? '#52c41a' : '#fa8c16' }}>
                  {entry.type === 'sales' ? '매출' : entry.type === 'purchase' ? '매입' : entry.type === 'receipt' ? '수금' : '지급'}
                </td>
                <td style={{ ...cellBase, textAlign: 'center' }}>
                  {getItemDisplay()}
                </td>
                <td style={{ ...cellBase, textAlign: 'right' }}>
                  {(entry.type !== 'receipt' && entry.type !== 'payment' && entry.itemInfo?.quantity != null)
                    ? entry.itemInfo.quantity.toLocaleString()
                    : ''}
                </td>
                <td style={{ ...cellBase, textAlign: 'right', color: entry.type === 'sales' ? '#1B61A8' : entry.type === 'receipt' ? '#ff4d4f' : '#000' }}>
                  {entry.supplyAmount ? `${entry.supplyAmount.toLocaleString()}원` : ''}
                </td>
                <td style={{ ...cellBase, textAlign: 'right' }}>
                  {entry.vatAmount ? `${entry.vatAmount.toLocaleString()}원` : ''}
                </td>
                <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold' }}>
                  {entry.totalAmount ? `${entry.totalAmount.toLocaleString()}원` : ''}
                </td>
                <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', color: entry.balance >= 0 ? '#1B61A8' : '#ff4d4f' }}>
                  {entry.balance.toLocaleString()}원
                </td>
                <td style={{ ...cellBase, textAlign: 'center', fontSize: '8pt' }}>
                  {entry.memo || ''}
                </td>
              </tr>
            );
          })}

          {/* 합계 행 */}
          <tr>
            <td colSpan={4} style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
              합계
            </td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fafafa' }}>
              {totalQuantity > 0 ? totalQuantity.toLocaleString() : ''}
            </td>
            <td style={{ ...cellBase, textAlign: 'center' }}></td>
            <td style={{ ...cellBase, textAlign: 'center' }}></td>
            <td style={{ ...cellBase, textAlign: 'center' }}></td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: '#fafafa', color: finalBalance >= 0 ? '#1B61A8' : '#ff4d4f' }}>
              {finalBalance.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'center' }}></td>
          </tr>

          {/* 매출 합계 / 수금 합계 */}
          <tr>
            <td colSpan={4} style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: summaryBg }}>
              매출 합계
            </td>
            <td style={{ ...cellBase, textAlign: 'right' }}></td>
            <td style={{ ...cellBase, textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalSalesSupply.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalSalesVat.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'right', color: '#1B61A8', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalSalesAmount.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: summaryBg }}>
              수금 합계
            </td>
            <td style={{ ...cellBase, textAlign: 'right', color: '#ff4d4f', fontWeight: 'bold', backgroundColor: summaryBg, fontSize: '10pt' }}>
              {totalReceiptAmount.toLocaleString()}원
            </td>
          </tr>

          {/* 매입 합계 / 지급 합계 */}
          <tr>
            <td colSpan={4} style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: summaryBg }}>
              매입 합계
            </td>
            <td style={{ ...cellBase, textAlign: 'right' }}></td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalPurchaseSupply.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalPurchaseVat.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: summaryBg }}>
              {totalPurchaseAmount.toLocaleString()}원
            </td>
            <td style={{ ...cellBase, textAlign: 'center', fontWeight: 'bold', backgroundColor: summaryBg }}>
              지급 합계
            </td>
            <td style={{ ...cellBase, textAlign: 'right', fontWeight: 'bold', backgroundColor: summaryBg, fontSize: '10pt' }}>
              {totalPaymentAmount.toLocaleString()}원
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
