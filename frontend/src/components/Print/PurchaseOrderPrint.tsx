import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PurchaseOrderItem {
  productName: string;
  spec?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
}

interface PurchaseOrderData {
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  buyer: {
    companyName: string;
    businessNumber: string;
    representative: string;
    address?: string;
    phone?: string;
    fax?: string;
    sealImage?: string;
  };
  supplier: {
    companyName: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
  };
  items: PurchaseOrderItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
  deliveryLocation?: string;
  paymentTerms?: string;
}

interface PurchaseOrderPrintProps {
  open: boolean;
  onClose: () => void;
  data: PurchaseOrderData | null;
  autoSaveType?: 'pdf' | 'png' | 'jpg' | 'clipboard' | null;
}

const PurchaseOrderPrint: React.FC<PurchaseOrderPrintProps> = ({ open, onClose, data, autoSaveType }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = async () => {
    if (!printRef.current || !data) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `발주서_${data.orderNumber}_${dayjs().format('YYYYMMDD')}.png`;
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
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `발주서_${data.orderNumber}_${dayjs().format('YYYYMMDD')}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      message.success('JPG 이미지가 다운로드되었습니다.');
    } catch (error) {
      message.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !data) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`발주서_${data.orderNumber}_${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF가 다운로드되었습니다.');
    } catch (error) {
      message.error('PDF 다운로드에 실패했습니다.');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
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
      }, 500);
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
      <style>{`
        @media print {
          .print-modal-footer,
          .ant-modal-footer,
          .ant-modal-close,
          .ant-modal-header {
            display: none !important;
          }
          .ant-modal-content {
            box-shadow: none !important;
          }
          .ant-modal {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .ant-modal-body {
            padding: 0 !important;
          }
        }
      `}</style>
      <Modal
        title="발주서 인쇄 미리보기"
        open={open}
        onCancel={onClose}
        width={850}
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
        <div ref={printRef} style={{ padding: 30, backgroundColor: '#fff', fontFamily: 'Malgun Gothic, sans-serif' }}>
          {/* 제목 */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: 32, fontWeight: 'bold', margin: 0, letterSpacing: 12, color: '#e65100' }}>발 주 서</h1>
            <div style={{ fontSize: 14, color: '#666', marginTop: 8 }}>PURCHASE ORDER</div>
          </div>

          {/* 수신자 (공급업체) 정보 */}
          <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#fff3e0', border: '2px solid #e65100', borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: '#e65100', marginBottom: 4 }}>수신</div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>
              {data.supplier.companyName} <span style={{ fontWeight: 'normal', fontSize: 14 }}>귀중</span>
            </div>
            {data.supplier.representative && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>담당자: {data.supplier.representative}</div>
            )}
          </div>

          {/* 발주 정보 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#fff3e0', border: '1px solid #ddd', width: '35%', fontWeight: 'bold' }}>발주번호</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.orderNumber}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#fff3e0', border: '1px solid #ddd', fontWeight: 'bold' }}>발주일자</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{dayjs(data.orderDate).format('YYYY년 MM월 DD일')}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#fff3e0', border: '1px solid #ddd', fontWeight: 'bold' }}>납기일자</td>
                        <td style={{ padding: 8, border: '1px solid #ddd', color: '#d32f2f', fontWeight: 'bold' }}>{dayjs(data.deliveryDate).format('YYYY년 MM월 DD일')}</td>
                      </tr>
                      {data.deliveryLocation && (
                        <tr>
                          <td style={{ padding: 8, backgroundColor: '#fff3e0', border: '1px solid #ddd', fontWeight: 'bold' }}>납품장소</td>
                          <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.deliveryLocation}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: 10 }}>
                  <div style={{ border: '3px solid #e65100', padding: 15, backgroundColor: '#fff' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 10, color: '#e65100' }}>발주금액</div>
                    <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#d32f2f' }}>
                      ₩ {formatNumber(data.totalAmount)}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginTop: 5 }}>
                      (VAT 포함)
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 품목 테이블 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, border: '1px solid #333', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#e65100', color: '#fff' }}>
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
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{item.unit || 'EA'}</td>
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
              <tr style={{ backgroundColor: '#fff3e0' }}>
                <td colSpan={5} style={{ padding: 10, border: '1px solid #333', textAlign: 'center', fontWeight: 'bold' }}>합 계</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(data.supplyAmount)}</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(data.vatAmount)}</td>
                <td style={{ padding: 10, border: '1px solid #333', textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(data.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 비고/조건 */}
          <div style={{ marginBottom: 20, padding: 15, backgroundColor: '#fafafa', border: '1px solid #ddd', fontSize: 11 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>발주조건 및 비고</div>
            <div style={{ whiteSpace: 'pre-line', color: '#555' }}>
              {data.memo || `- 납기일자를 엄수해 주시기 바랍니다.\n- 품질 불량 시 반품 처리됩니다.\n- 납품 시 거래명세서를 반드시 첨부해 주시기 바랍니다.`}
            </div>
            {data.paymentTerms && (
              <div style={{ marginTop: 10 }}>
                <strong>결제조건:</strong> {data.paymentTerms}
              </div>
            )}
          </div>

          {/* 발주자 정보 */}
          <div style={{ marginTop: 30, borderTop: '2px solid #e65100', paddingTop: 20 }}>
            <table style={{ width: '100%', fontSize: 11 }}>
              <tbody>
                <tr>
                  <td style={{ width: '60%', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 10, color: '#e65100' }}>발주자</div>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '25%', padding: 4, color: '#666' }}>상호</td>
                          <td style={{ padding: 4, fontWeight: 'bold' }}>{data.buyer.companyName}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>사업자번호</td>
                          <td style={{ padding: 4 }}>{data.buyer.businessNumber}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>대표자</td>
                          <td style={{ padding: 4 }}>{data.buyer.representative}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>주소</td>
                          <td style={{ padding: 4 }}>{data.buyer.address || ''}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: 4, color: '#666' }}>연락처</td>
                          <td style={{ padding: 4 }}>
                            {data.buyer.phone && `Tel: ${data.buyer.phone}`}
                            {data.buyer.fax && ` / Fax: ${data.buyer.fax}`}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td style={{ width: '40%', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ border: '1px solid #ddd', padding: data.buyer.sealImage ? 10 : 30, display: 'inline-block', minWidth: 120, minHeight: 80, textAlign: 'center' }}>
                      {data.buyer.sealImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${data.buyer.sealImage}`}
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

          {/* 하단 안내 */}
          <div style={{ marginTop: 20, fontSize: 10, color: '#999', textAlign: 'center' }}>
            본 발주서에 명시된 사항을 준수하여 납품하여 주시기 바랍니다.
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PurchaseOrderPrint;
