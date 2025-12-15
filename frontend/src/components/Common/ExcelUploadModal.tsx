import React, { useState } from 'react';
import { Modal, Upload, Button, App, Table, Alert, Space, Divider } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import * as ExcelJS from 'exceljs';

const { Dragger } = Upload;

interface ExcelUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (data: any[]) => void;
  title: string;
  templateType: 'customer' | 'product' | 'sales' | 'purchase' | 'payment' | 'receivable' | 'payable';
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
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // 템플릿 데이터 정의
  const sampleTemplates = {
    customer: [
      {
        거래처코드: 'C001',
        거래처명: '예시거래처',
        사업자번호: '123-45-67890',
        주소: '서울시 강남구',
        업태: '도소매',
        종목: '사무용품',
        대표자: '홍길동',
        전화번호: '02-1234-5678',
        팩스번호: '02-1234-5679',
        이메일: 'example@email.com',
        담당자연락처: '010-1234-5678',
        거래처구분: '매출처',
        활성여부: 'Y'
      }
    ],
    product: [
      {
        품목코드: 'P001',
        품목명: '예시품목',
        규격: 'A4',
        단위: 'EA',
        매입단가: 10000,
        매출단가: 15000,
        분류: '사무용품',
        세금구분: 'tax_separate',
        비고: '',
        활성여부: 'Y'
      }
    ],
    sales: [
      {
        매출일자: '2025-01-01',
        거래처명: '예시거래처',
        품목명: '예시품목',
        규격: 'A4',
        단위: 'EA',
        수량: 10,
        단가: 15000,
        공급가액: 150000,
        세액: 15000,
        합계: 165000,
        비고: ''
      }
    ],
    purchase: [
      {
        매입일자: '2025-01-01',
        거래처명: '예시거래처',
        품목명: '예시품목',
        규격: 'A4',
        단위: 'EA',
        수량: 10,
        단가: 10000,
        공급가액: 100000,
        세액: 10000,
        합계: 110000,
        비고: ''
      }
    ],
    receivable: [
      {
        'No.': 1,
        수금일자: '2025-01-01',
        거래처: '예시거래처',
        수금금액: 1000000,
        메모: ''
      }
    ],
    payable: [
      {
        'No.': 1,
        지급일자: '2025-01-01',
        거래처: '예시거래처',
        지급금액: 1000000,
        메모: ''
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
      { title: '거래처코드', dataIndex: '거래처코드', key: '거래처코드', width: 120 },
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명', width: 150 },
      { title: '사업자번호', dataIndex: '사업자번호', key: '사업자번호', width: 120 },
      { title: '주소', dataIndex: '주소', key: '주소', width: 200 },
      { title: '업태', dataIndex: '업태', key: '업태', width: 100 },
      { title: '종목', dataIndex: '종목', key: '종목', width: 100 },
      { title: '대표자', dataIndex: '대표자', key: '대표자', width: 100 },
      { title: '전화번호', dataIndex: '전화번호', key: '전화번호', width: 120 },
      { title: '팩스번호', dataIndex: '팩스번호', key: '팩스번호', width: 120 },
      { title: '이메일', dataIndex: '이메일', key: '이메일', width: 180 },
      { title: '담당자연락처', dataIndex: '담당자연락처', key: '담당자연락처', width: 120 },
      { title: '거래처구분', dataIndex: '거래처구분', key: '거래처구분', width: 100 },
      { title: '활성여부', dataIndex: '활성여부', key: '활성여부', width: 80 }
    ],
    product: [
      { title: '품목코드', dataIndex: '품목코드', key: '품목코드', width: 120 },
      { title: '품목명', dataIndex: '품목명', key: '품목명', width: 150 },
      { title: '규격', dataIndex: '규격', key: '규격', width: 100 },
      { title: '단위', dataIndex: '단위', key: '단위', width: 80 },
      { title: '매입단가', dataIndex: '매입단가', key: '매입단가', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '매출단가', dataIndex: '매출단가', key: '매출단가', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '분류', dataIndex: '분류', key: '분류', width: 100 },
      { title: '세금구분', dataIndex: '세금구분', key: '세금구분', width: 120 },
      { title: '비고', dataIndex: '비고', key: '비고', width: 150 },
      { title: '활성여부', dataIndex: '활성여부', key: '활성여부', width: 80 }
    ],
    sales: [
      { title: '매출일자', dataIndex: '매출일자', key: '매출일자', width: 120 },
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명', width: 150 },
      { title: '품목명', dataIndex: '품목명', key: '품목명', width: 150 },
      { title: '규격', dataIndex: '규격', key: '규격', width: 100 },
      { title: '단위', dataIndex: '단위', key: '단위', width: 80 },
      { title: '수량', dataIndex: '수량', key: '수량', width: 80 },
      { title: '단가', dataIndex: '단가', key: '단가', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '공급가액', dataIndex: '공급가액', key: '공급가액', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '세액', dataIndex: '세액', key: '세액', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '합계', dataIndex: '합계', key: '합계', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '비고', dataIndex: '비고', key: '비고', width: 150 }
    ],
    purchase: [
      { title: '매입일자', dataIndex: '매입일자', key: '매입일자', width: 120 },
      { title: '거래처명', dataIndex: '거래처명', key: '거래처명', width: 150 },
      { title: '품목명', dataIndex: '품목명', key: '품목명', width: 150 },
      { title: '규격', dataIndex: '규격', key: '규격', width: 100 },
      { title: '단위', dataIndex: '단위', key: '단위', width: 80 },
      { title: '수량', dataIndex: '수량', key: '수량', width: 80 },
      { title: '단가', dataIndex: '단가', key: '단가', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '공급가액', dataIndex: '공급가액', key: '공급가액', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '세액', dataIndex: '세액', key: '세액', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '합계', dataIndex: '합계', key: '합계', width: 120, render: (val: any) => val?.toLocaleString() },
      { title: '비고', dataIndex: '비고', key: '비고', width: 150 }
    ],
    receivable: [
      { title: 'No.', dataIndex: 'No.', key: 'No.', width: 80 },
      { title: '수금일자', dataIndex: '수금일자', key: '수금일자', width: 120 },
      { title: '거래처', dataIndex: '거래처', key: '거래처', width: 150 },
      { title: '수금금액', dataIndex: '수금금액', key: '수금금액', width: 120, render: (val: any) => val?.toLocaleString() + '원' },
      { title: '메모', dataIndex: '메모', key: '메모', width: 200 }
    ],
    payable: [
      { title: 'No.', dataIndex: 'No.', key: 'No.', width: 80 },
      { title: '지급일자', dataIndex: '지급일자', key: '지급일자', width: 120 },
      { title: '거래처', dataIndex: '거래처', key: '거래처', width: 150 },
      { title: '지급금액', dataIndex: '지급금액', key: '지급금액', width: 120, render: (val: any) => val?.toLocaleString() + '원' },
      { title: '메모', dataIndex: '메모', key: '메모', width: 200 }
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