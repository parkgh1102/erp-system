import React, { useRef } from 'react';
import { Modal, Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TaxInvoiceItem {
  date: string;
  productName: string;
  spec?: string;
  quantity: number;
  unitPrice: number;
  supplyAmount: number;
  vatAmount: number;
}

interface TaxInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  invoiceType: 'sales' | 'purchase';
  supplier: {
    companyName: string;
    businessNumber: string;
    representative: string;
    address?: string;
    businessType?: string;
    businessCategory?: string;
  };
  receiver: {
    companyName: string;
    businessNumber: string;
    representative?: string;
    address?: string;
    businessType?: string;
    businessCategory?: string;
  };
  items: TaxInvoiceItem[];
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
}

interface TaxInvoicePrintProps {
  open: boolean;
  onClose: () => void;
  data: TaxInvoiceData | null;
}

const TaxInvoicePrint: React.FC<TaxInvoicePrintProps> = ({ open, onClose, data }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `세금계산서_${data.invoiceNumber}_${dayjs().format('YYYYMMDD')}.png`;
      link.href = canvas.toDataURL();
      link.click();
      message.success('이미지가 다운로드되었습니다.');
    } catch (error) {
      message.error('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#fff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`세금계산서_${data.invoiceNumber}_${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF가 다운로드되었습니다.');
    } catch (error) {
      message.error('PDF 다운로드에 실패했습니다.');
    }
  };

  const downloadMenuItems = [
    { key: 'pdf', label: 'PDF 저장', icon: <FilePdfOutlined />, onClick: handleDownloadPDF },
    { key: 'image', label: '이미지 저장', icon: <FileImageOutlined />, onClick: handleDownloadImage },
  ];

  // 빈 행 채우기 (최소 4행)
  const emptyRows = Math.max(0, 4 - (data.items?.length || 0));

  return (
    <Modal
      title="세금계산서 인쇄 미리보기"
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Dropdown menu={{ items: downloadMenuItems }} placement="topLeft">
            <Button icon={<DownloadOutlined />}>저장</Button>
          </Dropdown>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>인쇄</Button>
          <Button onClick={onClose}>닫기</Button>
        </Space>
      }
    >
      <div ref={printRef} style={{ padding: 20, backgroundColor: '#fff', fontFamily: 'Malgun Gothic, sans-serif' }}>
        {/* 제목 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 'bold', margin: 0, letterSpacing: 8 }}>세 금 계 산 서</h1>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>(공급받는자 보관용)</div>
        </div>

        {/* 메인 테이블 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: 11 }}>
          <tbody>
            {/* 공급자/공급받는자 헤더 */}
            <tr>
              <td style={{ width: '50%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#e8f4fd' }}>
                      <td colSpan={4} style={{ textAlign: 'center', fontWeight: 'bold', padding: 6, borderBottom: '1px solid #000' }}>공 급 자</td>
                    </tr>
                    <tr>
                      <td style={{ width: '25%', padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>등록번호</td>
                      <td colSpan={3} style={{ padding: 4, borderBottom: '1px solid #000', fontWeight: 'bold', letterSpacing: 2 }}>{data.supplier.businessNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>상호</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{data.supplier.companyName}</td>
                      <td style={{ width: '15%', padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>성명</td>
                      <td style={{ padding: 4, borderBottom: '1px solid #000' }}>{data.supplier.representative} (인)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>사업장주소</td>
                      <td colSpan={3} style={{ padding: 4, borderBottom: '1px solid #000', fontSize: 10 }}>{data.supplier.address || ''}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', backgroundColor: '#f5f5f5' }}>업태</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000' }}>{data.supplier.businessType || ''}</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000', backgroundColor: '#f5f5f5' }}>종목</td>
                      <td style={{ padding: 4 }}>{data.supplier.businessCategory || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td style={{ width: '50%', border: '1px solid #000', padding: 0, verticalAlign: 'top' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ backgroundColor: '#fff3e0' }}>
                      <td colSpan={4} style={{ textAlign: 'center', fontWeight: 'bold', padding: 6, borderBottom: '1px solid #000' }}>공 급 받 는 자</td>
                    </tr>
                    <tr>
                      <td style={{ width: '25%', padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>등록번호</td>
                      <td colSpan={3} style={{ padding: 4, borderBottom: '1px solid #000', fontWeight: 'bold', letterSpacing: 2 }}>{data.receiver.businessNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>상호</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000' }}>{data.receiver.companyName}</td>
                      <td style={{ width: '15%', padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>성명</td>
                      <td style={{ padding: 4, borderBottom: '1px solid #000' }}>{data.receiver.representative || ''}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', borderBottom: '1px solid #000', backgroundColor: '#f5f5f5' }}>사업장주소</td>
                      <td colSpan={3} style={{ padding: 4, borderBottom: '1px solid #000', fontSize: 10 }}>{data.receiver.address || ''}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: 4, borderRight: '1px solid #000', backgroundColor: '#f5f5f5' }}>업태</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000' }}>{data.receiver.businessType || ''}</td>
                      <td style={{ padding: 4, borderRight: '1px solid #000', backgroundColor: '#f5f5f5' }}>종목</td>
                      <td style={{ padding: 4 }}>{data.receiver.businessCategory || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 작성일자 및 금액 */}
            <tr>
              <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', backgroundColor: '#f5f5f5', textAlign: 'center' }}>작성일자</td>
                      <td style={{ width: '20%', padding: 6, borderRight: '1px solid #000', textAlign: 'center' }}>{dayjs(data.issueDate).format('YYYY년 MM월 DD일')}</td>
                      <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', backgroundColor: '#f5f5f5', textAlign: 'center' }}>공급가액</td>
                      <td style={{ width: '20%', padding: 6, borderRight: '1px solid #000', textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(data.supplyAmount)}</td>
                      <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', backgroundColor: '#f5f5f5', textAlign: 'center' }}>세액</td>
                      <td style={{ padding: 6, textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(data.vatAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 품목 헤더 */}
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>월일</td>
                      <td style={{ width: '30%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>품목</td>
                      <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>규격</td>
                      <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>수량</td>
                      <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>단가</td>
                      <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold' }}>공급가액</td>
                      <td style={{ width: '10%', padding: 6, textAlign: 'center', fontWeight: 'bold' }}>세액</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 품목 목록 */}
            {(data.items || []).map((item, index) => (
              <tr key={index}>
                <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'center' }}>{dayjs(item.date).format('MM/DD')}</td>
                        <td style={{ width: '30%', padding: 6, borderRight: '1px solid #000' }}>{item.productName}</td>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'center' }}>{item.spec || ''}</td>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000', textAlign: 'right' }}>{formatNumber(item.quantity)}</td>
                        <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', textAlign: 'right' }}>{formatNumber(item.unitPrice)}</td>
                        <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000', textAlign: 'right' }}>{formatNumber(item.supplyAmount)}</td>
                        <td style={{ width: '10%', padding: 6, textAlign: 'right' }}>{formatNumber(item.vatAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}

            {/* 빈 행 */}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <tr key={`empty-${index}`}>
                <td colSpan={2} style={{ padding: 0, border: '1px solid #000' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '30%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '10%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '15%', padding: 6, borderRight: '1px solid #000' }}>&nbsp;</td>
                        <td style={{ width: '10%', padding: 6 }}>&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            ))}

            {/* 합계 */}
            <tr style={{ backgroundColor: '#e3f2fd' }}>
              <td colSpan={2} style={{ padding: 0, border: '2px solid #000' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '50%', padding: 8, borderRight: '1px solid #000', textAlign: 'center', fontWeight: 'bold', fontSize: 13 }}>합계금액</td>
                      <td style={{ width: '25%', padding: 8, borderRight: '1px solid #000', textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>공급가액: {formatNumber(data.supplyAmount)}</td>
                      <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>세액: {formatNumber(data.vatAmount)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: 10, textAlign: 'center', fontWeight: 'bold', fontSize: 16, color: '#1565c0' }}>
                        총 합계: ₩{formatNumber(data.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 비고 */}
            {data.memo && (
              <tr>
                <td colSpan={2} style={{ padding: 8, border: '1px solid #000' }}>
                  <strong>비고:</strong> {data.memo}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 하단 안내문 */}
        <div style={{ marginTop: 16, fontSize: 10, color: '#666', textAlign: 'center' }}>
          이 계산서는 부가가치세법에 의하여 교부하는 것입니다.
        </div>
      </div>
    </Modal>
  );
};

export default TaxInvoicePrint;
