import React, { useState } from 'react';
import { Modal, Upload, Button, message, Table, Alert, Space, Divider } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as ExcelJS from 'exceljs';

const { Dragger } = Upload;

interface ExcelUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: any[]) => void;
  title: string;
  templateType: 'customer' | 'product' | 'sales' | 'purchase' | 'payment';
  description: string;
  requiredFields: string[];
}

const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  title,
  templateType,
  description,
  requiredFields
}) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // 템플릿 데이터 정의
  const sampleTemplates = {
    customer: [
      {
        거래처코드: 'C0001',
        거래처명: '샘플거래처',
        사업자번호: '123-45-67890',
        대표자: '홍길동',
        전화번호: '02-123-4567',
        주소: '서울시 강남구 테헤란로 123',
        이메일: 'sample@company.com',
        비고: '샘플 거래처입니다'
      }
    ],
    product: [
      {
        상품코드: 'P0001',
        상품명: '샘플상품',
        카테고리: '일반',
        단위: 'EA',
        매입가격: 4500,
        판매가격: 5000,
        재고수량: 100,
        안전재고: 10,
        비고: '샘플 상품입니다'
      }
    ],
    sales: [
      {
        거래처명: '샘플거래처',
        매출일자: '2024-01-15',
        상품명: '샘플상품',
        수량: 10,
        단가: 5000,
        금액: 50000,
        비고: '샘플 매출입니다'
      }
    ],
    purchase: [
      {
        거래처명: '샘플거래처',
        매입일자: '2024-01-15',
        상품명: '샘플상품',
        수량: 10,
        단가: 4500,
        금액: 45000,
        비고: '샘플 매입입니다'
      }
    ],
    payment: [
      {
        거래처명: '샘플거래처',
        유형: '수금',
        금액: 50000,
        결제일자: '2024-01-15',
        결제방법: '현금',
        비고: '매출대금 수금'
      }
    ]
  };

  // 컬럼 정의
  const columnMappings = {
    customer: [
      { title: '거래처코드', dataIndex: '거래처코드', key: '거래처코드' },
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명' },
      { title: '사업자번호', dataIndex: '사업자번호', key: '사업자번호' },
      { title: '대표자', dataIndex: '대표자', key: '대표자' },
      { title: '전화번호', dataIndex: '전화번호', key: '전화번호' },
      { title: '주소', dataIndex: '주소', key: '주소' },
      { title: '이메일', dataIndex: '이메일', key: '이메일' },
      { title: '비고', dataIndex: '비고', key: '비고' }
    ],
    product: [
      { title: '상품코드', dataIndex: '상품코드', key: '상품코드' },
      { title: '상품명', dataIndex: '상품명', key: '상품명' },
      { title: '카테고리', dataIndex: '카테고리', key: '카테고리' },
      { title: '단위', dataIndex: '단위', key: '단위' },
      { title: '매입가격', dataIndex: '매입가격', key: '매입가격', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '판매가격', dataIndex: '판매가격', key: '판매가격', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '재고수량', dataIndex: '재고수량', key: '재고수량' },
      { title: '안전재고', dataIndex: '안전재고', key: '안전재고' },
      { title: '비고', dataIndex: '비고', key: '비고' }
    ],
    sales: [
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명' },
      { title: '매출일자', dataIndex: '매출일자', key: '매출일자' },
      { title: '상품명', dataIndex: '상품명', key: '상품명' },
      { title: '수량', dataIndex: '수량', key: '수량' },
      { title: '단가', dataIndex: '단가', key: '단가', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '금액', dataIndex: '금액', key: '금액', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '비고', dataIndex: '비고', key: '비고' }
    ],
    purchase: [
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명' },
      { title: '매입일자', dataIndex: '매입일자', key: '매입일자' },
      { title: '상품명', dataIndex: '상품명', key: '상품명' },
      { title: '수량', dataIndex: '수량', key: '수량' },
      { title: '단가', dataIndex: '단가', key: '단가', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '금액', dataIndex: '금액', key: '금액', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '비고', dataIndex: '비고', key: '비고' }
    ],
    payment: [
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명' },
      { title: '유형', dataIndex: '유형', key: '유형' },
      { title: '금액', dataIndex: '금액', key: '금액', render: (val: any) => val?.toLocaleString() + '원' },
      { title: '결제일자', dataIndex: '결제일자', key: '결제일자' },
      { title: '결제방법', dataIndex: '결제방법', key: '결제방법' },
      { title: '비고', dataIndex: '비고', key: '비고' }
    ]
  };

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    const data = sampleTemplates[templateType];
    const headers = Object.keys(data[0]);

    // 헤더 추가
    worksheet.addRow(headers);

    // 헤더 스타일 설정
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // 샘플 데이터 추가
    data.forEach(row => {
      worksheet.addRow(Object.values(row));
    });

    // 컬럼 너비 자동 조정
    worksheet.columns.forEach((column, index) => {
      if (column) {
        column.width = Math.max(headers[index]?.length || 10, 15) + 2;
      }
    });

    const typeNames = {
      customer: '거래처',
      product: '상품',
      sales: '매출',
      purchase: '매입',
      payment: '수금지급'
    };

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${typeNames[templateType]}_업로드_템플릿.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success('템플릿 파일이 다운로드되었습니다.');
  };

  const handleFileUpload = async (file: File) => {
    setLoading(true);

    return new Promise<boolean>((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            message.error('엑셀 파일의 첫 번째 시트를 읽을 수 없습니다.');
            resolve(false);
            return;
          }

          const jsonData: any[] = [];
          const headers: string[] = [];

          // 헤더 읽기
          worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = cell.text;
          });

          // 데이터 읽기
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // 헤더 제외
              const rowData: any = {};
              row.eachCell((cell, colNumber) => {
                if (headers[colNumber - 1]) {
                  let value = cell.value;
                  if (value && typeof value === 'object') {
                    if (value instanceof Date) {
                      value = value.toISOString().split('T')[0];
                    } else if ('richText' in value && Array.isArray((value as any).richText)) {
                      value = (value as any).richText.map((rt: any) => rt.text || '').join('');
                    } else if ('text' in value && typeof (value as any).text === 'string') {
                      value = (value as any).text;
                    } else {
                      value = String(value);
                    }
                  }
                  rowData[headers[colNumber - 1]] = value;
                }
              });
              if (Object.keys(rowData).length > 0) {
                jsonData.push(rowData);
              }
            }
          });

          if (jsonData.length === 0) {
            message.error('파일에 데이터가 없습니다.');
            resolve(false);
            return;
          }

          // 필수 필드 검증
          const errors: string[] = [];
          jsonData.forEach((row, index) => {
            requiredFields.forEach(field => {
              if (!row[field]) {
                errors.push(`${index + 1}행 ${field} 필수값이 누락되었습니다.`);
              }
            });
          });

          if (errors.length > 0) {
            message.error(`데이터 검증 실패: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? ' 등' : ''}`);
            resolve(false);
            return;
          }

          setPreviewData(jsonData);
          message.success(`${jsonData.length}건의 데이터를 미리보기로 불러왔습니다.`);
          resolve(false);
        } catch (error) {
          console.error('File read error:', error);
          message.error('파일을 읽는 중 오류가 발생했습니다.');
          resolve(false);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        message.error('파일 읽기 실패');
        setLoading(false);
        resolve(false);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = () => {
    if (previewData.length === 0) {
      message.error('업로드할 데이터가 없습니다.');
      return;
    }

    onSuccess(previewData);
    handleCancel();
  };

  const handleCancel = () => {
    setPreviewData([]);
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleCancel}
      width={900}
      style={{ top: 20 }}
      styles={{
        body: { maxHeight: '70vh', overflow: 'auto' }
      }}
      destroyOnHidden={true}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          취소
        </Button>,
        <Button
          key="upload"
          type="primary"
          onClick={handleUpload}
          loading={loading}
          disabled={previewData.length === 0}
        >
          업로드 ({previewData.length}건)
        </Button>,
      ]}
    >
      <Alert
        message={title}
        description={description}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="dashed"
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
        >
          템플릿 다운로드
        </Button>
      </Space>

      <Dragger
        accept=".xlsx,.xls,.csv"
        beforeUpload={handleFileUpload}
        showUploadList={false}
        style={{ marginBottom: 16 }}
        disabled={loading}
      >
        <p className="ant-upload-drag-icon">
          <FileExcelOutlined />
        </p>
        <p className="ant-upload-text">엑셀 파일을 드래그하거나 클릭하여 업로드하세요</p>
        <p className="ant-upload-hint">
          .xlsx, .xls, .csv 형식의 파일을 지원합니다.
        </p>
      </Dragger>

      {previewData.length > 0 && (
        <>
          <Divider>미리보기 ({previewData.length}건)</Divider>
          <Table
            columns={columnMappings[templateType]}
            dataSource={previewData.map((item, index) => ({ ...item, key: index }))}
            scroll={{ x: true, y: 300 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            size="small"
          />
        </>
      )}
    </Modal>
  );
};

export default ExcelUploadModal;