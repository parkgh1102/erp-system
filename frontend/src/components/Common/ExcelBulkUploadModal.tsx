import React, { useState } from 'react';
import { Modal, Upload, Button, message, Alert, Space } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { excelAPI } from '../../utils/api';

interface ExcelBulkUploadModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  businessId: number;
  uploadType: 'customers' | 'products' | 'sales' | 'purchases';
  title?: string;
}

const ExcelBulkUploadModal: React.FC<ExcelBulkUploadModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  businessId,
  uploadType,
  title
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const typeLabels = {
    customers: '거래처',
    products: '품목',
    sales: '매출',
    purchases: '매입'
  };

  const handleDownloadTemplate = async () => {
    try {
      let response;
      switch (uploadType) {
        case 'customers':
          response = await excelAPI.downloadCustomerTemplate();
          break;
        case 'products':
          response = await excelAPI.downloadProductTemplate();
          break;
        case 'sales':
          response = await excelAPI.downloadSalesTemplate();
          break;
        case 'purchases':
          response = await excelAPI.downloadPurchaseTemplate();
          break;
      }

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${typeLabels[uploadType]}_template.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('템플릿 다운로드 완료');
    } catch (error) {
      console.error('템플릿 다운로드 오류:', error);
      message.error('템플릿 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('파일을 선택해주세요.');
      return;
    }

    setUploading(true);

    try {
      const file = fileList[0].originFileObj as File;
      let response;

      switch (uploadType) {
        case 'customers':
          response = await excelAPI.uploadCustomers(businessId, file);
          break;
        case 'products':
          response = await excelAPI.uploadProducts(businessId, file);
          break;
        case 'sales':
          response = await excelAPI.uploadSales(businessId, file);
          break;
        case 'purchases':
          response = await excelAPI.uploadPurchases(businessId, file);
          break;
      }

      if (response.data.success) {
        message.success(response.data.message);

        // 오류가 있으면 표시
        if (response.data.results?.errors?.length > 0) {
          Modal.warning({
            title: '일부 데이터 업로드 실패',
            content: (
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {response.data.results.errors.map((error: string, index: number) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            ),
            width: 600
          });
        }

        setFileList([]);
        onSuccess();
        onCancel();
      } else {
        message.error(response.data.message || '업로드 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('업로드 오류:', error);
      message.error(error.response?.data?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    accept: '.xlsx,.xls',
    maxCount: 1,
    fileList,
    beforeUpload: (file: File) => {
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel';

      if (!isExcel) {
        message.error('Excel 파일만 업로드 가능합니다!');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('파일 크기는 10MB 이하여야 합니다!');
        return false;
      }

      setFileList([file as any]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  return (
    <Modal
      title={title || `${typeLabels[uploadType]} Excel 업로드`}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          취소
        </Button>,
        <Button
          key="upload"
          type="primary"
          loading={uploading}
          onClick={handleUpload}
          disabled={fileList.length === 0}
        >
          업로드
        </Button>
      ]}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message="업로드 방법"
          description={
            <div>
              <p>1. 아래 템플릿 다운로드 버튼을 클릭하여 양식을 다운로드합니다.</p>
              <p>2. Excel 파일에 데이터를 입력합니다.</p>
              <p>3. 작성한 파일을 선택하여 업로드합니다.</p>
              <p style={{ color: '#ff4d4f', marginTop: 10 }}>
                ⚠️ 주의: 템플릿의 컬럼명을 변경하지 마세요!
              </p>
            </div>
          }
          type="info"
          showIcon
        />

        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
          block
          size="large"
        >
          <FileExcelOutlined /> 템플릿 다운로드
        </Button>

        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">클릭하거나 파일을 드래그하여 업로드</p>
          <p className="ant-upload-hint">Excel 파일(.xlsx, .xls)만 업로드 가능합니다.</p>
        </Upload.Dragger>
      </Space>
    </Modal>
  );
};

export default ExcelBulkUploadModal;
