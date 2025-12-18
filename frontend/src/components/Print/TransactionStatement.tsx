import React from 'react';
import dayjs from 'dayjs';

interface TransactionData {
  id: number;
  date: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyRegistrationNumber?: string;
  ceoName?: string;
  items: Array<{
    itemName: string;
    specification?: string;
    spec?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    amount?: number;
    supplyAmount?: number;  // 공급가액
    vatAmount?: number;     // 세액
    totalAmount?: number;   // 합계금액
    taxType?: string;       // 과세 유형
    taxExempt?: boolean;    // 면세 여부 (backward compatibility)
    taxInclusive?: boolean; // 과세포함 여부 (backward compatibility)
  }>;
  totalAmount: number;
  tax: number;
  grandTotal: number;
  balanceAmount?: number;
  notes?: string;
  memo?: string;
  notice?: string;
}

interface SupplierInfo {
  companyName: string;
  businessNumber: string;
  representative: string;
  address?: string;
  phone?: string;
}

interface TransactionStatementProps {
  data: TransactionData;
  type: 'purchase' | 'sales';
  supplierInfo?: SupplierInfo;  // 공급자(우리 회사) 정보
  printOptions?: {
    hideBalance?: boolean;
    hideAmounts?: boolean;
    hideStorageLabel?: boolean;
  };
  printMode?: 'full' | 'receiver' | 'supplier';
  showActions?: boolean;
  signatureSlot?: React.ReactNode;
}

