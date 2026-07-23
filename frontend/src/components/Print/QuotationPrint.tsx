import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
// html2canvas(~585KB)는 인쇄/저장 클릭 시점에만 동적 로드 (초기 청크에서 제외).
// 기존 호출부(await html2canvas(...))를 그대로 두기 위해 동명 async 래퍼로 감싼다.
const html2canvas = async (element: HTMLElement, options?: any): Promise<HTMLCanvasElement> =>
  (await import('html2canvas')).default(element, options);
import { formatBusinessNumber } from '../../utils/formatters';

interface QuotationItem {
  productName: string;
  spec?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}

interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  supplier: {
    companyName: string;
    businessNumber: string;
    representative: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    sealImage?: string;
  };
  receiver: {
    companyName: string;
    representative?: string;
    address?: string;
    phone?: string;
  };
  items: QuotationItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
}

interface QuotationPrintProps {
  open: boolean;
  onClose: () => void;
  data: QuotationData | null;
  autoSaveType?: 'pdf' | 'png' | 'jpg' | 'clipboard' | null;
}

const QuotationPrint: React.FC<QuotationPrintProps> = ({ open, onClose, data, autoSaveType }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(num));

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>견적서 인쇄</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Malgun Gothic', sans-serif; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${printRef.current.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownloadPNG = async () => {
    if (!printRef.current || !data) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 3, backgroundColor: '#fff', logging: false });
      const link = document.createElement('a');
      link.download = `견적서_${data.quotationNumber}_${dayjs().format('YYYYMMDD')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      message.success('PNG 이미지가 다운로드되었습니다.');
    } catch (error) {
      message.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadJPG = async () => {
    if (!printRef.current || !data) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 3, backgroundColor: '#fff', logging: false });
      const link = document.createElement('a');
      link.download = `견적서_${data.quotationNumber}_${dayjs().format('YYYYMMDD')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      message.success('JPG 이미지가 다운로드되었습니다.');
    } catch (error) {
      message.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!data) return;
    const { exportQuotationToVectorPdf } = await import('../../utils/vectorPdfExport');
    await exportQuotationToVectorPdf({
      filename: `견적서_${data.quotationNumber}`,
      documentNumber: data.quotationNumber,
      date: dayjs(data.quotationDate).format('YYYY년 MM월 DD일'),
      validUntil: data.validUntil ? dayjs(data.validUntil).format('YYYY년 MM월 DD일') : undefined,
      supplier: {
        name: data.supplier.companyName,
        businessNumber: data.supplier.businessNumber,
        representative: data.supplier.representative,
        address: data.supplier.address,
        phone: data.supplier.phone,
        fax: data.supplier.fax,
        sealImage: data.supplier.sealImage,
      },
      receiver: {
        name: data.receiver.companyName,
        representative: data.receiver.representative,
        address: data.receiver.address,
        phone: data.receiver.phone,
      },
      items: data.items || [],
      supplyAmount: data.supplyAmount,
      vatAmount: data.vatAmount,
      totalAmount: data.totalAmount,
      memo: data.memo,
    });
  };

  const handleCopyToClipboard = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 3, backgroundColor: '#fff', logging: false });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            message.success('클립보드에 복사되었습니다.');
          } catch (err) {
            message.error('클립보드 복사에 실패했습니다.');
          }
        }
      }, 'image/png');
    } catch (error) {
      message.error('클립보드 복사에 실패했습니다.');
    }
  };

  // 자동 저장 처리
  useEffect(() => {
    if (open && autoSaveType && data) {
      const timer = setTimeout(async () => {
        switch (autoSaveType) {
          case 'pdf':
            await handleDownloadPDF();
            break;
          case 'png':
            await handleDownloadPNG();
            break;
          case 'jpg':
            await handleDownloadJPG();
            break;
          case 'clipboard':
            await handleCopyToClipboard();
            break;
        }
        onClose();
      }, 500); // 렌더링 대기
      return () => clearTimeout(timer);
    }
  }, [open, autoSaveType, data]);

  if (!data) return null;

  const downloadMenuItems = [
    { key: 'pdf', label: 'PDF 저장', icon: <FilePdfOutlined />, onClick: handleDownloadPDF },
    { key: 'png', label: 'PNG 저장', icon: <FileImageOutlined />, onClick: handleDownloadPNG },
    { key: 'jpg', label: 'JPG 저장', icon: <FileImageOutlined />, onClick: handleDownloadJPG },
    { key: 'clipboard', label: '클립보드 복사', icon: <CopyOutlined />, onClick: handleCopyToClipboard },
  ];

  const emptyRows = Math.max(0, 5 - (data.items?.length || 0));

  return (
    <>
      {/* 인쇄 시 버튼 숨김을 위한 스타일 */}
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .ant-modal-mask,
          .ant-modal-wrap,
          .print-modal-footer,
          .ant-modal-footer,
          .ant-modal-close,
          .ant-modal-header {
            display: none !important;
          }
        }
      `}</style>
      <Modal
        title="견적서 인쇄 미리보기"
        open={open}
        onCancel={onClose}
        width={850}
        styles={{ body: { backgroundColor: '#f5f5f5', padding: 20 } }}
        footer={
          <Space className="print-modal-footer">
            <Dropdown menu={{ items: downloadMenuItems }} placement="topLeft">
              <Button icon={<DownloadOutlined />}>저장</Button>
            </Dropdown>
            <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>인쇄</Button>
            <Button onClick={onClose}>닫기</Button>
          </Space>
        }
      >
        <div ref={printRef} className="print-content" style={{ padding: 30, backgroundColor: '#fff', fontFamily: 'Malgun Gothic, sans-serif', color: '#000', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
          {/* 제목 */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, letterSpacing: 12, color: '#1a237e' }}>견 적 서</h1>
            <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>QUOTATION</div>
          </div>

          {/* 수신자 정보 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {data.receiver.companyName} <span style={{ fontWeight: 'normal', fontSize: 14 }}>귀하</span>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {data.receiver.address && <div>{data.receiver.address}</div>}
              {data.receiver.phone && <div>Tel: {data.receiver.phone}</div>}
            </div>
          </div>

          {/* 견적 정보 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#f5f5f5', border: '1px solid #ddd', width: '35%' }}>견적번호</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.quotationNumber}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>견적일자</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{dayjs(data.quotationDate).format('YYYY년 MM월 DD일')}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>유효기간</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{dayjs(data.validUntil).format('YYYY년 MM월 DD일')}까지</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: 10 }}>
                  <div style={{ border: '2px solid #1a237e', padding: 15, backgroundColor: '#fafafa' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 10, color: '#1a237e' }}>견적금액</div>
                    <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#d32f2f' }}>
                      ₩ {formatNumber(data.totalAmount)}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginTop: 5 }}>
                      (부가세 포함)
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 품목 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '1px solid #333', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#1a237e', color: '#fff' }}>
                <th style={{ padding: 10, border: '1px solid #333', width: '5%' }}>No</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '35%' }}>품목명</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '10%' }}>규격</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '8%' }}>단위</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '8%' }}>수량</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '12%' }}>단가</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '12%' }}>공급가액</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '10%' }}>세액</th>
              </tr>
            </thead>
            <tbody>
              {(data.items || []).map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.productName}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{item.spec || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{item.unit || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(item.quantity)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(item.unitPrice)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(item.supplyAmount)}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right' }}>{formatNumber(item.vatAmount)}</td>
                </tr>
              ))}
              {/* 빈 행 */}
              {Array.from({ length: emptyRows }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#1a237e' }}>
                <td colSpan={5} style={{ padding: 10, border: '1px solid #333', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>합 계</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>{formatNumber(data.supplyAmount)}</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>{formatNumber(data.vatAmount)}</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>{formatNumber(data.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 비고/조건 */}
          {data.memo && (
            <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#fafafa', border: '1px solid #ddd', fontSize: 11 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>비고</div>
              <div style={{ whiteSpace: 'pre-line', color: '#555' }}>
                {data.memo}
              </div>
            </div>
          )}

          {/* 공급자 정보 */}
          <div style={{ marginTop: 30, borderTop: '2px solid #1a237e', paddingTop: 20 }}>
            <table style={{ width: '100%', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ width: '60%', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 10, color: '#1a237e' }}>공급자</div>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '25%', padding: 4, color: '#666' }}>상호</td>
                          <td style={{ padding: 4, fontWeight: 'bold' }}>{data.supplier.companyName}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>사업자번호</td>
                          <td style={{ padding: 4 }}>{formatBusinessNumber(data.supplier.businessNumber || '')}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>대표자</td>
                          <td style={{ padding: 4 }}>{data.supplier.representative}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>주소</td>
                          <td style={{ padding: 4 }}>{data.supplier.address || ''}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>연락처</td>
                          <td style={{ padding: 4 }}>
                            {data.supplier.phone && `Tel: ${data.supplier.phone}`}
                            {data.supplier.fax && ` / Fax: ${data.supplier.fax}`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ border: '1px solid #ddd', padding: data.supplier.sealImage ? 10 : 30, display: 'inline-block', minWidth: 120, minHeight: 80, textAlign: 'center' }}>
                      {data.supplier.sealImage ? (
                        <img
                          src={data.supplier.sealImage.startsWith('data:') ? data.supplier.sealImage : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${data.supplier.sealImage}`}
                          alt="도장"
                          style={{ maxWidth: 100, maxHeight: 100, objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ fontSize: 10, color: '#999', paddingTop: 20 }}>(인)</div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QuotationPrint;
