import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { message } from 'antd';
import React from 'react';

export interface ExportColumn {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: any, record: any) => string;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: any[];
  selectedRowKeys?: React.Key[];
}

// 엑셀 내보내기 (ExcelJS 사용 - 보안 강화)
export const exportToExcel = async (options: ExportOptions) => {
  console.log('exportToExcel called with options:', options);
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
            return String(rendered || '').replace(/원$/, '').replace(/,/g, ''); // 원 단위 및 콤마 제거
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

// PDF 내보내기 (HTML to Canvas 방식으로 한글 지원)
export const exportToPDF = async (options: ExportOptions) => {
  console.log('exportToPDF called with options:', options);
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

    tempDiv.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h1 style="text-align: center; margin: 0 0 15px 0; font-size: 20px; font-weight: bold; color: #333;">${title || '문서 출력'}</h1>
        <div style="text-align: right; font-size: 11px; color: #666; margin-bottom: 15px;">출력일자: ${today} ${new Date().toLocaleTimeString('ko-KR')}</div>
        <div style="font-size: 11px; margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd;">
          <strong>회사명:</strong> 가온에프에스유한회사 |
          <strong>사업자번호:</strong> 818-87-01513 |
          <strong>연락처:</strong> 031-527-3564 |
          <strong>이메일:</strong> business@gaonfscorp.com
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

    // HTML을 캔버스로 변환
    const canvas = await html2canvas(tempDiv, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: tempDiv.scrollHeight
    } as any);

    // 임시 div 제거
    document.body.removeChild(tempDiv);

    // PDF 생성
    const imgData = canvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF('l', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;

    pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

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
  console.log('printData called with options:', options);
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

// 메뉴 아이템 생성 함수
export const createExportMenuItems = (handleExport: (type: 'excel' | 'pdf') => void) => [
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