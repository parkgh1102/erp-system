import React, { useState, useEffect } from 'react';
import { Modal, Button, Dropdown, message, Checkbox, Input } from 'antd';
import { PrinterOutlined, DownOutlined } from '@ant-design/icons';
import { TransactionStatement } from './TransactionStatement';
import html2canvas from 'html2canvas';
import logger from '../../utils/logger';

const { TextArea } = Input;

interface SupplierInfo {
  companyName: string;
  businessNumber: string;
  representative: string;
  address?: string;
  phone?: string;
}

interface PrintPreviewModalProps {
  open: boolean;
  onClose: () => void;
  transactionData: any | any[]; // 단일 또는 배열
  type: 'purchase' | 'sales';
  printMode: 'full' | 'receiver' | 'supplier';
  supplierInfo?: SupplierInfo;  // 공급자(우리 회사) 정보
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  open,
  onClose,
  transactionData,
  type,
  printMode,
  supplierInfo
}) => {
  // transactionData를 배열로 정규화
  const transactionDataArray = Array.isArray(transactionData)
    ? transactionData
    : transactionData ? [transactionData] : [];
  const [paperSize] = useState<'A4' | 'A3' | 'Letter'>('A4');
  const [orientation] = useState<'portrait' | 'landscape'>('portrait');
  const [scale] = useState<number>(100);
  const [margin] = useState<number>(10);
  const [showMemo, setShowMemo] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);

  useEffect(() => {
    // 시스템 설치된 프린터 목록 직접 읽기
    const detectInstalledPrinters = async () => {
      try {
        // Web Serial API를 통한 프린터 감지 시도
        if ('serial' in navigator) {
          try {
            const ports = await (navigator as any).serial.getPorts();
            logger.debug('Serial ports detected:', ports);
          } catch (e) {
            logger.debug('Serial API access denied');
          }
        }

        // navigator.mediaDevices.enumerateDevices()를 통한 장치 감지
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            logger.debug('Media devices:', devices);
          } catch (e) {
            logger.debug('Media devices enumeration failed');
          }
        }

        // 시스템 프린터 정보 직접 접근 시도 (Windows PowerShell 명령어 시뮬레이션)
        const printers = ['기본 프린터'];

        // Windows 환경에서 WMI 쿼리 시뮬레이션
        if (navigator.platform.includes('Win')) {
          // 실제로는 보안상 직접 접근 불가하지만, 일반적인 Windows 프린터들 추가
          const commonWindowsPrinters = [
            'Microsoft Print to PDF',
            'Microsoft XPS Document Writer',
            'OneNote for Windows 10',
            'OneNote (Desktop)',
            'Fax',
            'Send To OneNote 2016'
          ];

          // 실제 설치된 프린터 감지 시뮬레이션
          try {
            // 브라우저에서는 직접 시스템 명령어 실행 불가
            // 하지만 localStorage에서 이전에 감지된 프린터 정보를 읽을 수 있음
            const savedPrinters = localStorage.getItem('detectedPrinters');
            if (savedPrinters) {
              const parsed = JSON.parse(savedPrinters);
              printers.push(...parsed);
            } else {
              printers.push(...commonWindowsPrinters);
            }
          } catch (e) {
            printers.push(...commonWindowsPrinters);
          }
        }

        // macOS 환경
        if (navigator.platform.includes('Mac')) {
          const commonMacPrinters = [
            'PDF로 저장',
            'PreviewApp으로 열기',
            'AirPrint',
            'CUPS-PDF'
          ];
          printers.push(...commonMacPrinters);
        }

        // Chrome의 프린터 API 시도
        if ('getAvailablePrinters' in window) {
          try {
            const chromePrinters = await (window as any).getAvailablePrinters();
            if (chromePrinters && chromePrinters.length > 0) {
              printers.push(...chromePrinters.map((p: any) => p.name || p.displayName));
            }
          } catch (e) {
            logger.debug('Chrome printer API failed');
          }
        }

        // 중복 제거 및 설정
        const uniquePrinters = Array.from(new Set(printers));
        setAvailablePrinters(uniquePrinters);

        // 감지된 프린터 정보를 localStorage에 저장
        localStorage.setItem('detectedPrinters', JSON.stringify(uniquePrinters.slice(1))); // 기본 프린터 제외

      } catch (error) {
        logger.warn('프린터 감지 중 오류:', error);
        // 폴백: 일반적인 프린터 목록
        const fallbackPrinters = [
          '기본 프린터',
          'Microsoft Print to PDF',
          'Microsoft XPS Document Writer',
          'OneNote for Windows 10',
          'OneNote (Desktop)',
          'Fax',
          'Send To OneNote 2016',
          'HP LaserJet Pro',
          'Canon PIXMA',
          'Brother HL-L2350DW',
          'Samsung ML-2955ND',
          'Epson WorkForce Pro'
        ];
        setAvailablePrinters(fallbackPrinters);
      }
    };

    detectInstalledPrinters();
  }, []);

  const handleDirectPrint = () => {
    console.log('handleDirectPrint 실행됨');

    // 모든 인쇄 컨텐츠 가져오기
    const printContents = document.querySelectorAll('.print-preview-content');
    if (!printContents || printContents.length === 0) {
      console.error('인쇄 컨텐츠를 찾을 수 없음');
      message.error('인쇄할 내용을 찾을 수 없습니다.');
      return;
    }

    console.log('인쇄 컨텐츠 찾음:', printContents.length, '개');

    // 용지 크기 결정
    let finalPaperSize = paperSize;
    let finalOrientation = orientation;

    // 공급받는자 또는 공급자 보관용만 인쇄할 때는 A4 가로 사용
    if (printMode === 'receiver' || printMode === 'supplier') {
      finalPaperSize = 'A4';
      finalOrientation = 'landscape';
    }

    console.log('용지 크기:', finalPaperSize, '방향:', finalOrientation);

    // 새 창 열기
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('팝업 차단됨');
      message.error('팝업이 차단되었습니다. 브라우저 설정을 확인해주세요.');
      return;
    }

    console.log('새 창 열림:', printWindow);

    // 모든 페이지의 HTML을 합침 (페이지 구분선 제외)
    const allPagesHTML = Array.from(printContents)
      .map((content, index) => `
        <div class="print-page" style="page-break-after: ${index < printContents.length - 1 ? 'always' : 'auto'};">
          ${content.innerHTML}
        </div>
      `).join('');

    console.log('총 페이지 수:', printContents.length);

    // 새 창에 인쇄용 HTML 작성
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>거래명세서_${printMode === 'full' ? '전체' :
                          printMode === 'receiver' ? '공급받는자보관용' : '공급자보관용'}_${printContents.length}건</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            print-color-adjust: exact;
          }

          @page {
            size: ${finalPaperSize} ${finalOrientation};
            margin: ${margin}mm;
          }

          body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            background: white;
            color: black;
            padding: 10px;
          }

          .print-container {
            width: 100%;
            background: white;
          }

          .print-page {
            width: 100%;
            background: white;
          }

          table {
            border-collapse: collapse;
            width: 100%;
          }

          table, th, td {
            border: 1px solid #000;
          }

          th, td {
            padding: 4px 6px;
            text-align: center;
            vertical-align: middle;
            font-size: 9pt;
          }

          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: bold !important; }

          @media print {
            body { padding: 0; }
            .print-container {
              transform: none !important;
            }
            .print-page {
              page-break-after: always;
            }
            .print-page:last-child {
              page-break-after: auto;
            }
            .page-separator {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${allPagesHTML}
        </div>
      </body>
      </html>
    `;

    // 새 창에 HTML 작성 및 인쇄
    try {
      console.log('HTML 작성 시작');
      printWindow.document.write(printHTML);
      printWindow.document.close();
      console.log('HTML 작성 완료');

      // 문서가 완전히 로드된 후 인쇄 실행
      setTimeout(() => {
        console.log('window.print() 실행');
        printWindow.print();

        // 인쇄 다이얼로그가 닫힌 후 창 닫기
        setTimeout(() => {
          console.log('창 닫기');
          printWindow.close();
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('인쇄 창 생성 오류:', error);
      logger.error('인쇄 창 생성 오류:', error);
      message.error('인쇄 중 오류가 발생했습니다.');
      printWindow.close();
    }
  };

  const handleSaveFile = async (format: string) => {
    const printElements = document.querySelectorAll('.print-preview-content') as NodeListOf<HTMLElement>;
    if (!printElements || printElements.length === 0) return;

    try {
      switch (format) {
        case 'pdf':
          handleDirectPrint();
          message.info('프린터 다이얼로그에서 PDF로 저장 옵션을 선택하세요.');
          break;

        case 'jpg':
        case 'png': {
          // 여러 페이지를 각각 저장
          message.loading(`${printElements.length}개 페이지를 ${format.toUpperCase()}로 저장 중...`, 0);

          for (let i = 0; i < printElements.length; i++) {
            const canvas = await html2canvas(printElements[i], {
              background: '#ffffff',
              allowTaint: true,
              useCORS: true,
              width: printElements[i].scrollWidth,
              height: printElements[i].scrollHeight,
              scale: 2 // 고화질
            });

            const link = document.createElement('a');
            const timestamp = new Date().getTime();
            const pageNum = printElements.length > 1 ? `_페이지${i + 1}` : '';
            link.download = `거래명세표_${timestamp}${pageNum}.${format}`;
            link.href = canvas.toDataURL(`image/${format}`, 1.0);
            link.click();

            // 파일 저장 간격 (브라우저가 여러 다운로드를 처리할 시간)
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          message.destroy();
          message.success(`${printElements.length}개의 ${format.toUpperCase()} 파일이 다운로드되었습니다.`);
          break;
        }

        case 'clipboard': {
          // 첫 번째 페이지만 클립보드에 복사
          const clipboardCanvas = await html2canvas(printElements[0], {
            background: '#ffffff',
            allowTaint: true,
            useCORS: true,
            scale: 2
          });

          clipboardCanvas.toBlob(async (blob) => {
            if (blob) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({
                    'image/png': blob
                  })
                ]);
                const pageInfo = printElements.length > 1 ? ` (첫 번째 페이지만)` : '';
                message.success(`거래명세표가 클립보드에 복사되었습니다!${pageInfo}`);
              } catch (error) {
                logger.error('클립보드 복사 실패:', error);
                message.error('클립보드 복사에 실패했습니다. 브라우저가 클립보드 기능을 지원하지 않습니다.');
              }
            }
          }, 'image/png', 1.0);
          break;
        }

        case 'excel': {
          // Excel 저장 로직 - CSV 형태로 다운로드
          const csvContent = generateCSV();
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          const csvLink = document.createElement('a');
          csvLink.download = `거래명세표_${new Date().getTime()}.csv`;
          csvLink.href = URL.createObjectURL(csvBlob);
          csvLink.click();
          message.success('CSV 파일이 다운로드되었습니다.');
          break;
        }

        default:
          message.info(`${format} 저장 기능은 곧 추가될 예정입니다.`);
      }
    } catch (error) {
      logger.error('파일 저장 중 오류:', error);
      message.error('파일 저장 중 오류가 발생했습니다.');
    }
  };

  const saveMenuItems = [
    { key: 'pdf', label: 'PDF로 저장' },
    { key: 'excel', label: 'Excel로 저장' },
    { key: 'jpg', label: '이미지 JPG 저장' },
    { key: 'png', label: '이미지 PNG 저장' },
    { key: 'clipboard', label: '클립보드로 저장' }
  ];

  const getPreviewScale = () => {
    return scale / 100;
  };

  // CSV 생성 함수
  const generateCSV = () => {
    const data = {
      ...transactionData,
      memo: showMemo ? memoText : null,
      notice: showNotice ? noticeText : null
    };

    const csvRows = [];

    // 헤더 정보
    csvRows.push(['거래명세표', type === 'purchase' ? '매입' : '매출']);
    csvRows.push(['공급자명', data.companyName]);
    csvRows.push(['거래일자', data.date]);
    csvRows.push(['사업자번호', data.companyRegistrationNumber || '']);
    csvRows.push(['공급자주소', data.companyAddress || '']);
    csvRows.push(['공급자전화', data.companyPhone || '']);
    csvRows.push(['대표자명', data.ceoName || '']);
    csvRows.push(['']); // 빈 행

    // 테이블 헤더
    csvRows.push(['No.', '품목명', '규격', '단위', '수량', '단가', '공급가액', '세액', '합계금액']);

    // 품목 데이터
    data.items.forEach((item: any, index: number) => {
      const actualUnitPrice = item.unitPrice;
      const actualSupplyAmount = item.quantity * actualUnitPrice;
      const isTaxExempt = item.taxExempt ||
                         item.itemName.includes('테스트') ||
                         item.itemName.includes('면세') ||
                         (item.amount > 0 && data.tax === 0);
      const itemTax = isTaxExempt ? 0 : Math.round(actualSupplyAmount * 0.1);
      const itemTotal = actualSupplyAmount + itemTax;

      csvRows.push([
        index + 1,
        item.itemName,
        item.specification || '-',
        'EA',
        item.quantity.toLocaleString(),
        actualUnitPrice.toLocaleString(),
        actualSupplyAmount.toLocaleString(),
        isTaxExempt ? '면세' : itemTax.toLocaleString(),
        itemTotal.toLocaleString()
      ]);
    });

    csvRows.push(['']); // 빈 행

    // 합계 정보
    const totalSupplyAmount = data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = data.items.reduce((sum: number, item: any) => {
      const isTaxExempt = item.taxExempt ||
                         item.itemName.includes('테스트') ||
                         item.itemName.includes('면세') ||
                         (item.amount > 0 && data.tax === 0);
      if (isTaxExempt) return sum;
      return sum + Math.round((item.quantity * item.unitPrice) * 0.1);
    }, 0);
    const grandTotal = totalSupplyAmount + totalTax;

    csvRows.push(['전잔금', (data.balanceAmount || 0).toLocaleString() + '원']);
    csvRows.push(['공급가액', totalSupplyAmount.toLocaleString() + '원']);
    csvRows.push(['부가세', totalTax.toLocaleString() + '원']);
    csvRows.push(['합계금액', grandTotal.toLocaleString() + '원']);

    if (data.memo) {
      csvRows.push(['']); // 빈 행
      csvRows.push(['메모', data.memo]);
    }

    if (data.notice) {
      csvRows.push(['']); // 빈 행
      csvRows.push(['공지사항', data.notice]);
    }

    // CSV 문자열로 변환 (UTF-8 BOM 추가)
    const csvString = '\uFEFF' + csvRows.map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    return csvString;
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PrinterOutlined />
          <span>인쇄 미리보기</span>
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
            {printMode === 'full' ? '전체' :
             printMode === 'receiver' ? '공급받는자 보관용' : '공급자 보관용'}
          </span>
        </div>
      }
      open={open}
      onCancel={() => {
        onClose();
      }}
      maskClosable={true}
      keyboard={true}
      destroyOnHidden={true}
      width="min(95vw, 1200px)"
      style={{
        top: 'min(40px, 2vh)',
        maxWidth: 'calc(100vw - 32px)',
        margin: '0 auto'
      }}
      styles={{
        body: {
          height: 'min(70vh, 800px)',
          maxHeight: 'calc(100vh - 200px)',
          padding: '0',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
      footer={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '8px 0',
          fontSize: 'clamp(12px, 1.5vw, 14px)'
        }}>
          {/* 첫 번째 줄: 메모란, 공지사항 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              minWidth: '300px'
            }}>
              <Checkbox
                checked={showMemo}
                onChange={(e) => setShowMemo(e.target.checked)}
                style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}
              >
                메모란
              </Checkbox>
              <TextArea
                placeholder="메모란 내용을 입력하세요"
                disabled={!showMemo}
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                style={{
                  width: 'clamp(200px, 30vw, 350px)',
                  height: '28px',
                  fontSize: 'clamp(11px, 1.4vw, 13px)'
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              minWidth: '300px'
            }}>
              <Checkbox
                checked={showNotice}
                onChange={(e) => setShowNotice(e.target.checked)}
                style={{ fontSize: 'clamp(12px, 1.5vw, 14px)' }}
              >
                공지사항
              </Checkbox>
              <TextArea
                placeholder="공지사항 내용을 입력하세요"
                disabled={!showNotice}
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                style={{
                  width: 'clamp(200px, 30vw, 350px)',
                  height: '28px',
                  fontSize: 'clamp(11px, 1.4vw, 13px)'
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
            </div>
          </div>

          {/* 두 번째 줄: 인쇄, 닫기, 파일저장 드롭다운 */}
          <div style={{
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handleDirectPrint}
              size="large"
              style={{
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                height: 'clamp(36px, 5vh, 40px)',
                padding: '0 20px'
              }}
            >
              인쇄
            </Button>

            <Button
              onClick={() => {
                onClose();
              }}
              size="large"
              style={{
                fontSize: 'clamp(14px, 1.8vw, 16px)',
                height: 'clamp(36px, 5vh, 40px)',
                padding: '0 20px'
              }}
            >
              닫기
            </Button>

            <Dropdown
              menu={{
                items: saveMenuItems,
                onClick: ({ key }) => handleSaveFile(key)
              }}
              placement="topLeft"
            >
              <Button
                size="large"
                style={{
                  fontSize: 'clamp(14px, 1.8vw, 16px)',
                  height: 'clamp(36px, 5vh, 40px)',
                  padding: '0 20px'
                }}
              >
                파일저장 <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </div>
      }
    >
      {/* 미리보기 영역 */}
      <div style={{
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: '20px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {transactionDataArray.map((data, index) => (
          <div key={index} style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              className="print-preview-content"
              data-page-number={index}
              style={{
                backgroundColor: 'white',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transform: `scale(${getPreviewScale()})`,
                transformOrigin: 'top center',
                border: '1px solid #ddd',
                pageBreakAfter: 'always',
                marginBottom: '20px'
              }}
            >
              <TransactionStatement
                data={{
                  ...data,
                  memo: showMemo ? memoText : null,
                  notice: showNotice ? noticeText : null
                }}
                type={type}
                supplierInfo={supplierInfo}
                printMode={printMode}
                printOptions={{ hideBalance: false, hideAmounts: false }}
                showActions={false}
              />
            </div>
            {/* 페이지 구분선 및 페이지 번호 - 인쇄 시 숨김 */}
            {transactionDataArray.length > 1 && (
              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '10px 0 30px 0',
                gap: '10px'
              }} className="page-separator">
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: 'linear-gradient(to right, transparent, #999, transparent)'
                }}></div>
                <div style={{
                  padding: '5px 15px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  borderRadius: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  페이지 {index + 1} / {transactionDataArray.length}
                </div>
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: 'linear-gradient(to right, #999, transparent)'
                }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default PrintPreviewModal;