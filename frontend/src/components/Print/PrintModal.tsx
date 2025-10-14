import React, { useState } from 'react';
import { Modal, Button, message } from 'antd';
import PrintPreviewModal from './PrintPreviewModal';
import html2canvas from 'html2canvas';


interface PrintModalProps {
  open: boolean;
  onClose: () => void;
  transactionData: any;
  type: 'purchase' | 'sales';
}

export const PrintModal: React.FC<PrintModalProps> = ({
  open,
  onClose,
  transactionData,
  type
}) => {
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'full' | 'receiver' | 'supplier'>('full');

  const handlePreview = (mode: 'full' | 'receiver' | 'supplier') => {
    setPrintMode(mode);
    setPrintPreviewOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePrint = () => {
    // 현재 페이지에서 바로 인쇄를 위한 인쇄 스타일 추가
    const printStyles = `
      <style id="print-styles">
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }

          .preview-content,
          .preview-content *,
          .transaction-container,
          .transaction-container * {
            visibility: visible !important;
            display: block !important;
          }

          .preview-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .transaction-container {
            position: relative !important;
            width: 210mm !important;
            height: auto !important;
            margin: 0 auto !important;
            background: white !important;
            font-family: 'Malgun Gothic', Arial, sans-serif !important;
            font-size: 9pt !important;
            color: black !important;
            padding: 0 !important;
          }

          /* A4 용지 크기에 맞는 스타일 */
          @page {
            size: A4;
            margin: 10mm;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 9pt !important;
            display: table !important;
          }

          table, th, td {
            border: 1px solid #000 !important;
            display: table-cell !important;
          }

          th, td {
            padding: 2mm !important;
            text-align: center !important;
            vertical-align: middle !important;
            font-size: 8pt !important;
            color: black !important;
            background: white !important;
          }

          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: bold !important; }

          /* 거래명세서 헤더 스타일 */
          h1, h2, h3 {
            margin: 2mm 0 !important;
            font-size: 14pt !important;
            font-weight: bold !important;
            color: black !important;
            display: block !important;
          }

          /* 모든 div 요소가 제대로 표시되도록 */
          div {
            display: block !important;
            visibility: visible !important;
          }

          /* 배경색과 테두리 */
          .preview-content div[style*="background"] {
            background: white !important;
          }

          /* 파일액션 버튼들은 인쇄시 숨김 */
          .file-actions {
            display: none !important;
          }

          /* 모달 관련 요소들 숨김 */
          .ant-modal, .ant-modal-mask, .ant-modal-wrap {
            display: none !important;
          }
        }
      </style>
    `;

    // 기존 인쇄 스타일이 있으면 제거
    const existingPrintStyles = document.getElementById('print-styles');
    if (existingPrintStyles) {
      existingPrintStyles.remove();
    }

    // 새 인쇄 스타일 추가
    document.head.insertAdjacentHTML('beforeend', printStyles);

    try {
      // 바로 인쇄 실행
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      message.error('인쇄 중 오류가 발생했습니다.');
    } finally {
      // 인쇄 완료 후 스타일 제거
      setTimeout(() => {
        const printStyleElement = document.getElementById('print-styles');
        if (printStyleElement) {
          printStyleElement.remove();
        }
      }, 1000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveFile = async (format: string) => {
    const previewElement = document.querySelector('.preview-content') as HTMLElement;
    if (!previewElement) return;

    try {
      switch (format) {
        case 'pdf': {
          // PDF 저장을 위해 새 창에서 인쇄 다이얼로그 열기
          const pdfPrintWindow = window.open('', '_blank');
          if (!pdfPrintWindow) {
            message.error('팝업이 차단되었습니다. 팝업을 허용해주세요.');
            return;
          }

          const pdfContent = `
            <!DOCTYPE html>
            <html>
              <head>
                <title>거래명세서 PDF</title>
                <meta charset="utf-8">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: 'Malgun Gothic', sans-serif; font-size: 12px; background: white; }
                  .preview-content { padding: 20px; }
                  table { border-collapse: collapse; width: 100%; }
                  table, th, td { border: 1px solid #000; }
                  th, td { padding: 4px 6px; text-align: center; }
                  .text-left { text-align: left !important; }
                  .text-right { text-align: right !important; }
                  .font-bold { font-weight: bold; }
                </style>
              </head>
              <body>
                ${previewElement.innerHTML}
              </body>
            </html>
          `;

          pdfPrintWindow.document.write(pdfContent);
          pdfPrintWindow.document.close();
          pdfPrintWindow.onload = () => {
            setTimeout(() => {
              pdfPrintWindow.print();
            }, 500);
          };
          break;
        }

        case 'excel':
          // Excel 저장 로직
          console.log('Excel 저장 기능 구현 필요');
          break;

        case 'jpg':
        case 'png': {
          // 이미지 저장 로직
          const canvas = await html2canvas(previewElement, {
            background: '#ffffff',
            allowTaint: true,
            useCORS: true,
            width: previewElement.scrollWidth,
            height: previewElement.scrollHeight,
            scale: 2,
            scrollX: 0,
            scrollY: 0,
            windowWidth: previewElement.scrollWidth,
            windowHeight: previewElement.scrollHeight
          } as any);

          const link = document.createElement('a');
          link.download = `거래명세표_${new Date().getTime()}.${format}`;
          link.href = canvas.toDataURL(`image/${format}`, 1.0);
          link.click();
          break;
        }

        case 'clipboard': {
          // 클립보드 저장
          const clipboardCanvas = await html2canvas(previewElement, {
            background: '#ffffff',
            allowTaint: true,
            useCORS: true,
            width: previewElement.scrollWidth,
            height: previewElement.scrollHeight,
            scale: 2,
            scrollX: 0,
            scrollY: 0,
            windowWidth: previewElement.scrollWidth,
            windowHeight: previewElement.scrollHeight
          } as any);

          // Canvas를 Blob으로 변환
          clipboardCanvas.toBlob(async (blob) => {
            if (blob) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({
                    'image/png': blob
                  })
                ]);
                message.success('거래명세표가 클립보드에 복사되었습니다!');
              } catch (error) {
                console.error('클립보드 복사 실패:', error);
                message.error('클립보드 복사에 실패했습니다. 브라우저가 클립보드 기능을 지원하지 않습니다.');
              }
            }
          }, 'image/png', 1.0);
          break;
        }

        default:
          console.log(`${format} 저장 기능 구현 필요`);
      }
    } catch (error) {
      console.error('파일 저장 중 오류:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveMenuItems = [
    { key: 'pdf', label: 'PDF로 저장' },
    { key: 'excel', label: 'Excel로 저장' },
    { key: 'jpg', label: '이미지 JPG 저장' },
    { key: 'png', label: '이미지 PNG 저장' },
    { key: 'clipboard', label: '클립보드로 저장' }
  ];

  return (
    <>
      <Modal
        title="거래명세서 인쇄"
        open={open}
        onCancel={() => {
          onClose();
        }}
        maskClosable={true}
        keyboard={true}
        destroyOnHidden={true}
        footer={null}
        width="min(90vw, 500px)"
        style={{
          maxWidth: 'calc(100vw - 32px)',
          margin: '0 auto'
        }}
      >
        <div style={{
          padding: 'clamp(12px, 2vh, 20px) 0',
          fontSize: 'clamp(14px, 2vw, 16px)'
        }}>
          <div style={{ marginBottom: 'clamp(12px, 2vh, 20px)' }}>
            <h3 style={{
              fontSize: 'clamp(16px, 2.5vw, 18px)',
              margin: 0
            }}>
              인쇄 옵션을 선택하세요
            </h3>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(10px, 1.5vh, 15px)'
          }}>
            <Button
              size="large"
              block
              onClick={() => handlePreview('full')}
              style={{
                height: 'clamp(40px, 6vh, 50px)',
                fontSize: 'clamp(14px, 2vw, 16px)',
                padding: '0 16px'
              }}
            >
              전체 인쇄 (공급받는자 + 공급자 보관용)
            </Button>

            <Button
              size="large"
              block
              onClick={() => handlePreview('receiver')}
              style={{
                height: 'clamp(40px, 6vh, 50px)',
                fontSize: 'clamp(14px, 2vw, 16px)',
                padding: '0 16px'
              }}
            >
              공급받는자 보관용만 인쇄
            </Button>

            <Button
              size="large"
              block
              onClick={() => handlePreview('supplier')}
              style={{
                height: 'clamp(40px, 6vh, 50px)',
                fontSize: 'clamp(14px, 2vw, 16px)',
                padding: '0 16px'
              }}
            >
              공급자 보관용만 인쇄
            </Button>
          </div>
        </div>
      </Modal>


      {/* 인쇄 미리보기 모달 */}
      <PrintPreviewModal
        open={printPreviewOpen}
        onClose={() => {
          setPrintPreviewOpen(false);
          // 상태 초기화를 위해 약간의 지연을 둠
          setTimeout(() => {
            setPrintMode('full');
          }, 100);
        }}
        transactionData={transactionData}
        type={type}
        printMode={printMode}
      />
    </>
  );
};

export default PrintModal;