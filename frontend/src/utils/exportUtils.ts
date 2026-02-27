import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { message } from 'antd';
import React from 'react';
import { exportToVectorPdf, exportTransactionLedgerToVectorPdf, VectorPdfColumn } from './vectorPdfExport';

export interface ExportColumn {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: any) => string;
}

export interface CompanyInfo {
  name?: string;
  businessNumber?: string;
  phone?: string;
  email?: string;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: any[];
  selectedRowKeys?: React.Key[];
  companyInfo?: CompanyInfo;  // 문서에 표시할 회사 정보 (공급받는자)
}

// 엑셀 내보내기 (ExcelJS 사용 - 보안 강화)
export const exportToExcel = async (options: ExportOptions) => {
    try {
    const { filename, title, columns, data, selectedRowKeys } = options;

    // 선택된 행만 필터링
    const exportData = selectedRowKeys && selectedRowKeys.length > 0
      ? data.filter((item: any) => selectedRowKeys.includes(item.id))
      : data;

    if (!exportData || exportData.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title || 'Sheet1');

    // 헤더 추가
    const headers = columns.map(col => col.title);
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

    // 데이터 추가
    exportData.forEach((record: any) => {
      const row = columns.map(col => {
        try {
          if (col.render && typeof col.render === 'function') {
            const rendered = col.render(record[col.dataIndex || col.key], record);
            return String(rendered || '').replace(/원$/, ''); // 원 단위만 제거, 콤마는 유지
          }

          const keys = (col.dataIndex || col.key).split('.');
          let value = record;
          for (const key of keys) {
            value = value?.[key];
          }
          return value || '';
        } catch (err) {
          console.warn('Column render error:', err);
          return '';
        }
      });
      worksheet.addRow(row);
    });

    // 컬럼 너비 자동 조정
    worksheet.columns.forEach((column, index) => {
      if (column) {
        column.width = Math.max(
          headers[index]?.length || 10,
          ...exportData.map(row => {
            const cellValue = String(worksheet.getCell(row + 2, index + 1).value || '');
            return cellValue.length;
          })
        ) + 2;
      }
    });

    // 데이터 영역에 테두리 추가
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      }
    });

    // 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success('엑셀 파일이 다운로드되었습니다.');
  } catch (error) {
    console.error('Excel export error:', error);
    message.error(`엑셀 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// PDF 내보내기 (벡터 기반 - 텍스트 선택/편집 가능)
export const exportToPDF = async (options: ExportOptions) => {
  const { filename, title, columns, data, selectedRowKeys, companyInfo } = options;

  // 선택된 행만 필터링
  const exportData = selectedRowKeys && selectedRowKeys.length > 0
    ? data.filter((item: any) => selectedRowKeys.includes(item.id))
    : data;

  // VectorPdfColumn 형식으로 변환
  const vectorColumns: VectorPdfColumn[] = columns.map(col => ({
    key: col.key,
    title: col.title,
    dataIndex: col.dataIndex,
    render: col.render,
  }));

  // 벡터 PDF로 내보내기
  await exportToVectorPdf({
    filename,
    title,
    columns: vectorColumns,
    data: exportData,
    orientation: 'l',
    companyInfo,
  });
};

// PDF 내보내기 (레거시 - HTML to Canvas 방식, 이미지 기반)
export const exportToPDFLegacy = async (options: ExportOptions) => {
    try {
    const { filename, title, columns, data, selectedRowKeys, companyInfo } = options;

    // 선택된 행만 필터링
    const exportData = selectedRowKeys && selectedRowKeys.length > 0
      ? data.filter((item: any) => selectedRowKeys.includes(item.id))
      : data;

    if (!exportData || exportData.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    // 임시 HTML 테이블 생성
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '1200px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = '"Malgun Gothic", "맑은 고딕", Arial, sans-serif';
    tempDiv.style.fontSize = '12px';

    // 현재 날짜
    const today = new Date().toLocaleDateString('ko-KR');

    // 테이블 헤더
    const headers = columns.map(col => `<th style="border: 1px solid #333; padding: 8px; background-color: #f5f5f5; font-weight: bold; text-align: center; font-size: 12px;">${col.title}</th>`).join('');

    // 테이블 데이터
    const rows = exportData.map((record: any) => {
      const cells = columns.map(col => {
        let cellValue = '';
        try {
          if (col.render && typeof col.render === 'function') {
            cellValue = col.render(record[col.dataIndex || col.key], record);
          } else {
            const keys = (col.dataIndex || col.key).split('.');
            let value = record;
            for (const key of keys) {
              value = value?.[key];
            }
            cellValue = String(value || '');
          }
        } catch (err) {
          console.warn('PDF column render error:', err);
          cellValue = '';
        }
        return `<td style="border: 1px solid #333; padding: 6px; text-align: center; font-size: 11px;">${cellValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    // 회사 정보 (companyInfo가 없으면 기본값 사용)
    const company = companyInfo || {
      name: '가온에프에스유한회사',
      businessNumber: '818-87-01513',
      phone: '031-527-3564',
      email: 'business@gaonfscorp.com'
    };

    tempDiv.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h1 style="text-align: center; margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: #333;">${title || '문서 출력'}</h1>
        <div style="text-align: right; font-size: 11px; color: #666; margin-bottom: 15px;">출력일자: ${today} ${new Date().toLocaleTimeString('ko-KR')}</div>
        <div style="font-size: 11px; margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
          <strong>회사명:</strong> ${company.name || '-'} |
          <strong>사업자번호:</strong> ${company.businessNumber || '-'} |
          <strong>연락처:</strong> ${company.phone || '-'} |
          <strong>이메일:</strong> ${company.email || '-'}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #333; background: white;">
        <thead><tr>${headers}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; text-align: center;">
        <p>본 문서는 ERP 시스템에서 자동 생성된 문서입니다. (총 ${exportData.length}건)</p>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // HTML을 캔버스로 변환 (고해상도)
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 3,  // 고해상도 (3배)
      width: 1200,
      height: tempDiv.scrollHeight,
      logging: false
    } as any);

    // 임시 div 제거
    document.body.removeChild(tempDiv);

    // PDF 생성 (PNG 사용으로 품질 향상)
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('l', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

    // PDF 다운로드
    const fileName = `${filename}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);

    message.success('PDF 파일이 다운로드되었습니다.');
  } catch (error) {
    console.error('PDF export error:', error);
    message.error(`PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// 인쇄 (바로 인쇄 다이얼로그 실행)
export const printData = (options: ExportOptions) => {
    try {
    const { title, columns, data, selectedRowKeys } = options;

    // 선택된 행만 필터링
    const printData = selectedRowKeys && selectedRowKeys.length > 0
      ? data.filter((item: any) => selectedRowKeys.includes(item.id))
      : data;

    if (!printData || printData.length === 0) {
      message.warning('인쇄할 데이터가 없습니다.');
      return;
    }

    // HTML 테이블 생성
    const headers = columns.map(col => `<th style="border: 1px solid #333; padding: 8px; background-color: #f5f5f5; font-weight: bold; text-align: center;">${col.title}</th>`).join('');

    const rows = printData.map((record: any) => {
      const cells = columns.map(col => {
        let cellValue = '';
        try {
          if (col.render && typeof col.render === 'function') {
            cellValue = col.render(record[col.dataIndex || col.key], record);
          } else {
            const keys = (col.dataIndex || col.key).split('.');
            let value = record;
            for (const key of keys) {
              value = value?.[key];
            }
            cellValue = String(value || '');
          }
        } catch (err) {
          console.warn('Print column render error:', err);
          cellValue = '';
        }
        return `<td style="border: 1px solid #333; padding: 6px; text-align: center;">${cellValue}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    // 현재 날짜
    const today = new Date().toLocaleDateString('ko-KR');
    const currentTime = new Date().toLocaleTimeString('ko-KR');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title || '인쇄'}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 15mm;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .no-print { display: none !important; }
            }
            body {
              font-family: 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', Arial, sans-serif;
              margin: 0;
              padding: 15px;
              color: #333;
              line-height: 1.3;
              font-size: 12px;
            }
            .print-header {
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .print-header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .print-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 10px 0;
              font-size: 12px;
              color: #666;
            }
            .company-info {
              font-size: 11px;
              text-align: center;
              color: #555;
              margin-top: 10px;
              padding: 8px;
              background-color: #f9f9f9;
              border: 1px solid #ddd;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #333;
              background: white;
              margin-top: 15px;
              font-size: 11px;
            }
            .data-table thead {
              background-color: #f5f5f5;
            }
            .data-table th, .data-table td {
              border: 1px solid #333;
              padding: 6px 4px;
              text-align: center;
              vertical-align: middle;
            }
            .data-table th {
              background-color: #f5f5f5;
              font-weight: bold;
              color: #333;
              font-size: 12px;
            }
            .data-table td {
              background-color: #fff;
            }
            .print-footer {
              margin-top: 25px;
              padding-top: 12px;
              border-top: 1px solid #ccc;
              font-size: 10px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${title || '문서 출력'}</h1>
            <div class="print-info">
              <div><strong>출력일시:</strong> ${today} ${currentTime}</div>
              <div><strong>총 ${printData.length}건</strong></div>
            </div>
            <div class="company-info">
              <strong>회사명:</strong> 가온에프에스유한회사 |
              <strong>사업자번호:</strong> 818-87-01513 |
              <strong>연락처:</strong> 031-527-3564 |
              <strong>이메일:</strong> business@gaonfscorp.com
            </div>
          </div>

          <table class="data-table">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows}</tbody>
          </table>

          <div class="print-footer">
            <p><strong>본 문서는 ERP 시스템에서 자동 생성된 문서입니다.</strong></p>
            <p>문의사항이 있으시면 관리자에게 연락해주세요.</p>
          </div>
        </body>
      </html>
    `;

    // 새 창에서 인쇄 다이얼로그 호출
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (!printWindow) {
      message.error('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();

    // 문서 로드 완료 후 인쇄 다이얼로그 열기
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          message.success('인쇄 설정창이 열렸습니다.');

          // 인쇄 후 창 닫기 (사용자가 취소해도 문제없음)
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        } catch (err) {
          console.error('Print dialog error:', err);
          message.error('인쇄 설정창을 여는데 실패했습니다.');
        }
      }, 500);
    };

  } catch (error) {
    console.error('Print error:', error);
    message.error(`인쇄에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// 일반적인 테이블 컬럼 설정들
export const getCommonColumns = () => ({
  purchase: [
    { key: 'purchaseDate', title: '매입일자', dataIndex: 'purchaseDate' },
    { key: 'company', title: '거래처', dataIndex: 'company.name' },
    { key: 'totalAmount', title: '총금액', dataIndex: 'totalAmount', render: (amount: number) => `${amount.toLocaleString()}원` },
    { key: 'vatAmount', title: '부가세', dataIndex: 'vatAmount', render: (amount: number) => `${amount.toLocaleString()}원` },
    { key: 'status', title: '상태', dataIndex: 'status', render: (status: string) => {
      const statusMap = { pending: '대기', completed: '완료', cancelled: '취소' };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'memo', title: '메모', dataIndex: 'memo' },
  ] as ExportColumn[],

  sales: [
    { key: 'saleDate', title: '매출일자', dataIndex: 'saleDate' },
    { key: 'company', title: '거래처', dataIndex: 'company.name' },
    { key: 'totalAmount', title: '총금액', dataIndex: 'totalAmount', render: (amount: number) => `${amount.toLocaleString()}원` },
    { key: 'vatAmount', title: '부가세', dataIndex: 'vatAmount', render: (amount: number) => `${amount.toLocaleString()}원` },
    { key: 'status', title: '상태', dataIndex: 'status', render: (status: string) => {
      const statusMap = { pending: '대기', completed: '완료', cancelled: '취소' };
      return statusMap[status as keyof typeof statusMap] || status;
    }},
    { key: 'memo', title: '메모', dataIndex: 'memo' },
  ] as ExportColumn[],

  payment: [
    { key: 'paymentDate', title: '일자', dataIndex: 'paymentDate' },
    { key: 'company', title: '거래처', dataIndex: 'company.name' },
    { key: 'type', title: '유형', dataIndex: 'type', render: (type: string) => type === 'receipt' ? '수금' : '지급' },
    { key: 'amount', title: '금액', dataIndex: 'amount', render: (amount: number) => `${amount.toLocaleString()}원` },
    { key: 'method', title: '방법', dataIndex: 'method', render: (method: string) => {
      const methodMap = { cash: '현금', bank_transfer: '계좌이체', check: '수표', card: '카드' };
      return methodMap[method as keyof typeof methodMap] || method;
    }},
    { key: 'memo', title: '메모', dataIndex: 'memo' },
  ] as ExportColumn[],

  ledger: [
    { key: 'date', title: '일자', dataIndex: 'date' },
    { key: 'company', title: '거래처', dataIndex: 'company.name' },
    { key: 'description', title: '내용', dataIndex: 'description' },
    { key: 'debitAmount', title: '차변', dataIndex: 'debitAmount', render: (amount: number) => amount > 0 ? `${amount.toLocaleString()}원` : '-' },
    { key: 'creditAmount', title: '대변', dataIndex: 'creditAmount', render: (amount: number) => amount > 0 ? `${amount.toLocaleString()}원` : '-' },
    { key: 'runningBalance', title: '잔액', dataIndex: 'runningBalance', render: (balance: number) => `${(balance || 0).toLocaleString()}원` },
    { key: 'type', title: '유형', dataIndex: 'type', render: (type: string) => {
      const typeMap = { purchase: '매입', sales: '매출', receipt: '수금', payment: '지급' };
      return typeMap[type as keyof typeof typeMap] || type;
    }},
  ] as ExportColumn[],

  customer: [
    { key: 'customerCode', title: '거래처코드', dataIndex: 'customerCode' },
    { key: 'name', title: '거래처명', dataIndex: 'name' },
    { key: 'businessNumber', title: '사업자번호', dataIndex: 'businessNumber' },
    { key: 'representative', title: '대표자', dataIndex: 'representative' },
    { key: 'phone', title: '연락처', dataIndex: 'phone' },
    { key: 'email', title: '이메일', dataIndex: 'email' },
    { key: 'customerType', title: '유형', dataIndex: 'customerType', render: (type: string) => {
      const typeMap = { customer: '고객', supplier: '공급업체', both: '고객+공급업체' };
      return typeMap[type as keyof typeof typeMap] || type;
    }},
    { key: 'memo', title: '비고', dataIndex: 'memo' },
  ] as ExportColumn[],

  product: [
    { key: 'productCode', title: '품목코드', dataIndex: 'productCode' },
    { key: 'name', title: '품목명', dataIndex: 'name' },
    { key: 'spec', title: '규격', dataIndex: 'spec' },
    { key: 'unit', title: '단위', dataIndex: 'unit' },
    { key: 'buyPrice', title: '매입단가', dataIndex: 'buyPrice', render: (price: number) => price ? `${price.toLocaleString()}원` : '-' },
    { key: 'sellPrice', title: '매출단가', dataIndex: 'sellPrice', render: (price: number) => price ? `${price.toLocaleString()}원` : '-' },
    { key: 'category', title: '분류', dataIndex: 'category' },
    { key: 'taxType', title: '세금구분', dataIndex: 'taxType', render: (taxType: string) => {
      const taxTypeMap = { tax_separate: '별도과세', tax_inclusive: '부가세포함', tax_free: '면세' };
      return taxTypeMap[taxType as keyof typeof taxTypeMap] || taxType;
    }},
    { key: 'memo', title: '비고', dataIndex: 'memo' },
  ] as ExportColumn[],
});

// 메뉴 아이템 생성 함수 (오버로드 지원)
export const createExportMenuItems = (
  dataOrHandler: any[] | ((type: 'excel' | 'pdf') => void),
  columns?: any[],
  filename?: string,
  _tableId?: string,
  companyInfo?: CompanyInfo  // 문서에 표시할 회사 정보
) => {
  // 콜백 함수 형태로 호출된 경우 (레거시 지원)
  if (typeof dataOrHandler === 'function') {
    const handleExport = dataOrHandler;
    return [
      {
        key: 'excel',
        label: '엑셀로 내보내기',
        onClick: () => handleExport('excel'),
      },
      {
        key: 'pdf',
        label: 'PDF로 내보내기',
        onClick: () => handleExport('pdf'),
      },
    ];
  }

  // 데이터, 컬럼, 파일명을 직접 받는 경우
  const data = dataOrHandler;

  // 작업(action) 컬럼 제외
  const filteredColumns = (columns || []).filter((col: any) => {
    const key = (col.key || col.dataIndex || '').toLowerCase();
    return !['action', 'actions', '작업'].includes(key);
  });

  const exportColumns: ExportColumn[] = filteredColumns.map((col: any) => ({
    key: col.key || col.dataIndex || '',
    title: col.title || '',
    dataIndex: col.dataIndex || col.key || '',
    render: col.render ? (value: any, record: any) => {
      try {
        // dataIndex가 없으면 record 전체를 첫 번째 인자로 전달 (Ant Design Table 호환)
        const hasDataIndex = col.dataIndex && col.dataIndex !== col.key;
        const result = hasDataIndex ? col.render(value, record) : col.render(record, record);

        // React 엘리먼트인 경우 텍스트로 변환
        if (result && typeof result === 'object') {
          if (result.props) {
            // React 엘리먼트
            const children = result.props.children;
            if (typeof children === 'string') return children;
            if (typeof children === 'number') return String(children);
            if (Array.isArray(children)) {
              return children.filter(c => typeof c === 'string' || typeof c === 'number').join('');
            }
            return '';
          }
          // 일반 객체인 경우 빈 문자열 반환 (버튼 등)
          return '';
        }
        return String(result ?? '');
      } catch {
        return String(value ?? '');
      }
    } : undefined,
  }));

  return [
    {
      key: 'excel',
      label: '엑셀로 내보내기',
      onClick: () => {
        exportToExcel({
          filename: filename || 'export',
          title: filename || '데이터 목록',
          columns: exportColumns,
          data: data,
          companyInfo: companyInfo,
        });
      },
    },
    {
      key: 'pdf',
      label: 'PDF로 내보내기',
      onClick: () => {
        exportToPDF({
          filename: filename || 'export',
          title: filename || '데이터 목록',
          columns: exportColumns,
          data: data,
          companyInfo: companyInfo,
        });
      },
    },
  ];
};

// 거래원장 전용 인터페이스
export interface TransactionLedgerExportOptions {
  filename: string;
  title: string;
  customer: {
    name: string;
    customerCode: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  previousBalance: number;
  entries: any[];  // ExpandedLedgerEntry[]
  ledgerEntries: any[];  // LedgerEntry[]
}

// 거래원장 전용 PDF 내보내기 (벡터 기반 - 텍스트 선택/편집 가능)
export const exportTransactionLedgerToPDF = async (options: TransactionLedgerExportOptions) => {
  await exportTransactionLedgerToVectorPdf(options);
};

// 거래원장 전용 PDF 내보내기 (레거시 - HTML to Canvas 방식)
export const exportTransactionLedgerToPDFLegacy = async (options: TransactionLedgerExportOptions) => {
  try {
    const { filename, title, customer, dateRange, previousBalance, entries, ledgerEntries } = options;

    if (!entries || entries.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    // 집계 계산
    const totalSalesSupply = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.supplyAmount || 0), 0);
    const totalSalesVat = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.vatAmount || 0), 0);
    const totalSalesAmount = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const totalPurchaseSupply = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.supplyAmount || 0), 0);
    const totalPurchaseVat = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.vatAmount || 0), 0);
    const totalPurchaseAmount = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const totalReceiptAmount = ledgerEntries.filter((e: any) => e.type === 'receipt').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);
    const totalPaymentAmount = ledgerEntries.filter((e: any) => e.type === 'payment').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

    // 사업자번호 포맷팅
    const formatBusinessNumber = (num?: string) => {
      if (!num) return '미등록';
      return num.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
    };

    // 임시 HTML 생성
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '1100px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.fontFamily = '"Malgun Gothic", "맑은 고딕", Arial, sans-serif';

    // 이월잔액 행 HTML
    const carryOverRow = previousBalance !== 0 ? `
      <tr style="background-color: #fffbe6;">
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${dateRange.start}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${customer.name}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; color: #faad14;">이월</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">전잔금</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: ${previousBalance >= 0 ? '#1890ff' : '#ff4d4f'};">${previousBalance.toLocaleString()}원</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">-</td>
      </tr>
    ` : '';

    // 거래 내역 행 HTML 생성
    const dataRows = entries.filter((e: any) => !e.isCarryOver).map((entry: any) => {
      const { isFirstRow, currentItemInfo, cumulativeBalance } = entry;

      // 품목명
      let itemDisplay = '';
      if (entry.type === 'receipt' || entry.type === 'payment') {
        itemDisplay = entry.description || '';
      } else if (currentItemInfo) {
        itemDisplay = currentItemInfo.itemName || '';
      } else {
        itemDisplay = entry.description || '';
      }

      // 공급가액
      const displaySupplyAmount = currentItemInfo?.amount ?? (isFirstRow ? entry.supplyAmount : null);
      const supplyAmountHtml = displaySupplyAmount !== null && displaySupplyAmount !== undefined
        ? `<span style="color: ${displaySupplyAmount < 0 ? '#ff4d4f' : (entry.type === 'sales' ? '#1890ff' : '#000')}">${displaySupplyAmount.toLocaleString()}원</span>`
        : '';

      // 세액
      const displayTax = currentItemInfo?.taxAmount ?? (isFirstRow ? entry.vatAmount : null);
      const taxAmountHtml = displayTax !== null && displayTax !== undefined
        ? `<span style="color: ${displayTax < 0 ? '#ff4d4f' : '#000'}">${displayTax.toLocaleString()}원</span>`
        : '';

      // 합계
      const displayTotal = currentItemInfo?.totalAmount ?? (isFirstRow ? entry.totalAmount : null);
      const totalAmountHtml = displayTotal !== null && displayTotal !== undefined
        ? `<span style="color: ${displayTotal < 0 ? '#ff4d4f' : '#000'}; font-weight: bold;">${displayTotal.toLocaleString()}원</span>`
        : '';

      // 구분 색상
      const typeColorMap: Record<string, string> = {
        'sales': '#1890ff',
        'purchase': '#000',
        'receipt': '#52c41a',
        'payment': '#fa8c16'
      };
      const typeNameMap: Record<string, string> = {
        'sales': '매출',
        'purchase': '매입',
        'receipt': '수금',
        'payment': '지급'
      };

      // 날짜 포맷
      const dateStr = entry.date ? entry.date.substring(0, 10) : '';

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${isFirstRow ? dateStr : ''}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${isFirstRow ? (entry.customerName || customer.name) : ''}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; color: ${typeColorMap[entry.type] || '#000'};">${isFirstRow ? (typeNameMap[entry.type] || '') : ''}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center;">${itemDisplay}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${supplyAmountHtml}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${taxAmountHtml}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right;">${totalAmountHtml}</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold; color: ${(cumulativeBalance ?? 0) >= 0 ? '#1890ff' : '#ff4d4f'};">${(cumulativeBalance ?? 0).toLocaleString()}원</td>
          <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 9px;">${isFirstRow ? (entry.memo || '-') : ''}</td>
        </tr>
      `;
    }).join('');

    tempDiv.innerHTML = `
      <div style="font-family: 'Malgun Gothic', sans-serif; font-size: 10pt; line-height: 1.4; color: #000;">
        <!-- 제목 -->
        <div style="font-size: 22pt; font-weight: bold; text-align: left; margin-bottom: 20px;">
          ${title}
        </div>

        <!-- 거래처 정보 -->
        <div style="background-color: #f8f9fa; padding: 12px; margin-bottom: 15px; border: 1px solid #dee2e6; font-size: 10pt;">
          <div style="display: flex; margin-bottom: 6px;">
            <div style="flex: 1;"><strong>거래처명:</strong> ${customer.name}</div>
            <div style="flex: 1;"><strong>거래처코드:</strong> ${customer.customerCode}</div>
            <div style="flex: 1;"><strong>사업자번호:</strong> ${formatBusinessNumber(customer.businessNumber)}</div>
            <div style="flex: 1;"><strong>대표자:</strong> ${customer.representative || '미등록'}</div>
          </div>
          <div style="margin-bottom: 4px; word-break: break-word;"><strong>주소:</strong> ${customer.address || '미등록'}</div>
          <div style="display: flex;">
            <div style="flex: 1;"><strong>전화번호:</strong> ${customer.phone || '미등록'}</div>
            <div style="flex: 1;"><strong>이메일:</strong> ${customer.email || '미등록'}</div>
            <div style="flex: 2;"><strong>조회기간:</strong> ${dateRange.start} ~ ${dateRange.end}</div>
          </div>
        </div>

        <!-- 거래 내역 테이블 -->
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; border: 1px solid #000;">
          <thead>
            <tr style="background-color: #f0f0f0;">
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 85px;">일자</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 80px;">거래처</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 50px;">구분</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">품목명</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">공급가액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 70px;">세액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">합계</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 90px;">잔액</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; width: 60px;">비고</th>
            </tr>
          </thead>
          <tbody>
            ${carryOverRow}
            ${dataRows}

            <!-- 합계 행 -->
            <tr style="background-color: #fafafa; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold; color: ${finalBalance >= 0 ? '#1890ff' : '#ff4d4f'};">${finalBalance.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">-</td>
            </tr>

            <!-- 매출 합계 / 수금 합계 -->
            <tr style="background-color: #f0f0f0;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">매출 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${totalSalesSupply.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${totalSalesVat.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #1890ff; font-weight: bold;">${totalSalesAmount.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">수금 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; color: #ff4d4f; font-weight: bold;">${totalReceiptAmount.toLocaleString()}원</td>
            </tr>

            <!-- 매입 합계 / 지급 합계 -->
            <tr style="background-color: #f0f0f0;">
              <td colspan="4" style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">매입 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalPurchaseSupply.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalPurchaseVat.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalPurchaseAmount.toLocaleString()}원</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">지급 합계</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">${totalPaymentAmount.toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // HTML을 캔버스로 변환 (고해상도)
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      scale: 3,  // 고해상도 (3배)
      width: 1100,
      height: tempDiv.scrollHeight,
      logging: false
    } as any);

    document.body.removeChild(tempDiv);

    // PDF 생성 (가로 방향)
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png', 1.0);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // 비율 계산
    const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    // 페이지가 넘어가는 경우 처리
    const scaledHeight = imgHeight * ratio;
    const pageHeight = pdfHeight - 20;

    if (scaledHeight <= pageHeight) {
      // 한 페이지에 들어가는 경우
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, scaledHeight);
    } else {
      // 여러 페이지인 경우 (간단히 첫 페이지만)
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, scaledHeight);
    }

    // PDF 다운로드
    const fileName = `${filename}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);

    message.success('거래원장 PDF가 다운로드되었습니다.');
  } catch (error) {
    console.error('Transaction Ledger PDF export error:', error);
    message.error(`PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// 거래원장 전용 엑셀 내보내기 (인쇄 화면과 동일한 형식)
export const exportTransactionLedgerToExcel = async (options: TransactionLedgerExportOptions) => {
  try {
    const { filename, title, customer, dateRange, previousBalance, entries, ledgerEntries } = options;

    if (!entries || entries.length === 0) {
      message.warning('내보낼 데이터가 없습니다.');
      return;
    }

    // 집계 계산
    const totalSalesSupply = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.supplyAmount || 0), 0);
    const totalSalesVat = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.vatAmount || 0), 0);
    const totalSalesAmount = ledgerEntries.filter((e: any) => e.type === 'sales').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const totalPurchaseSupply = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.supplyAmount || 0), 0);
    const totalPurchaseVat = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.vatAmount || 0), 0);
    const totalPurchaseAmount = ledgerEntries.filter((e: any) => e.type === 'purchase').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const totalReceiptAmount = ledgerEntries.filter((e: any) => e.type === 'receipt').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);
    const totalPaymentAmount = ledgerEntries.filter((e: any) => e.type === 'payment').reduce((sum: number, e: any) => sum + (e.totalAmount || 0), 0);

    const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

    // 사업자번호 포맷팅
    const formatBusinessNumber = (num?: string) => {
      if (!num) return '미등록';
      return num.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
    };

    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // 컬럼 너비 설정
    worksheet.columns = [
      { width: 14 },  // A: 일자
      { width: 12 },  // B: 거래처
      { width: 8 },   // C: 구분
      { width: 30 },  // D: 품목명
      { width: 14 },  // E: 공급가액
      { width: 12 },  // F: 세액
      { width: 14 },  // G: 합계
      { width: 14 },  // H: 잔액
    ];

    // 제목 행
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 18 };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // 거래처 정보 - 1행
    worksheet.mergeCells('A3:B3');
    worksheet.getCell('A3').value = `거래처명: ${customer.name}`;
    worksheet.mergeCells('C3:D3');
    worksheet.getCell('C3').value = `거래처코드: ${customer.customerCode}`;
    worksheet.mergeCells('E3:F3');
    worksheet.getCell('E3').value = `사업자번호: ${formatBusinessNumber(customer.businessNumber)}`;
    worksheet.mergeCells('G3:H3');
    worksheet.getCell('G3').value = `대표자: ${customer.representative || '미등록'}`;

    // 거래처 정보 - 2행
    worksheet.mergeCells('A4:C4');
    worksheet.getCell('A4').value = `주소: ${customer.address || '미등록'}`;
    worksheet.mergeCells('D4:E4');
    worksheet.getCell('D4').value = `전화번호: ${customer.phone || '미등록'}`;
    worksheet.mergeCells('F4:H4');
    worksheet.getCell('F4').value = `조회기간: ${dateRange.start} ~ ${dateRange.end}`;

    // 거래처 정보 배경색
    ['A3', 'C3', 'E3', 'G3', 'A4', 'D4', 'F4'].forEach(cell => {
      worksheet.getCell(cell).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' }
      };
    });

    // 헤더 행 (6행)
    const headerRow = worksheet.getRow(6);
    const headers = ['일자', '거래처', '구분', '품목명', '공급가액', '세액', '합계', '잔액'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    let currentRow = 7;

    // 이월잔액 행
    if (previousBalance !== 0) {
      const carryOverRow = worksheet.getRow(currentRow);
      carryOverRow.getCell(1).value = dateRange.start;
      carryOverRow.getCell(2).value = customer.name;
      carryOverRow.getCell(3).value = '이월';
      carryOverRow.getCell(3).font = { color: { argb: 'FFFAAD14' } };
      carryOverRow.getCell(4).value = '이월잔액';
      carryOverRow.getCell(5).value = '';
      carryOverRow.getCell(6).value = '';
      carryOverRow.getCell(7).value = '';
      carryOverRow.getCell(8).value = `${previousBalance.toLocaleString()}원`;
      carryOverRow.getCell(8).font = { bold: true, color: { argb: previousBalance >= 0 ? 'FF1890FF' : 'FFFF4D4F' } };

      // 이월 행 배경색
      for (let i = 1; i <= 8; i++) {
        carryOverRow.getCell(i).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBE6' }
        };
        carryOverRow.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        carryOverRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }
      carryOverRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
      currentRow++;
    }

    // 색상 맵
    const typeColorMap: Record<string, string> = {
      'sales': 'FF1890FF',
      'purchase': 'FF000000',
      'receipt': 'FF52C41A',
      'payment': 'FFFA8C16'
    };
    const typeNameMap: Record<string, string> = {
      'sales': '매출',
      'purchase': '매입',
      'receipt': '수금',
      'payment': '지급'
    };

    // 거래 내역 데이터
    entries.filter((e: any) => !e.isCarryOver).forEach((entry: any) => {
      const row = worksheet.getRow(currentRow);
      const { isFirstRow, currentItemInfo, cumulativeBalance } = entry;

      // 일자
      row.getCell(1).value = isFirstRow ? (entry.date?.substring(0, 10) || '') : '';

      // 거래처
      row.getCell(2).value = isFirstRow ? (entry.customerName || customer.name) : '';

      // 구분
      row.getCell(3).value = isFirstRow ? (typeNameMap[entry.type] || '') : '';
      if (isFirstRow) {
        row.getCell(3).font = { color: { argb: typeColorMap[entry.type] || 'FF000000' } };
      }

      // 품목명
      let itemDisplay = '';
      if (entry.type === 'receipt' || entry.type === 'payment') {
        itemDisplay = entry.description || '';
      } else if (currentItemInfo) {
        itemDisplay = currentItemInfo.itemName || '';
      } else {
        itemDisplay = entry.description || '';
      }
      row.getCell(4).value = itemDisplay;

      // 공급가액
      const displaySupplyAmount = currentItemInfo?.amount ?? (isFirstRow ? entry.supplyAmount : null);
      if (displaySupplyAmount !== null && displaySupplyAmount !== undefined) {
        row.getCell(5).value = `${displaySupplyAmount.toLocaleString()}원`;
        row.getCell(5).font = { color: { argb: displaySupplyAmount < 0 ? 'FFFF4D4F' : (entry.type === 'sales' ? 'FF1890FF' : 'FF000000') } };
      }

      // 세액
      const displayTax = currentItemInfo?.taxAmount ?? (isFirstRow ? entry.vatAmount : null);
      if (displayTax !== null && displayTax !== undefined) {
        row.getCell(6).value = `${displayTax.toLocaleString()}원`;
        if (displayTax < 0) {
          row.getCell(6).font = { color: { argb: 'FFFF4D4F' } };
        }
      }

      // 합계
      const displayTotal = currentItemInfo?.totalAmount ?? (isFirstRow ? entry.totalAmount : null);
      if (displayTotal !== null && displayTotal !== undefined) {
        row.getCell(7).value = `${displayTotal.toLocaleString()}원`;
        row.getCell(7).font = { bold: true };
        if (displayTotal < 0) {
          row.getCell(7).font = { bold: true, color: { argb: 'FFFF4D4F' } };
        }
      }

      // 잔액
      const balance = cumulativeBalance ?? 0;
      row.getCell(8).value = `${balance.toLocaleString()}원`;
      row.getCell(8).font = { bold: true, color: { argb: balance >= 0 ? 'FF1890FF' : 'FFFF4D4F' } };

      // 테두리 및 정렬
      for (let i = 1; i <= 8; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        row.getCell(i).alignment = {
          horizontal: i >= 5 ? 'right' : 'center',
          vertical: 'middle'
        };
      }

      currentRow++;
    });

    // 합계 행
    const summaryRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    summaryRow.getCell(1).value = '합계';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summaryRow.getCell(5).value = '-';
    summaryRow.getCell(6).value = '-';
    summaryRow.getCell(7).value = '-';
    summaryRow.getCell(8).value = `${finalBalance.toLocaleString()}원`;
    summaryRow.getCell(8).font = { bold: true, color: { argb: finalBalance >= 0 ? 'FF1890FF' : 'FFFF4D4F' } };

    for (let i = 1; i <= 8; i++) {
      summaryRow.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFAFAFA' }
      };
      summaryRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      summaryRow.getCell(i).alignment = {
        horizontal: i >= 5 ? 'right' : 'center',
        vertical: 'middle'
      };
    }
    currentRow++;

    // 매출 합계 행
    const salesSummaryRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    salesSummaryRow.getCell(1).value = '매출 합계';
    salesSummaryRow.getCell(1).font = { bold: true };
    salesSummaryRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    salesSummaryRow.getCell(5).value = `${totalSalesSupply.toLocaleString()}원`;
    salesSummaryRow.getCell(5).font = { bold: true, color: { argb: 'FF1890FF' } };
    salesSummaryRow.getCell(6).value = `${totalSalesVat.toLocaleString()}원`;
    salesSummaryRow.getCell(6).font = { bold: true, color: { argb: 'FF1890FF' } };
    salesSummaryRow.getCell(7).value = `${totalSalesAmount.toLocaleString()}원`;
    salesSummaryRow.getCell(7).font = { bold: true, color: { argb: 'FF1890FF' } };
    salesSummaryRow.getCell(8).value = `수금 합계: ${totalReceiptAmount.toLocaleString()}원`;
    salesSummaryRow.getCell(8).font = { bold: true, color: { argb: 'FFFF4D4F' } };

    for (let i = 1; i <= 8; i++) {
      salesSummaryRow.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      salesSummaryRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      salesSummaryRow.getCell(i).alignment = {
        horizontal: i >= 5 ? 'right' : 'center',
        vertical: 'middle'
      };
    }
    currentRow++;

    // 매입 합계 행
    const purchaseSummaryRow = worksheet.getRow(currentRow);
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    purchaseSummaryRow.getCell(1).value = '매입 합계';
    purchaseSummaryRow.getCell(1).font = { bold: true };
    purchaseSummaryRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    purchaseSummaryRow.getCell(5).value = `${totalPurchaseSupply.toLocaleString()}원`;
    purchaseSummaryRow.getCell(5).font = { bold: true };
    purchaseSummaryRow.getCell(6).value = `${totalPurchaseVat.toLocaleString()}원`;
    purchaseSummaryRow.getCell(6).font = { bold: true };
    purchaseSummaryRow.getCell(7).value = `${totalPurchaseAmount.toLocaleString()}원`;
    purchaseSummaryRow.getCell(7).font = { bold: true };
    purchaseSummaryRow.getCell(8).value = `지급 합계: ${totalPaymentAmount.toLocaleString()}원`;
    purchaseSummaryRow.getCell(8).font = { bold: true };

    for (let i = 1; i <= 8; i++) {
      purchaseSummaryRow.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      purchaseSummaryRow.getCell(i).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      purchaseSummaryRow.getCell(i).alignment = {
        horizontal: i >= 5 ? 'right' : 'center',
        vertical: 'middle'
      };
    }

    // 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success('거래원장 엑셀 파일이 다운로드되었습니다.');
  } catch (error) {
    console.error('Transaction Ledger Excel export error:', error);
    message.error(`엑셀 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

// ============================================
// 국세청 면세계산서 양식 엑셀 내보내기
// ============================================

export interface NTSInvoiceExportOptions {
  // 공급자 정보 (사업장)
  supplier: {
    businessNumber: string;      // 사업자번호
    companyName: string;         // 상호
    representative: string;      // 대표자
    address?: string;            // 주소
    businessType?: string;       // 업태
    businessItem?: string;       // 종목
    email?: string;              // 이메일
  };
  // 매출 데이터
  sales: Array<{
    transactionDate: string;     // 거래일자
    customer: {
      businessNumber?: string;   // 공급받는자 사업자번호
      name: string;              // 공급받는자 상호
      representative?: string;   // 공급받는자 대표자
      address?: string;          // 공급받는자 주소
      businessType?: string;     // 공급받는자 업태
      businessItem?: string;     // 공급받는자 종목
      email?: string;            // 공급받는자 이메일
    };
    totalAmount: number;         // 공급가액 합계
    memo?: string;               // 비고
    items: Array<{
      itemName: string;          // 품목명
      specification?: string;    // 규격
      quantity: number;          // 수량
      unitPrice: number;         // 단가
      supplyAmount: number;      // 공급가액
      remark?: string;           // 품목비고
    }>;
  }>;
  // 옵션
  invoiceType?: '01' | '02';     // 01: 영수, 02: 청구 (기본: 02)
}

// 국세청 면세계산서 양식 엑셀 다운로드
export const exportNTSInvoiceExcel = async (options: NTSInvoiceExportOptions) => {
  try {
    const { supplier, sales, invoiceType = '02' } = options;

    if (!sales || sales.length === 0) {
      message.warning('내보낼 매출 데이터가 없습니다.');
      return;
    }

    // 사업자번호에서 하이픈 제거
    const cleanBusinessNumber = (num?: string) => {
      if (!num) return '';
      return num.replace(/-/g, '');
    };

    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('엑셀업로드양식');

    // 국세청 양식 헤더 (6행에 위치)
    const headers = [
      '전자(세금)계산서 종류\n(05::일반)',           // 1
      '작성일자',                                    // 2
      '공급자 등록번호\n("-" 없이 입력)',            // 3
      '공급자\n 종사업장번호',                       // 4
      '공급자 상호',                                 // 5
      '공급자 성명',                                 // 6
      '공급자 사업장주소',                           // 7
      '공급자 업태',                                 // 8
      '공급자 종목',                                 // 9
      '공급자 이메일',                               // 10
      '공급받는자 등록번호\n("-" 없이 입력)',        // 11
      '공급받는자 \n종사업장번호',                   // 12
      '공급받는자 상호',                             // 13
      '공급받는자 성명',                             // 14
      '공급받는자 사업장주소',                       // 15
      '공급받는자 업태',                             // 16
      '공급받는자 종목',                             // 17
      '공급받는자 이메일1',                          // 18
      '공급받는자 이메일2',                          // 19
      '공급가액\n합계',                              // 20
      '비고',                                        // 21
      '일자1\n(2자리, 작성년월 제외)',               // 22
      '품목1',                                       // 23
      '규격1',                                       // 24
      '수량1',                                       // 25
      '단가1',                                       // 26
      '공급가액1',                                   // 27
      '품목비고1',                                   // 28
      '일자2\n(2자리, 작성년월 제외)',               // 29
      '품목2',                                       // 30
      '규격2',                                       // 31
      '수량2',                                       // 32
      '단가2',                                       // 33
      '공급가액2',                                   // 34
      '품목비고2',                                   // 35
      '일자3\n(2자리, 작성년월 제외)',               // 36
      '품목3',                                       // 37
      '규격3',                                       // 38
      '수량3',                                       // 39
      '단가3',                                       // 40
      '공급가액3',                                   // 41
      '품목비고3',                                   // 42
      '일자4\n(2자리, 작성년월 제외)',               // 43
      '품목4',                                       // 44
      '규격4',                                       // 45
      '수량4',                                       // 46
      '단가4',                                       // 47
      '공급가액4',                                   // 48
      '품목비고4',                                   // 49
      '현금',                                        // 50
      '수표',                                        // 51
      '어음',                                        // 52
      '외상미수금',                                  // 53
      '영수(01),\n청구(02)',                         // 54
    ];

    // 제목 행 (1행) - 병합
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '엑셀 업로드 양식(전자계산서-일반)';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // 안내 행 (2-5행) - 국세청 양식과 동일하게 병합 처리
    worksheet.mergeCells('A2:L2');
    worksheet.getCell('A2').value = '* 주황색은 필수 항목입니다.';
    worksheet.getCell('A2').font = { color: { argb: 'FFFF6600' } };

    worksheet.mergeCells('A3:L3');
    worksheet.getCell('A3').value = '* 전자(세금)계산서 종류는 일반(05)만 입력 가능합니다.';

    worksheet.mergeCells('A4:L4');
    worksheet.getCell('A4').value = '* 작성일자는 YYYYMMDD 형식으로 입력해주세요. (예: 20260203)';

    worksheet.mergeCells('A5:L5');
    worksheet.getCell('A5').value = '* 품목은 최대 4개까지 입력 가능합니다.';

    // 헤더 행 (6행)
    const headerRow = worksheet.getRow(6);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // 필수 항목 주황색 배경 (컬럼 1, 2, 3, 11, 20)
      const requiredColumns = [1, 2, 3, 11, 20];
      if (requiredColumns.includes(index + 1)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }  // 주황색
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }  // 회색
        };
      }
    });
    headerRow.height = 40;

    // 컬럼 너비 설정
    const columnWidths = [
      12, 12, 14, 8, 20, 12, 30, 12, 12, 25,  // 1-10
      14, 8, 20, 12, 30, 12, 12, 25, 25, 14,  // 11-20
      15, 6, 20, 10, 8, 12, 12, 15,           // 21-28 (품목1)
      6, 20, 10, 8, 12, 12, 15,               // 29-35 (품목2)
      6, 20, 10, 8, 12, 12, 15,               // 36-42 (품목3)
      6, 20, 10, 8, 12, 12, 15,               // 43-49 (품목4)
      12, 12, 12, 12, 10                       // 50-54
    ];
    columnWidths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = width;
    });

    // 데이터 행 추가 (7행부터)
    let currentRow = 7;
    for (const sale of sales) {
      const row = worksheet.getRow(currentRow);

      // 작성일자 포맷팅 (YYYYMMDD)
      const dateStr = sale.transactionDate.replace(/-/g, '').substring(0, 8);
      const dayStr = dateStr.substring(6, 8);  // 일자 2자리

      // 기본 정보
      row.getCell(1).value = '05';  // 전자계산서 종류 (일반)
      row.getCell(2).value = dateStr;  // 작성일자
      row.getCell(3).value = cleanBusinessNumber(supplier.businessNumber);  // 공급자 사업자번호
      row.getCell(4).value = '';  // 공급자 종사업장번호
      row.getCell(5).value = supplier.companyName;  // 공급자 상호
      row.getCell(6).value = supplier.representative;  // 공급자 성명
      row.getCell(7).value = supplier.address || '';  // 공급자 주소
      row.getCell(8).value = supplier.businessType || '';  // 공급자 업태
      row.getCell(9).value = supplier.businessItem || '';  // 공급자 종목
      row.getCell(10).value = supplier.email || '';  // 공급자 이메일

      row.getCell(11).value = cleanBusinessNumber(sale.customer.businessNumber);  // 공급받는자 사업자번호
      row.getCell(12).value = '';  // 공급받는자 종사업장번호
      row.getCell(13).value = sale.customer.name;  // 공급받는자 상호
      row.getCell(14).value = sale.customer.representative || '';  // 공급받는자 성명
      row.getCell(15).value = sale.customer.address || '';  // 공급받는자 주소
      row.getCell(16).value = sale.customer.businessType || '';  // 공급받는자 업태
      row.getCell(17).value = sale.customer.businessItem || '';  // 공급받는자 종목
      row.getCell(18).value = sale.customer.email || '';  // 공급받는자 이메일1
      row.getCell(19).value = '';  // 공급받는자 이메일2

      row.getCell(20).value = Math.round(Number(sale.totalAmount) || 0);  // 공급가액 합계
      row.getCell(21).value = sale.memo || '';  // 비고

      // 품목 정보 (최대 4개)
      const items = sale.items.slice(0, 4);
      items.forEach((item, itemIndex) => {
        const baseCol = 22 + (itemIndex * 7);  // 품목1: 22, 품목2: 29, 품목3: 36, 품목4: 43

        row.getCell(baseCol).value = dayStr;  // 일자
        row.getCell(baseCol + 1).value = item.itemName;  // 품목
        row.getCell(baseCol + 2).value = item.specification || '';  // 규격
        row.getCell(baseCol + 3).value = '';  // 수량 (공란)
        row.getCell(baseCol + 4).value = '';  // 단가 (공란)
        row.getCell(baseCol + 5).value = '';  // 공급가액 (공란)
        row.getCell(baseCol + 6).value = item.remark || '';  // 품목비고
      });

      // 결제 정보
      row.getCell(50).value = '';  // 현금
      row.getCell(51).value = '';  // 수표
      row.getCell(52).value = '';  // 어음
      row.getCell(53).value = '';  // 외상미수금 (공란)
      row.getCell(54).value = invoiceType;  // 영수(01)/청구(02)

      // 셀 스타일
      for (let i = 1; i <= 54; i++) {
        const cell = row.getCell(i);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      currentRow++;
    }

    // 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `국세청_면세계산서_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`국세청 면세계산서 양식이 다운로드되었습니다. (${sales.length}건)`);
  } catch (error) {
    console.error('NTS Invoice Excel export error:', error);
    message.error(`엑셀 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};