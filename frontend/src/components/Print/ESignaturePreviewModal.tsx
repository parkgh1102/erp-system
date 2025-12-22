import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Space, message, Dropdown, Input } from 'antd';
import { PrinterOutlined, DownloadOutlined, SendOutlined, DownOutlined, PhoneOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';
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

  // 알림톡 확인 모달 관련 state
  const [alimtalkModalOpen, setAlimtalkModalOpen] = useState(false);
  const [alimtalkPhoneNumber, setAlimtalkPhoneNumber] = useState('');

  // 모달이 열릴 때 서명 이미지 로드
  useEffect(() => {
    if (open) {
      // 모달이 열릴 때 항상 transactionData에서 서명 이미지를 확인
      if (transactionData?.signatureImage) {
        setSignatureDataUrl(transactionData.signatureImage);
      } else {
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

        // 저장 후 콜백 호출 (매출 목록 새로고침)
        if (onSave) {
          onSave();
        }

        // 알림톡 확인 모달 열기 (거래처 번호 기본값 설정)
        const customerPhone = transactionData?.companyPhone || '';
        setAlimtalkPhoneNumber(customerPhone);
        setAlimtalkModalOpen(true);
      } else {
        message.error(response.data.message || '전자서명 저장에 실패했습니다');
      }
    } catch (error: any) {
      console.error('전자서명 저장 오류:', error);
      let errorMessage = '전자서명 저장 중 오류가 발생했습니다';

      if (error?.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해 주세요.';
      } else if (error?.response?.status === 403) {
        errorMessage = '권한이 없습니다.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || '잘못된 요청입니다.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 알림톡 전송 (전화번호 지정 가능)
  const sendAlimtalkWithPhone = async (phoneNumber: string) => {
    if (!phoneNumber) {
      message.error('전화번호를 입력해주세요');
      return;
    }

    // 전화번호 형식 검증 (한국 전화번호)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    const phoneRegex = /^(01[0-9]|02|0[3-9][0-9])[0-9]{7,8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      message.error('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)');
      return;
    }

    try {
      setLoading(true);

      // Canvas를 이미지로 변환
      const canvas = await convertToCanvas();
      if (!canvas) {
        setLoading(false);
        return;
      }

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

        // 알림톡 전송 (전화번호 포함)
        const alimtalkResponse = await api.post(
          `/businesses/${currentBusiness.id}/sales/${transactionData.id}/send-alimtalk`,
          { imageUrl, phoneNumber }
        );

        if (alimtalkResponse.data.success) {
          message.success(`알림톡이 ${phoneNumber}로 전송되었습니다`);
          setAlimtalkModalOpen(false);
          handleClose();
        } else {
          message.error(alimtalkResponse.data.message || '알림톡 전송에 실패했습니다');
        }
      }
    } catch (error: any) {
      console.error('알림톡 전송 오류:', error);
      let errorMessage = '알림톡 전송 중 오류가 발생했습니다';

      if (error?.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해 주세요.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.message || '잘못된 요청입니다.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 알림톡 모달에서 전송 안함 선택
  const handleSkipAlimtalk = () => {
    setAlimtalkModalOpen(false);
    handleClose();
  };

  const handleClose = () => {
    setSignatureDataUrl(null);
    onClose();
  };

  const handlePrint = () => {
    if (!printRef.current) return;

    // 인쇄용 HTML 생성 (XSS 방어를 위해 DOMPurify로 sanitize)
    const printContent = DOMPurify.sanitize(printRef.current.innerHTML, {
      ALLOWED_TAGS: ['div', 'span', 'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'style', 'p', 'br', 'strong', 'b'],
      ALLOWED_ATTR: ['style', 'class', 'src', 'alt', 'width', 'height', 'colspan', 'rowspan']
    });
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
                top: 1.5px !important;
                left: 150px !important;
                z-index: 10 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 2px !important;
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
                  top: 1.5px !important;
                  left: 80px !important;
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
    } finally {
      // Canvas 메모리 해제
      canvas.width = 0;
      canvas.height = 0;
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
          // 메모리 정리
          setTimeout(() => {
            URL.revokeObjectURL(url);
            link.remove();
          }, 100);
          message.success('JPG 다운로드 완료');
        }
        // Canvas 메모리 해제
        canvas.width = 0;
        canvas.height = 0;
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('JPG 다운로드 오류:', error);
      message.error('JPG 다운로드 중 오류가 발생했습니다');
      // 에러 시에도 Canvas 메모리 해제
      canvas.width = 0;
      canvas.height = 0;
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
          // 메모리 정리
          setTimeout(() => {
            URL.revokeObjectURL(url);
            link.remove();
          }, 100);
          message.success('PNG 다운로드 완료');
        }
        // Canvas 메모리 해제
        canvas.width = 0;
        canvas.height = 0;
      }, 'image/png');
    } catch (error) {
      console.error('PNG 다운로드 오류:', error);
      message.error('PNG 다운로드 중 오류가 발생했습니다');
      // 에러 시에도 Canvas 메모리 해제
      canvas.width = 0;
      canvas.height = 0;
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

  // 알림톡 재전송 (전자서명 완료 후) - 번호 확인 모달 열기
  const handleResendAlimtalk = () => {
    if (!currentBusiness) {
      message.error('사업체 정보를 찾을 수 없습니다');
      return;
    }

    if (!transactionData?.id) {
      message.error('매출 정보를 찾을 수 없습니다');
      return;
    }

    // 알림톡 확인 모달 열기 (거래처 번호 기본값 설정)
    const customerPhone = transactionData?.companyPhone || '';
    setAlimtalkPhoneNumber(customerPhone);
    setAlimtalkModalOpen(true);
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
        width="min(95vw, 900px)"
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
          {/* 서명 네모칸 오버레이 - 좌측 상단 */}
          <div
            className="signature-box-overlay"
            style={{
              position: 'absolute',
              top: '1.5px',
              left: '150px',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#333',
              whiteSpace: 'nowrap'
            }}>
              서명(확인)자
            </span>
            <div
              onClick={handleSignatureBoxClick}
              style={{
                width: '80px',
                height: '50px',
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
                  fontSize: '10px',
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
            supplierInfo={currentBusiness ? {
              companyName: currentBusiness.companyName,
              businessNumber: currentBusiness.businessNumber,
              representative: currentBusiness.representative,
              address: currentBusiness.address,
              phone: currentBusiness.phone
            } : undefined}
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

      {/* 알림톡 전송 확인 모달 */}
      <Modal
        title="알림톡 전송"
        open={alimtalkModalOpen}
        onCancel={handleSkipAlimtalk}
        footer={null}
        width={400}
        centered
        maskClosable={false}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: 16, fontSize: 15 }}>
            알림톡을 보내시겠습니까?
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              <PhoneOutlined /> 수신 번호
            </label>
            <Input
              placeholder="전화번호 입력 (예: 010-1234-5678)"
              value={alimtalkPhoneNumber}
              onChange={(e) => setAlimtalkPhoneNumber(e.target.value)}
              size="large"
              style={{ fontSize: 16 }}
            />
            {transactionData?.companyPhone && (
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                거래처 등록 번호: {transactionData.companyPhone}
                {alimtalkPhoneNumber !== transactionData.companyPhone && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setAlimtalkPhoneNumber(transactionData.companyPhone)}
                  >
                    이 번호로 설정
                  </Button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={handleSkipAlimtalk} disabled={loading}>
              전송 안함
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => sendAlimtalkWithPhone(alimtalkPhoneNumber)}
              loading={loading}
              disabled={!alimtalkPhoneNumber}
            >
              전송
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ESignaturePreviewModal;
