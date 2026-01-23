import React, { useRef, useEffect } from 'react';
import { Modal, Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TransactionDetail {
  id: number;
  date: string;
  type: 'sales' | 'receipt' | 'purchase' | 'payment';
  description: string;
  amount: number;
  balance: number;
}

interface CustomerBalanceData {
  customerCode: string;
  name: string;
  businessNumber?: string;
  totalSales: number;
  totalReceipts: number;
  receivableBalance: number;
  totalPurchases: number;
  totalPayments: number;
  payableBalance: number;
  netBalance: number;
  transactions: TransactionDetail[];
  printDate: string;
  businessName: string;
}

interface CustomerBalancePrintProps {
  open: boolean;
  onClose: () => void;
  data: CustomerBalanceData | null;
  autoSaveType?: 'pdf' | 'png' | 'jpg' | 'clipboard' | null;
}

const CustomerBalancePrint: React.FC<CustomerBalancePrintProps> = ({ open, onClose, data, autoSaveType }) => {
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
      link.download = `미수미지급현황_${data.name}_${dayjs().format('YYYYMMDD')}.png`;
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
      link.download = `미수미지급현황_${data.name}_${dayjs().format('YYYYMMDD')}.jpg`;
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
      pdf.save(`미수미지급현황_${data.name}_${dayjs().format('YYYYMMDD')}.pdf`);
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

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sales': return '매출';
      case 'receipt': return '수금';
      case 'purchase': return '매입';
      case 'payment': return '지급';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sales': return '#1890ff';
      case 'receipt': return '#52c41a';
      case 'purchase': return '#fa8c16';
      case 'payment': return '#f5222d';
      default: return '#000';
    }
  };

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
        title="미수/미지급 현황 인쇄 미리보기"
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
        <div ref={printRef} style={{ padding: 30, backgroundColor: '#fff', fontFamily: 'Malgun Gothic, sans-serif' }}>
          {/* 제목 */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0, letterSpacing: 8, color: '#36cfc9' }}>미수/미지급 현황표</h1>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>ACCOUNTS RECEIVABLE / PAYABLE STATEMENT</div>
          </div>

          {/* 기본 정보 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12 }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', verticalAlign: 'top', paddingRight: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#e6fffb', border: '1px solid #87e8de', width: '35%', fontWeight: 'bold' }}>거래처코드</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.customerCode}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#e6fffb', border: '1px solid #87e8de', fontWeight: 'bold' }}>거래처명</td>
                        <td style={{ padding: 8, border: '1px solid #ddd', fontWeight: 'bold', fontSize: 14 }}>{data.name}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#e6fffb', border: '1px solid #87e8de', fontWeight: 'bold' }}>사업자번호</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.businessNumber || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#f5f5f5', border: '1px solid #ddd', width: '35%' }}>출력일자</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.printDate}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: 8, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>작성업체</td>
                        <td style={{ padding: 8, border: '1px solid #ddd' }}>{data.businessName}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 잔액 요약 */}
          <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
            <div style={{ flex: 1, border: '2px solid #ff4d4f', borderRadius: 8, padding: 15, textAlign: 'center', backgroundColor: '#fff1f0' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>미수금 잔액</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#cf1322' }}>₩{formatNumber(data.receivableBalance)}</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 5 }}>매출 {formatNumber(data.totalSales)} - 수금 {formatNumber(data.totalReceipts)}</div>
            </div>
            <div style={{ flex: 1, border: '2px solid #faad14', borderRadius: 8, padding: 15, textAlign: 'center', backgroundColor: '#fffbe6' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>미지급 잔액</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: '#d48806' }}>₩{formatNumber(data.payableBalance)}</div>
              <div style={{ fontSize: 10, color: '#999', marginTop: 5 }}>매입 {formatNumber(data.totalPurchases)} - 지급 {formatNumber(data.totalPayments)}</div>
            </div>
            <div style={{ flex: 1, border: '2px solid #36cfc9', borderRadius: 8, padding: 15, textAlign: 'center', backgroundColor: '#e6fffb' }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>순 잔액</div>
              <div style={{ fontSize: 20, fontWeight: 'bold', color: data.netBalance >= 0 ? '#389e0d' : '#cf1322' }}>
                ₩{formatNumber(Math.abs(data.netBalance))}
                <span style={{ fontSize: 12, marginLeft: 5 }}>{data.netBalance >= 0 ? '(받을금액)' : '(줄금액)'}</span>
              </div>
            </div>
          </div>

          {/* 거래 내역 */}
          <div style={{ marginBottom: 10, fontSize: 14, fontWeight: 'bold', color: '#36cfc9', borderBottom: '2px solid #36cfc9', paddingBottom: 8 }}>
            거래 내역
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ backgroundColor: '#36cfc9', color: '#fff' }}>
                <th style={{ padding: 10, border: '1px solid #333', width: '12%' }}>일자</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '10%' }}>구분</th>
                <th style={{ padding: 10, border: '1px solid #333' }}>내용</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '18%' }}>금액</th>
                <th style={{ padding: 10, border: '1px solid #333', width: '18%' }}>잔액</th>
              </tr>
            </thead>
            <tbody>
              {(data.transactions || []).map((tx, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>{dayjs(tx.date).format('YYYY-MM-DD')}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'center' }}>
                    <span style={{
                      backgroundColor: getTypeColor(tx.type),
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10
                    }}>
                      {getTypeLabel(tx.type)}
                    </span>
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{tx.description}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right', color: tx.amount > 0 ? '#cf1322' : '#389e0d' }}>
                    {tx.amount > 0 ? '+' : ''}{formatNumber(tx.amount)}
                  </td>
                  <td style={{ padding: 8, border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatNumber(tx.balance)}
                  </td>
                </tr>
              ))}
              {data.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#999' }}>거래 내역이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 하단 안내 */}
          <div style={{ marginTop: 20, fontSize: 10, color: '#999', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: 15 }}>
            본 문서는 {data.printDate} 기준으로 작성되었습니다.
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CustomerBalancePrint;