export const TransactionStatement: React.FC<TransactionStatementProps> = ({
  data,
  type,
  supplierInfo,
  printOptions: _printOptions = {},
  printMode = 'full',
  showActions: _showActions = true,
  signatureSlot
}) => {
  const title = type === 'purchase' ? '매입 거래명세표' : '매출 거래명세표';

  // null 또는 undefined data에 대한 방어 코드
  if (!data) {
    return null;
  }

  // 단일 명세표 컴포넌트 (공급받는자/공급자용)
  const renderSingleStatement = (isSupplier: boolean) => (
    <div style={{
      width: '100%',
      minHeight: printMode === 'full' ? 'calc(148.5mm - 6mm)' : 'auto',
      fontFamily: 'Malgun Gothic, sans-serif',
      fontSize: printMode === 'full' ? '10pt' : '9pt', // 단독 인쇄는 폰트 작게
      lineHeight: '1.3',
      color: '#000',
      padding: printMode === 'full' ? '3mm' : '0', // 단독 인쇄는 패딩 없음
      boxSizing: 'border-box',
      overflow: 'visible'
    }}>
      {/* 헤더 */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        marginBottom: '3mm',
        borderBottom: '1px solid #000',
        paddingBottom: '2mm'
      }}>
        <h1 style={{
          fontSize: '16pt', // 제목 크기 증가
          fontWeight: 'bold',
          margin: '0 0 1mm 0'
        }}>
          {title}
        </h1>
        <div style={{
          fontSize: '9pt', // 부제목 크기 증가
          color: '#666',
          marginBottom: '1mm',
          fontWeight: '500'
        }}>
          {type === 'purchase' ? 'Purchase Statement' : 'Sales Statement'}
        </div>
        {!_printOptions.hideStorageLabel && (
          <div style={{
            fontSize: '11pt', // 보관용 표시 크기 증가
            fontWeight: 'bold',
            color: isSupplier ? '#d32f2f' : '#1976d2'
          }}>
            {isSupplier ? '공급자 보관용' : '공급받는자 보관용'}
          </div>
        )}

        {/* 거래처명 귀중 - 우측 끝 */}
        <div style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12pt', // 귀중 표시 크기 증가
          fontWeight: 'bold',
          color: '#333'
        }}>
          {data?.companyName || ''} 귀중
        </div>
      </div>

      {/* 공급자 정보 - 2행 레이아웃 */}
      <div style={{
        marginBottom: '3mm',
        border: 'none', // 테두리 제거
        padding: '2mm',
        fontSize: '9pt' // 공급자 정보 폰트 크기 증가
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
          <tbody>
            <tr>
              <td style={{ width: '12%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>공급자명:</td>
              <td style={{ width: '25%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>{supplierInfo?.companyName || '-'}</td>
              <td style={{ width: '10%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>거래일자:</td>
              <td style={{ width: '20%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>{data?.date ? dayjs(data.date).format('YYYY.MM.DD') : ''}</td>
              <td style={{ width: '13%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>사업자번호:</td>
              <td style={{ width: '20%', fontWeight: 'normal', padding: '1mm', border: 'none' }}>
                {supplierInfo?.businessNumber
                  ? supplierInfo.businessNumber.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3')
                  : '-'}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>공급자주소:</td>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>{supplierInfo?.address || '-'}</td>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>공급자전화:</td>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>{supplierInfo?.phone || '-'}</td>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>대표자명:</td>
              <td style={{ fontWeight: 'normal', padding: '1mm', border: 'none' }}>{supplierInfo?.representative || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 품목 테이블 */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '2mm',
        border: '1px solid #000',
        fontSize: '9pt' // 테이블 폰트 크기 증가
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '5%'
            }}>No.</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '32.5%'
            }}>품목명</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '7.5%'
            }}>규격</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '8%'
            }}>단위</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '7%'
            }}>수량</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '12%'
            }}>단가</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '12%'
            }}>공급가액</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '8%'
            }}>세액</th>
            <th style={{
              border: '1px solid #000',
              padding: '2mm 1mm',
              textAlign: 'center',
              fontWeight: 'bold',
              width: '12%',
              whiteSpace: 'nowrap'
            }}>합계금액</th>
          </tr>
        </thead>
        <tbody>
          {(data?.items || []).map((item, index) => {
            // 공급가액, 세액, 합계금액 처리
            // 새로운 데이터 구조(supplyAmount, vatAmount, totalAmount)를 우선 사용하고
            // 없으면 이전 방식(amount, taxType)으로 계산
            let displaySupplyAmount: number;
            let itemTax: number;
            let itemTotal: number;

            if (item.supplyAmount !== undefined && item.vatAmount !== undefined && item.totalAmount !== undefined) {
              // 새로운 데이터 구조: 이미 계산된 값 사용
              displaySupplyAmount = item.supplyAmount;
              itemTax = item.vatAmount;
              itemTotal = item.totalAmount;
            } else {
              // 이전 데이터 구조: amount와 taxType으로 계산
              const amount = item.amount || (item.quantity * item.unitPrice);
              const taxType = item.taxType || '';
              const isTaxExempt = item.taxExempt || taxType === 'tax_free';
              const isTaxInclusive = item.taxInclusive || taxType === 'tax_inclusive';

              if (isTaxExempt) {
                // 면세: 세액 0, 합계 = 공급가액
                displaySupplyAmount = amount;
                itemTax = 0;
                itemTotal = amount;
              } else if (isTaxInclusive) {
                // 과세포함: 합계금액 = amount, 공급가액 = amount / 1.1, 세액 = 합계 - 공급가액
                itemTotal = amount;
                displaySupplyAmount = Math.round(amount / 1.1);
                itemTax = itemTotal - displaySupplyAmount;
              } else {
                // 과세별도: 공급가액 = amount, 세액 = amount * 0.1, 합계 = 공급가액 + 세액
                displaySupplyAmount = amount;
                itemTax = Math.round(amount * 0.1);
                itemTotal = displaySupplyAmount + itemTax;
              }
            }

            // 과세 유형 표시 텍스트
            const taxTypeText = item.taxType === 'tax_free' || item.taxExempt ? '면세' : Math.round(itemTax).toLocaleString();

            return (
              <tr key={index}>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'center'
                }}>{index + 1}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'left'
                }}>{item.itemName}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'center'
                }}>{item.specification || item.spec || '-'}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'center'
                }}>{item.unit || 'EA'}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'right',
                  color: item.quantity < 0 ? '#d32f2f' : 'inherit'
                }}>{Number(item.quantity).toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'right'
                }}>{Math.round(item.unitPrice).toLocaleString()}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'right',
                  fontWeight: 'bold'
                }}>{Math.round(displaySupplyAmount).toLocaleString()}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'right'
                }}>{taxTypeText}</td>
                <td style={{
                  border: '1px solid #000',
                  padding: '1mm',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#d32f2f'
                }}>{Math.round(itemTotal).toLocaleString()}</td>
              </tr>
            );
          })}

          {/* 빈 행 추가 (10행) */}
          {[...Array(Math.max(0, 10 - (data?.items?.length || 0)))].map((_, index) => (
            <tr key={`empty-${index}`}>
              <td style={{ border: '1px solid #000', padding: '1mm', height: '5mm' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
              <td style={{ border: '1px solid #000' }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 하단 정보 - 합계와 메모를 가로로 배치 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '5mm'
      }}>
        {/* 메모 및 공지사항 영역 */}
        <div style={{ flex: 1 }}>
          {/* 메모란 */}
          <div style={{
            border: '1px solid #999',
            padding: '1.5mm',
            fontSize: '8pt',
            backgroundColor: '#f9f9f9',
            height: '10mm',
            marginBottom: '0mm',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5mm', color: '#333' }}>메모란:</div>
            <div style={{ flex: 1, lineHeight: '1.3', overflow: 'hidden' }}>
              {data?.memo || ''}
            </div>
          </div>

          {/* 공지사항 */}
          <div style={{
            border: '1px solid #999',
            padding: '1.5mm',
            fontSize: '8pt',
            backgroundColor: '#f0f8ff',
            height: '10mm',
            marginTop: '0mm',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5mm', color: '#333' }}>공지사항:</div>
            <div style={{ flex: 1, lineHeight: '1.3', overflow: 'hidden' }}>
              {data?.notice || data?.notes || ''}
            </div>
          </div>
        </div>

        {/* 합계 정보 */}
        <table style={{
          borderCollapse: 'collapse',
          width: '80mm',
          fontSize: '10pt' // 합계 테이블 폰트 크기 증가
        }}>
          <tbody>
            {(() => {
              // 실제 합계 계산 - 품목별로 계산된 값을 합산
              // 품목 행 렌더링과 동일한 로직 사용
              const totalSupplyAmount = (data?.items || []).reduce((sum, item) => {
                // 새로운 데이터 구조: 모두 있어야 사용 (품목 행 렌더링과 동일)
                if (item.supplyAmount !== undefined && item.vatAmount !== undefined && item.totalAmount !== undefined) {
                  return sum + item.supplyAmount;
                }

                // 이전 데이터 구조: amount와 taxType으로 계산
                const amount = item.amount || (item.quantity * item.unitPrice);
                const taxType = item.taxType || '';
                const isTaxExempt = item.taxExempt || taxType === 'tax_free';
                const isTaxInclusive = item.taxInclusive || taxType === 'tax_inclusive';

                if (isTaxExempt) {
                  return sum + amount;
                } else if (isTaxInclusive) {
                  return sum + Math.round(amount / 1.1);
                } else {
                  return sum + amount;
                }
              }, 0);

              const totalTax = (data?.items || []).reduce((sum, item) => {
                // 새로운 데이터 구조: 모두 있어야 사용 (품목 행 렌더링과 동일)
                if (item.supplyAmount !== undefined && item.vatAmount !== undefined && item.totalAmount !== undefined) {
                  return sum + item.vatAmount;
                }

                // 이전 데이터 구조: amount와 taxType으로 계산
                const amount = item.amount || (item.quantity * item.unitPrice);
                const taxType = item.taxType || '';
                const isTaxExempt = item.taxExempt || taxType === 'tax_free';
                const isTaxInclusive = item.taxInclusive || taxType === 'tax_inclusive';

                if (isTaxExempt) {
                  return sum;
                } else if (isTaxInclusive) {
                  return sum + (amount - Math.round(amount / 1.1));
                } else {
                  return sum + Math.round(amount * 0.1);
                }
              }, 0);

              const grandTotal = totalSupplyAmount + totalTax;
              const previousBalance = data?.balanceAmount || 0;
              const totalBalance = grandTotal + previousBalance;

              return (
                <>
                  <tr>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      backgroundColor: '#f0f0f0',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '10pt',
                      width: '30mm',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>전잔금</td>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>{Math.round(previousBalance).toLocaleString()}원</td>
                  </tr>
                  <tr style={{ backgroundColor: '#e8f4f8' }}>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '10pt',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>합계금액</td>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      color: '#d32f2f',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>{Math.round(grandTotal).toLocaleString()}원</td>
                  </tr>
                  <tr style={{ backgroundColor: '#fff3e0' }}>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: '10pt',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>총잔금</td>
                    <td style={{
                      border: '1px solid #000',
                      padding: '1mm',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      color: '#f57c00',
                      height: '6.5mm',
                      whiteSpace: 'nowrap'
                    }}>{Math.round(totalBalance).toLocaleString()}원</td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>

        {/* 서명란 슬롯 */}
        {signatureSlot && (
          <div style={{ marginTop: '5mm' }}>
            {signatureSlot}
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* 단독 인쇄 전용 스타일 */}
      {printMode !== 'full' && (
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
            }
            .single-print-wrapper {
              width: 200mm !important;
              height: 160mm !important;
              max-height: 160mm !important;
              padding: 4mm 10mm 6mm 10mm !important;
              margin: 0 !important;
              overflow: visible !important;
            }
          }
        `}</style>
      )}

      <div
        className={printMode !== 'full' ? 'single-print-wrapper' : ''}
        style={{
          width: '210mm',
          minHeight: printMode === 'full' ? '297mm' : 'auto',
          margin: '0 auto',
          backgroundColor: 'white',
          position: 'relative',
          padding: printMode !== 'full' ? '4mm 15mm 6mm 15mm' : '0',
          overflow: 'visible'
        }}>
      {(printMode === 'full' || printMode === 'receiver') && (
        <div style={{ position: 'relative' }}>
          {renderSingleStatement(false)}
        </div>
      )}

      {printMode === 'full' && (
        <div style={{
          borderTop: '1px dashed #999',
          margin: '3mm 10mm 0mm 10mm'
        }}></div>
      )}

      {(printMode === 'full' || printMode === 'supplier') && (
        <div style={{
          position: 'relative'
        }}>
          {renderSingleStatement(true)}
        </div>
      )}
      </div>
    </>
  );
};

export default TransactionStatement;