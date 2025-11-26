import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Space, message, Dropdown } from 'antd';
import { PrinterOutlined, DownloadOutlined, SendOutlined, DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { TransactionStatement } from './TransactionStatement';
import { SignatureModal } from './SignatureModal';
import { useAuthStore } from '../../stores/authStore';
import api from '../../utils/api';

interface ESignaturePreviewModalProps {
  open: boolean;
  onClose: () => void;
  transactionData: any;
  type: 'purchase' | 'sales';
  onSave?: () => void; // 저장 후 콜백
}

export const ESignaturePreviewModal: React.FC<ESignaturePreviewModalProps> = ({
  open,
  onClose,
  transactionData,
  type,
  onSave
}) => {
  const { currentBusiness } = useAuthStore();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [blinking, setBlinking] = useState(true);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // 모달이 열릴 때 서명 이미지 로드
  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 항상 transactionData에서 서명 이미지를 확인
      if (transactionData?.signatureImage) {
        console.log('서명 이미지 로드:', transactionData.signatureImage.substring(0, 50));
        setSignatureDataUrl(transactionData.signatureImage);
      } else {
        console.log('서명 이미지 없음');
        setSignatureDataUrl(null);
      }
    } else {
      // 모달이 닫힐 때 초기화
      setSignatureDataUrl(null);
    }
  }, [open, transactionData]);

  // 깜박이는 효과
  useEffect(() => {
    if (!signatureDataUrl && open) {
      const interval = setInterval(() => {
        setBlinking(prev => !prev);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [signatureDataUrl, open]);

  const handleSignatureBoxClick = () => {
    // 이미 서명된 경우 클릭 불가
    if (transactionData?.signedBy) {
      return;
    }
    setSignatureModalOpen(true);
  };

  const handleSignatureConfirm = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    setSignatureModalOpen(false);
    message.success('서명이 등록되었습니다');
  };

  const handleSend = async () => {
    if (!signatureDataUrl) {
      message.warning('먼저 서명을 입력해주세요');
      return;
    }

    if (!currentBusiness) {
      message.error('사업체 정보를 찾을 수 없습니다');
      return;
    }

    if (!transactionData?.id) {
      message.error('매출 정보를 찾을 수 없습니다');
      return;
    }

    try {
      setLoading(true);

      // 전자서명 API 호출
      const response = await api.post(
        `/businesses/${currentBusiness.id}/sales/${transactionData.id}/sign`,
        { signatureImage: signatureDataUrl }
      );

      if (response.data.success) {
        message.success('전자서명이 저장되었습니다');

        // 알림톡 자동 전송
        await sendAlimtalkAfterSign();

        // 저장 후 콜백 호출 (매출 목록 새로고침)
        if (onSave) {
          onSave();
        }

        // 모달 닫기
        handleClose();
      } else {
        message.error(response.data.message || '전자서명 저장에 실패했습니다');
      }
    } catch (error: any) {
      console.error('전자서명 저장 오류:', error);
      const errorMessage = error?.response?.data?.message || '전자서명 저장 중 오류가 발생했습니다';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 전자서명 후 알림톡 자동 전송
  const sendAlimtalkAfterSign = async () => {
    try {
      // Canvas를 이미지로 변환
      const canvas = await convertToCanvas();
      if (!canvas) return;

      // Canvas를 JPG Blob으로 변환 (PNG 대신 JPG 사용, 품질 95%)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        throw new Error('이미지 변환에 실패했습니다');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'statement.jpg');
      formData.append('salesId', transactionData.id.toString());

      // FormData를 전송할 때는 Content-Type을 브라우저가 자동으로 설정하도록 함 (boundary 포함)
      const uploadResponse = await api.post(
        `/businesses/${currentBusiness.id}/sales/${transactionData.id}/upload-statement`,
        formData
      );

      if (uploadResponse.data.success) {
        const imageUrl = uploadResponse.data.imageUrl;

        // 알림톡 전송
        const alimtalkResponse = await api.post(
          `/businesses/${currentBusiness.id}/sales/${transactionData.id}/send-alimtalk`,
          { imageUrl }
        );

        if (alimtalkResponse.data.success) {
          message.success('알림톡 전송이 완료되었습니다');
        }
      }
    } catch (error) {
      console.error('알림톡 자동 전송 오류:', error);
      // 에러가 발생해도 전자서명 저장은 완료되었으므로 사용자에게 알림만 표시
      message.warning('전자서명은 저장되었으나 알림톡 전송에 실패했습니다');
    }
  };

  const handleClose = () => {
    setSignatureDataUrl(null);
    onClose();
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    // 인쇄용 HTML 생성
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>전자서명 거래명세표</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Malgun Gothic', sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                position: relative;
              }
              .signature-box-overlay {
                position: absolute !important;
                top: 20px !important;
                left: 50px !important;
                z-index: 10 !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
              }
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
                .signature-box-overlay {
                  position: absolute !important;
                  top: 20px !important;
                  left: 50px !important;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();

      // 이미지 로드 대기 후 인쇄
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Canvas로 변환하는 공통 함수
  const convertToCanvas = async () => {
    if (!printRef.current) {
      message.error('내용을 찾을 수 없습니다');
      return null;
    }

    try {
      const element = printRef.current;

      // 캡처 전 원본 스타일 저장
      const originalStyle = element.style.cssText;
      const parentElement = element.parentElement;
      const originalParentStyle = parentElement?.style.cssText || '';

      // 캡처를 위해 임시로 스타일 변경 (전체 콘텐츠가 보이도록)
      element.style.overflow = 'visible';
      element.style.width = '794px'; // A4 width at 96dpi
      element.style.minWidth = '794px';
      element.style.maxWidth = 'none';

      if (parentElement) {
        parentElement.style.overflow = 'visible';
      }

      // 스타일 적용 대기
      await new Promise(resolve => setTimeout(resolve, 100));

      // 실제 크기 계산
      const captureWidth = element.scrollWidth || 794;
      const captureHeight = element.scrollHeight || 1123;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth + 100,
        windowHeight: captureHeight + 100,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.print-content') as HTMLElement;
          if (clonedElement) {
            clonedElement.style.overflow = 'visible';
            clonedElement.style.width = '794px';
            clonedElement.style.transform = 'none';
          }
        }
      });

      // 원본 스타일 복원
      element.style.cssText = originalStyle;
      if (parentElement) {
        parentElement.style.cssText = originalParentStyle;
      }

      return canvas;
    } catch (error) {
      console.error('Canvas 변환 오류:', error);
      message.error('이미지 변환 중 오류가 발생했습니다');
      return null;
    }
  };

  // PDF 다운로드
  const handleDownloadPDF = async () => {
    const canvas = await convertToCanvas();
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`거래명세표_${transactionData.companyName}_${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF 다운로드 완료');
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
      message.error('PDF 다운로드 중 오류가 발생했습니다');
    }
  };

  // JPG 다운로드
  const handleDownloadJPG = async () => {
    const canvas = await convertToCanvas();
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `거래명세표_${transactionData.companyName}_${new Date().toISOString().split('T')[0]}.jpg`;
          link.click();
          URL.revokeObjectURL(url);
          message.success('JPG 다운로드 완료');
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('JPG 다운로드 오류:', error);
      message.error('JPG 다운로드 중 오류가 발생했습니다');
    }
  };

  // PNG 다운로드
  const handleDownloadPNG = async () => {
    const canvas = await convertToCanvas();
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `거래명세표_${transactionData.companyName}_${new Date().toISOString().split('T')[0]}.png`;
          link.click();
          URL.revokeObjectURL(url);
          message.success('PNG 다운로드 완료');
        }
      }, 'image/png');
    } catch (error) {
      console.error('PNG 다운로드 오류:', error);
      message.error('PNG 다운로드 중 오류가 발생했습니다');
    }
  };

  // 클립보드 복사
  const handleCopyToClipboard = async () => {
    const canvas = await convertToCanvas();
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          message.success('클립보드에 복사되었습니다');
        }
      }, 'image/png');
    } catch (error) {
      console.error('클립보드 복사 오류:', error);
      message.error('클립보드 복사 중 오류가 발생했습니다');
    }
  };

  // 알림톡 재전송 (전자서명 완료 후)
  const handleResendAlimtalk = async () => {
    if (!currentBusiness) {
      message.error('사업체 정보를 찾을 수 없습니다');
      return;
    }

    if (!transactionData?.id) {
      message.error('매출 정보를 찾을 수 없습니다');
      return;
    }

    try {
      setLoading(true);

      // Canvas를 이미지로 변환
      const canvas = await convertToCanvas();
      if (!canvas) return;

      // Canvas를 JPG Blob으로 변환 (PNG 대신 JPG 사용, 품질 95%)
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        throw new Error('이미지 변환에 실패했습니다');
      }

      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'statement.jpg');
      formData.append('salesId', transactionData.id.toString());

      // FormData를 전송할 때는 Content-Type을 브라우저가 자동으로 설정하도록 함 (boundary 포함)
      const uploadResponse = await api.post(
        `/businesses/${currentBusiness.id}/sales/${transactionData.id}/upload-statement`,
        formData
      );

      if (uploadResponse.data.success) {
        const imageUrl = uploadResponse.data.imageUrl;

        // 알림톡 전송
        const alimtalkResponse = await api.post(
          `/businesses/${currentBusiness.id}/sales/${transactionData.id}/send-alimtalk`,
          { imageUrl }
        );

        if (alimtalkResponse.data.success) {
          message.success('알림톡이 재전송되었습니다');
          if (onSave) {
            onSave();
          }
        } else {
          message.error(alimtalkResponse.data.message || '알림톡 전송에 실패했습니다');
        }
      } else {
        message.error(uploadResponse.data.message || '이미지 업로드에 실패했습니다');
      }
    } catch (error: any) {
      console.error('알림톡 재전송 오류:', error);
      const errorMessage = error?.response?.data?.message || '알림톡 재전송 중 오류가 발생했습니다';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 다운로드 메뉴 아이템
  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: 'PDF',
      onClick: handleDownloadPDF
    },
    {
      key: 'jpg',
      label: 'JPG',
      onClick: handleDownloadJPG
    },
    {
      key: 'png',
      label: 'PNG',
      onClick: handleDownloadPNG
    },
    {
      key: 'clipboard',
      label: '클립보드 복사',
      onClick: handleCopyToClipboard
    }
  ];

  return (
    <>
      <Modal
        title="전자서명 거래명세표"
        open={open}
        onCancel={handleClose}
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
            padding: '20px',
            overflow: 'auto'
          }
        }}
        footer={
          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                size="large"
                disabled={loading}
              >
                인쇄
              </Button>
              <Dropdown menu={{ items: downloadMenuItems }} placement="top">
                <Button
                  icon={<DownloadOutlined />}
                  size="large"
                  disabled={loading}
                >
                  파일 저장 <DownOutlined />
                </Button>
              </Dropdown>
              {signatureDataUrl && !transactionData?.signedBy && (
                <Button
                  type="primary"
                  onClick={handleSend}
                  size="large"
                  loading={loading}
                >
                  전송 후 저장
                </Button>
              )}
              {transactionData?.signedBy && (
                <Button
                  icon={<SendOutlined />}
                  onClick={handleResendAlimtalk}
                  size="large"
                  loading={loading}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
                >
                  알림톡 재전송
                </Button>
              )}
              <Button onClick={handleClose} size="large" disabled={loading}>
                닫기
              </Button>
            </Space>
          </div>
        }
      >
        <div
          ref={printRef}
          className="print-content"
          style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            border: '1px solid #ddd',
            position: 'relative',
            width: '210mm',
            minHeight: 'auto',
            overflow: 'visible'
          }}
        >
          {/* 서명 네모칸 오버레이 - 우측 상단 */}
          <div
            className="signature-box-overlay"
            style={{
              position: 'absolute',
              top: '12px',
              right: '15px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#333',
              whiteSpace: 'nowrap'
            }}>
              서명(확인)자:
            </span>
            <div
              onClick={handleSignatureBoxClick}
              style={{
                width: '100px',
                height: '60px',
                border: signatureDataUrl ? '1px solid #d9d9d9' : `2px solid ${blinking ? '#1890ff' : '#52c41a'}`,
                backgroundColor: signatureDataUrl ? '#fff' : (blinking ? 'rgba(24, 144, 255, 0.1)' : 'rgba(82, 196, 26, 0.1)'),
                cursor: transactionData?.signedBy ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              {signatureDataUrl ? (
                <img
                  src={signatureDataUrl}
                  alt="서명"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '2px'
                  }}
                />
              ) : (
                <span style={{
                  fontSize: '12px',
                  color: blinking ? '#1890ff' : '#52c41a',
                  fontWeight: 'bold'
                }}>
                  서명란
                </span>
              )}
            </div>
          </div>

          <TransactionStatement
            data={transactionData}
            type={type}
            printMode="receiver"
            printOptions={{ hideBalance: false, hideAmounts: false, hideStorageLabel: true }}
            showActions={false}
          />
        </div>
      </Modal>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onConfirm={handleSignatureConfirm}
      />
    </>
  );
};

export default ESignaturePreviewModal;
