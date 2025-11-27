import React from 'react';
import { Modal, Table, Tag, Typography, Space, Statistic, Row, Col, Alert, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import * as ExcelJS from 'exceljs';

const { Text } = Typography;

export interface UploadResultItem {
  rowNumber: number;
  data: Record<string, any>;
  success: boolean;
  error?: string;
}

interface UploadResultModalProps {
  visible: boolean;
  onClose: () => void;
  results: UploadResultItem[];
  title?: string;
  columns: { title: string; dataIndex: string }[];
}

const UploadResultModal: React.FC<UploadResultModalProps> = ({
  visible,
  onClose,
  results,
  title = '업로드 결과',
  columns
}) => {
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const failedItems = results.filter(r => !r.success);

  // 실패 건만 엑셀로 다운로드
  const downloadFailedItems = async () => {
    if (failedItems.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('실패 목록');

    // 헤더 생성 (원본 컬럼 + 오류 메시지)
    const headers = [...columns.map(c => c.title), '오류 메시지'];
    worksheet.addRow(headers);

    // 헤더 스타일
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'CC0000' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // 데이터 추가
    failedItems.forEach(item => {
      const rowData = columns.map(c => item.data[c.dataIndex] || '');
      rowData.push(item.error || '알 수 없는 오류');
      worksheet.addRow(rowData);
    });

    // 컬럼 너비 자동 조정
    worksheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });

    // 파일 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `업로드_실패_목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // 테이블 컬럼 정의
  const tableColumns = [
    {
      title: '행번호',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      width: 80,
      render: (val: number) => <Text>{val}행</Text>
    },
    {
      title: '상태',
      dataIndex: 'success',
      key: 'success',
      width: 80,
      render: (success: boolean) => (
        success ? (
          <Tag icon={<CheckCircleOutlined />} color="success">성공</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">실패</Tag>
        )
      )
    },
    ...columns.map(col => ({
      title: col.title,
      dataIndex: ['data', col.dataIndex],
      key: col.dataIndex,
      width: 120,
      ellipsis: true,
      render: (_: any, record: UploadResultItem) => record.data[col.dataIndex] || '-'
    })),
    {
      title: '오류 메시지',
      dataIndex: 'error',
      key: 'error',
      width: 250,
      render: (error: string) => error ? <Text type="danger">{error}</Text> : '-'
    }
  ];

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      width={1000}
      style={{ top: 20 }}
      styles={{
        body: { maxHeight: '70vh', overflow: 'auto' }
      }}
      footer={[
        failCount > 0 && (
          <Button
            key="download"
            icon={<DownloadOutlined />}
            onClick={downloadFailedItems}
          >
            실패 목록 다운로드
          </Button>
        ),
        <Button key="close" type="primary" onClick={onClose}>
          확인
        </Button>
      ]}
    >
      {/* 요약 통계 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Statistic
            title="전체"
            value={results.length}
            suffix="건"
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="성공"
            value={successCount}
            suffix="건"
            valueStyle={{ color: '#3f8600' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="실패"
            value={failCount}
            suffix="건"
            valueStyle={{ color: failCount > 0 ? '#cf1322' : undefined }}
            prefix={failCount > 0 ? <CloseCircleOutlined /> : undefined}
          />
        </Col>
      </Row>

      {/* 실패 건 알림 */}
      {failCount > 0 && (
        <Alert
          message={`${failCount}건의 데이터 업로드에 실패했습니다.`}
          description="아래 목록에서 실패 원인을 확인하고, '실패 목록 다운로드' 버튼으로 수정 후 재업로드하세요."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 결과 테이블 - 실패 건만 표시 (실패가 있을 경우) */}
      {failCount > 0 ? (
        <>
          <Text strong style={{ marginBottom: 8, display: 'block' }}>실패 목록</Text>
          <Table
            columns={tableColumns}
            dataSource={failedItems.map((item, index) => ({ ...item, key: index }))}
            scroll={{ x: true, y: 400 }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            size="small"
          />
        </>
      ) : (
        <Alert
          message="모든 데이터가 성공적으로 업로드되었습니다!"
          type="success"
          showIcon
        />
      )}
    </Modal>
  );
};

export default UploadResultModal;
