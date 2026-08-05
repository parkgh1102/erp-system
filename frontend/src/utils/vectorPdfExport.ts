/**
 * 벡터 기반 PDF 내보내기 유틸리티
 * html2canvas 대신 jsPDF + jspdf-autotable을 사용하여 선명한 PDF 생성
 * - 텍스트 선택/복사 가능
 * - Adobe에서 편집 가능
 * - 무한 확대해도 선명
 * - 파일 크기 대폭 감소
 */

import jsPDF from 'jspdf';
import autoTable, { RowInput, CellDef } from 'jspdf-autotable';
import { message } from 'antd';
import { createPDFWithKoreanFont } from './pdfFontLoader';
import { formatBusinessNumber } from './formatters';

export interface VectorPdfColumn {
  key: string;
  title: string;
  dataIndex?: string;
  width?: number;  // 컬럼 너비 (비율)
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => string;
}

export interface VectorPdfOptions {
  filename: string;
  title?: string;
  columns: VectorPdfColumn[];
  data: any[];
  orientation?: 'p' | 'l';  // portrait or landscape
  companyInfo?: {
    name?: string;
    businessNumber?: string;
    phone?: string;
    email?: string;
  };
  showHeader?: boolean;
  showFooter?: boolean;
  headerExtra?: string;  // 추가 헤더 정보
}

/**
 * 데이터에서 셀 값 추출
 */
const getCellValue = (record: any, column: VectorPdfColumn): string => {
  try {
    if (column.render && typeof column.render === 'function') {
      const result = column.render(record[column.dataIndex || column.key], record);
      // React 엘리먼트 처리
      if (result && typeof result === 'object' && result.props) {
        const children = result.props.children;
        if (typeof children === 'string') return children;
        if (typeof children === 'number') return String(children);
        if (Array.isArray(children)) {
          return children.filter(c => typeof c === 'string' || typeof c === 'number').join('');
        }
        return '';
      }
      return String(result ?? '');
    }

    const keys = (column.dataIndex || column.key).split('.');
    let value = record;
    for (const key of keys) {
      value = value?.[key];
    }
    return String(value ?? '');
  } catch {
    return '';
  }
};

/**
 * 일반 데이터 테이블을 벡터 PDF로 내보내기
 */
export const exportToVectorPdf = async (options: VectorPdfOptions): Promise<void> => {
  const {
    filename,
    title,
    columns,
    data,
    orientation = 'l',
    companyInfo,
    showHeader = true,
    showFooter = true,
  } = options;

  if (!data || data.length === 0) {
    message.warning('내보낼 데이터가 없습니다.');
    return;
  }

  try {
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    // 한글 폰트가 포함된 PDF 생성
    const doc = await createPDFWithKoreanFont(orientation, 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    let currentY = margin;

    // 헤더 섹션
    if (showHeader && title) {
      // 제목
      doc.setFontSize(18);
      doc.setFont('NanumGothic', 'normal');
      doc.text(title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // 출력일시
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      doc.setFontSize(9);
      doc.text(`출력일시: ${dateStr}`, pageWidth - margin, currentY, { align: 'right' });
      currentY += 5;

      // 회사 정보
      if (companyInfo) {
        const company = companyInfo;
        doc.setFontSize(9);
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, currentY, pageWidth - margin * 2, 10, 'FD');

        const infoText = [
          company.name && `회사명: ${company.name}`,
          company.businessNumber && `사업자번호: ${company.businessNumber}`,
          company.phone && `연락처: ${company.phone}`,
          company.email && `이메일: ${company.email}`,
        ].filter(Boolean).join('  |  ');

        doc.text(infoText, pageWidth / 2, currentY + 6, { align: 'center' });
        currentY += 15;
      }
    }

    // 테이블 헤더 준비
    const headers = columns.map(col => col.title);

    // 테이블 데이터 준비
    const tableData: RowInput[] = data.map(record => {
      return columns.map(col => getCellValue(record, col));
    });

    // 컬럼 너비 계산
    const columnStyles: { [key: number]: { cellWidth: number | 'auto'; halign: 'left' | 'center' | 'right' } } = {};
    const totalWidth = pageWidth - margin * 2;
    const defaultWidth = totalWidth / columns.length;

    columns.forEach((col, index) => {
      columnStyles[index] = {
        cellWidth: col.width ? (totalWidth * col.width / 100) : 'auto',
        halign: col.align || 'center',
      };
    });

    // autoTable로 테이블 생성
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'NanumGothic',
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [54, 96, 146],
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250],
      },
      columnStyles,
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // 페이지 번호 추가
        if (showFooter) {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `${data.pageNumber} / ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      },
    });

    // 푸터
    if (showFooter) {
      const finalY = (doc as any).lastAutoTable?.finalY || pageHeight - 30;
      if (finalY < pageHeight - 25) {
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `본 문서는 ERP 시스템에서 자동 생성된 문서입니다. (총 ${data.length}건)`,
          pageWidth / 2,
          finalY + 10,
          { align: 'center' }
        );
      }
    }

    // PDF 저장
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);

    message.success({ content: 'PDF 파일이 다운로드되었습니다.', key: 'pdf-export' });
  } catch (error) {
    console.error('Vector PDF export error:', error);
    message.error({ content: `PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, key: 'pdf-export' });
  }
};

/**
 * 거래원장 전용 벡터 PDF 내보내기
 */
export interface TransactionLedgerVectorPdfOptions {
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
  entries: any[];
  ledgerEntries: any[];
}

export const exportTransactionLedgerToVectorPdf = async (options: TransactionLedgerVectorPdfOptions): Promise<void> => {
  const { filename, title, customer, dateRange, previousBalance, entries, ledgerEntries } = options;

  if (!entries || entries.length === 0) {
    message.warning('내보낼 데이터가 없습니다.');
    return;
  }

  try {
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    // 집계 계산
    const totalQuantity = entries
      .filter((e: any) => !e.isCarryOver && e.type !== 'receipt' && e.type !== 'payment')
      .reduce((sum: number, e: any) => sum + (e.currentItemInfo?.quantity || 0), 0);
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

    // PDF 생성 (가로)
    const doc = await createPDFWithKoreanFont('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    let currentY = margin;

    // 제목
    doc.setFontSize(18);
    doc.text(title, margin, currentY + 5);
    currentY += 13;

    // 거래처 정보 박스
    doc.setFontSize(10);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 249, 250);

    const col1X = margin + 3;
    const col2X = margin + 75;
    const col3X = margin + 145;
    const col4X = margin + 215;

    // 주소 길이 체크: col2X 이전에 끝나지 않으면 단독 줄로 분리
    const addressText = `주소: ${customer.address || '미등록'}`;
    const addressWidth = doc.getTextWidth(addressText);
    const addressNeedsWrap = addressWidth > (col2X - col1X - 5);

    const boxHeight = addressNeedsWrap ? 22 : 16;
    doc.rect(margin, currentY, pageWidth - margin * 2, boxHeight, 'FD');

    doc.text(`거래처명: ${customer.name}`, col1X, currentY + 5);
    doc.text(`거래처코드: ${customer.customerCode}`, col2X, currentY + 5);
    doc.text(`사업자번호: ${formatBusinessNumber(customer.businessNumber)}`, col3X, currentY + 5);
    doc.text(`대표자: ${customer.representative || '미등록'}`, col4X, currentY + 5);

    if (addressNeedsWrap) {
      doc.text(addressText, col1X, currentY + 11);
      doc.text(`전화번호: ${customer.phone || '미등록'}`, col1X, currentY + 17);
      doc.text(`이메일: ${customer.email || '미등록'}`, col3X, currentY + 17);
      doc.text(`조회기간: ${dateRange.start} ~ ${dateRange.end}`, col4X, currentY + 17);
    } else {
      doc.text(addressText, col1X, currentY + 11);
      doc.text(`전화번호: ${customer.phone || '미등록'}`, col2X, currentY + 11);
      doc.text(`이메일: ${customer.email || '미등록'}`, col3X, currentY + 11);
      doc.text(`조회기간: ${dateRange.start} ~ ${dateRange.end}`, col4X, currentY + 11);
    }

    currentY += (addressNeedsWrap ? 26 : 20);

    // 구분명 매핑 및 색상
    const typeNameMap: Record<string, string> = {
      'sales': '매출',
      'purchase': '매입',
      'receipt': '수금',
      'payment': '지급'
    };

    // 구분 컬럼 색상 (RGB)
    const typeColorMap: Record<string, [number, number, number]> = {
      'sales': [24, 144, 255],      // 파랑 (매출)
      'purchase': [255, 77, 79],    // 빨강 (매입)
      'receipt': [82, 196, 26],     // 초록 (수금)
      'payment': [114, 46, 209],    // 보라 (지급 — 매입 빨강과 구분)
      'carryover': [250, 140, 22],  // 주황 (이월)
    };

    // 공급가액 컬럼 색상 (웹과 동일)
    const amountColorMap: Record<string, [number, number, number]> = {
      'sales': [24, 144, 255],      // 파랑 (매출)
      'purchase': [0, 0, 0],        // 검정 (매입)
      'receipt': [255, 77, 79],     // 빨강 (수금)
      'payment': [0, 0, 0],         // 검정 (지급)
      'carryover': [19, 194, 194],  // 청록 (이월)
    };

    // 테이블 데이터 준비
    const tableData: RowInput[] = [];

    // 이월잔액 행
    if (previousBalance !== 0) {
      tableData.push([
        { content: dateRange.start, styles: { halign: 'center' } },
        { content: customer.name, styles: { halign: 'center' } },
        { content: '이월', styles: { halign: 'center', textColor: typeColorMap['carryover'] } },
        { content: '이월잔액', styles: { halign: 'center', textColor: [0, 0, 0] } },
        { content: '', styles: { halign: 'right' } },
        { content: '', styles: { halign: 'right' } },
        { content: '', styles: { halign: 'right' } },
        { content: '', styles: { halign: 'right' } },
        { content: previousBalance.toLocaleString() + '원', styles: { halign: 'right', textColor: previousBalance > 0 ? [24, 144, 255] : previousBalance < 0 ? [255, 77, 79] : [0, 0, 0] } },
        { content: '', styles: { halign: 'center' } }
      ]);
    }

    // 거래 내역 행
    entries.filter((e: any) => !e.isCarryOver).forEach((entry: any) => {
      const { isFirstRow, currentItemInfo, cumulativeBalance } = entry;

      // 품목명 (수금은 "수금", 지급은 "출금", 매출/매입은 품목명)
      let itemDisplay = '';
      if (entry.type === 'receipt') {
        itemDisplay = '수금';
      } else if (entry.type === 'payment') {
        itemDisplay = '출금';
      } else if (currentItemInfo) {
        itemDisplay = currentItemInfo.itemName || '';
      } else {
        itemDisplay = entry.description || '';
      }

      // 금액들
      const displaySupplyAmount = currentItemInfo?.amount ?? (isFirstRow ? entry.supplyAmount : null);
      const displayTax = currentItemInfo?.taxAmount ?? (isFirstRow ? entry.vatAmount : null);
      const displayTotal = currentItemInfo?.totalAmount ?? (isFirstRow ? entry.totalAmount : null);

      // 구분 컬럼 색상
      const typeColor = typeColorMap[entry.type] || [0, 0, 0];
      // 공급가액 컬럼 색상: 음수(반품)는 빨강, 양수는 유형별 색 (웹과 동일하게 맞춤)
      const amountColor: [number, number, number] =
        (displaySupplyAmount != null && Number(displaySupplyAmount) < 0)
          ? [255, 77, 79]
          : (amountColorMap[entry.type] || [0, 0, 0]);

      tableData.push([
        { content: isFirstRow ? (entry.date?.substring(0, 10) || '') : '', styles: { halign: 'center' } },
        { content: isFirstRow ? (entry.customerName || customer.name) : '', styles: { halign: 'center' } },
        { content: isFirstRow ? (typeNameMap[entry.type] || '') : '', styles: { halign: 'center', textColor: isFirstRow ? typeColor : [0, 0, 0] } },
        { content: itemDisplay, styles: { halign: 'center', textColor: [0, 0, 0] } },
        {
          content: (entry.type !== 'receipt' && entry.type !== 'payment' && currentItemInfo?.quantity != null)
            ? currentItemInfo.quantity.toLocaleString()
            : '',
          styles: { halign: 'right' }
        },
        { content: displaySupplyAmount !== null && displaySupplyAmount !== undefined ? displaySupplyAmount.toLocaleString() + '원' : '', styles: { halign: 'right', textColor: amountColor } },
        { content: displayTax !== null && displayTax !== undefined ? displayTax.toLocaleString() + '원' : '', styles: { halign: 'right', textColor: (displayTax != null && Number(displayTax) < 0) ? [255, 77, 79] : [0, 0, 0] } },
        { content: displayTotal !== null && displayTotal !== undefined ? displayTotal.toLocaleString() + '원' : '', styles: { halign: 'right', textColor: (displayTotal != null && Number(displayTotal) < 0) ? [255, 77, 79] : [0, 0, 0] } },
        { content: (cumulativeBalance ?? 0).toLocaleString() + '원', styles: { halign: 'right', textColor: (cumulativeBalance ?? 0) > 0 ? [24, 144, 255] : (cumulativeBalance ?? 0) < 0 ? [255, 77, 79] : [0, 0, 0] } },
        { content: isFirstRow ? (entry.memo || '') : '', styles: { halign: 'center' } }
      ]);
    });

    // autoTable로 메인 테이블 생성
    autoTable(doc, {
      startY: currentY,
      head: [['일자', '거래처', '구분', '품목명', '수량', '공급가액', '세액', '합계', '잔액', '비고']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'NanumGothic',
        fontSize: 9,
        cellPadding: 2.5,
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [41, 82, 136],
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 27 },  // 일자
        1: { cellWidth: 26 },  // 거래처
        2: { cellWidth: 16 },  // 구분
        3: { cellWidth: 'auto' },  // 품목명
        4: { cellWidth: 16, halign: 'right' },  // 수량
        5: { cellWidth: 28, halign: 'right' },  // 공급가액
        6: { cellWidth: 21, halign: 'right' },  // 세액
        7: { cellWidth: 28, halign: 'right' },  // 합계
        8: { cellWidth: 28, halign: 'right' },  // 잔액
        9: { cellWidth: 32 },  // 비고
      },
      margin: { left: margin, right: margin },
    });

    let summaryY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    summaryY += 2;

    // 합계 테이블
    autoTable(doc, {
      startY: summaryY,
      body: [
        [
          { content: '합계', colSpan: 4, styles: { halign: 'center', fontStyle: 'normal', fillColor: [250, 250, 250] } },
          { content: totalQuantity > 0 ? totalQuantity.toLocaleString() : '', styles: { halign: 'right', fillColor: [250, 250, 250] } },
          { content: '', styles: { halign: 'center', fillColor: [250, 250, 250] } },
          { content: '', styles: { halign: 'center', fillColor: [250, 250, 250] } },
          { content: '', styles: { halign: 'center', fillColor: [250, 250, 250] } },
          { content: finalBalance.toLocaleString() + '원', styles: { halign: 'right', fontStyle: 'normal', textColor: finalBalance > 0 ? [24, 144, 255] : finalBalance < 0 ? [255, 77, 79] : [0, 0, 0], fillColor: [250, 250, 250] } },
          { content: '', styles: { halign: 'center', fillColor: [250, 250, 250] } },
        ],
        [
          { content: '매출 합계', colSpan: 4, styles: { halign: 'center', fontStyle: 'normal', fillColor: [240, 240, 240] } },
          { content: '', styles: { halign: 'center', fillColor: [240, 240, 240] } },
          { content: totalSalesSupply.toLocaleString() + '원', styles: { halign: 'right', textColor: [24, 144, 255], fillColor: [240, 240, 240] } },
          { content: totalSalesVat.toLocaleString() + '원', styles: { halign: 'right', textColor: [24, 144, 255], fillColor: [240, 240, 240] } },
          { content: totalSalesAmount.toLocaleString() + '원', styles: { halign: 'right', textColor: [24, 144, 255], fillColor: [240, 240, 240] } },
          { content: '수금 합계', styles: { halign: 'center', fontStyle: 'normal', fillColor: [240, 240, 240] } },
          { content: totalReceiptAmount.toLocaleString() + '원', styles: { halign: 'right', textColor: [255, 77, 79], fillColor: [240, 240, 240] } },
        ],
        [
          { content: '매입 합계', colSpan: 4, styles: { halign: 'center', fontStyle: 'normal', fillColor: [240, 240, 240] } },
          { content: '', styles: { halign: 'center', fillColor: [240, 240, 240] } },
          { content: totalPurchaseSupply.toLocaleString() + '원', styles: { halign: 'right', fillColor: [240, 240, 240] } },
          { content: totalPurchaseVat.toLocaleString() + '원', styles: { halign: 'right', fillColor: [240, 240, 240] } },
          { content: totalPurchaseAmount.toLocaleString() + '원', styles: { halign: 'right', fillColor: [240, 240, 240] } },
          { content: '지급 합계', styles: { halign: 'center', fontStyle: 'normal', fillColor: [240, 240, 240] } },
          { content: totalPaymentAmount.toLocaleString() + '원', styles: { halign: 'right', fillColor: [240, 240, 240] } },
        ],
      ],
      theme: 'grid',
      styles: {
        font: 'NanumGothic',
        fontSize: 9,
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 27 },
        1: { cellWidth: 26 },
        2: { cellWidth: 16 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 16 },
        5: { cellWidth: 28 },
        6: { cellWidth: 21 },
        7: { cellWidth: 28 },
        8: { cellWidth: 28 },
        9: { cellWidth: 32 },
      },
      margin: { left: margin, right: margin },
    });

    // PDF 저장
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);

    message.success({ content: '거래원장 PDF가 다운로드되었습니다.', key: 'pdf-export' });
  } catch (error) {
    console.error('Transaction Ledger Vector PDF export error:', error);
    message.error({ content: `PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, key: 'pdf-export' });
  }
};

/**
 * 견적서/발주서 등 문서 형식 벡터 PDF 내보내기
 */
export interface DocumentVectorPdfOptions {
  filename: string;
  title: string;
  documentNumber: string;
  date: string;
  supplier: {
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  customer: {
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
  };
  items: Array<{
    name: string;
    spec?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    memo?: string;
  }>;
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  memo?: string;
  validUntil?: string;
}

export const exportDocumentToVectorPdf = async (options: DocumentVectorPdfOptions): Promise<void> => {
  const {
    filename,
    title,
    documentNumber,
    date,
    supplier,
    customer,
    items,
    totalAmount,
    vatAmount,
    grandTotal,
    memo,
    validUntil,
  } = options;

  try {
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    // PDF 생성 (세로)
    const doc = await createPDFWithKoreanFont('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    let currentY = margin;

    // 제목
    doc.setFontSize(22);
    doc.text(title, pageWidth / 2, currentY + 8, { align: 'center' });
    currentY += 18;

    // 문서번호 및 날짜
    doc.setFontSize(10);
    doc.text(`문서번호: ${documentNumber}`, margin, currentY);
    doc.text(`작성일자: ${date}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 10;

    // 공급자/공급받는자 정보 (2열)
    const boxWidth = (pageWidth - margin * 3) / 2;
    const boxHeight = 38;

    // 공급자 (왼쪽)
    doc.setDrawColor(0, 0, 0);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, boxWidth, boxHeight, 'D');
    doc.setFontSize(11);
    doc.text('공 급 자', margin + boxWidth / 2, currentY + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`상호: ${supplier.name}`, margin + 3, currentY + 13);
    doc.text(`대표자: ${supplier.representative || ''}`, margin + 3, currentY + 19);
    doc.text(`사업자번호: ${supplier.businessNumber || ''}`, margin + 3, currentY + 25);
    doc.text(`주소: ${(supplier.address || '').substring(0, 25)}`, margin + 3, currentY + 31);

    // 공급받는자 (오른쪽)
    const rightBoxX = margin * 2 + boxWidth;
    doc.rect(rightBoxX, currentY, boxWidth, boxHeight, 'D');
    doc.setFontSize(11);
    doc.text('공급받는자', rightBoxX + boxWidth / 2, currentY + 6, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`상호: ${customer.name}`, rightBoxX + 3, currentY + 13);
    doc.text(`대표자: ${customer.representative || ''}`, rightBoxX + 3, currentY + 19);
    doc.text(`사업자번호: ${customer.businessNumber || ''}`, rightBoxX + 3, currentY + 25);
    doc.text(`주소: ${(customer.address || '').substring(0, 25)}`, rightBoxX + 3, currentY + 31);

    currentY += boxHeight + 8;

    // 품목 테이블
    const tableData: RowInput[] = items.map((item, index) => [
      String(index + 1),
      item.name,
      item.spec || '',
      item.unit || '',
      String(item.quantity),
      item.unitPrice.toLocaleString(),
      item.amount.toLocaleString(),
      item.memo || ''
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['No', '품목명', '규격', '단위', '수량', '단가', '금액', '비고']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'NanumGothic',
        fontSize: 9,
        cellPadding: 3,
        halign: 'center',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [54, 96, 146],
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 28, halign: 'right' },
        7: { cellWidth: 25 },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable?.finalY || currentY + 50;
    currentY += 5;

    // 합계 정보
    const summaryX = pageWidth - margin - 80;
    doc.setFontSize(11);
    doc.text(`공급가액: ${Math.round(totalAmount).toLocaleString()}원`, summaryX, currentY);
    currentY += 7;
    doc.text(`부가세: ${Math.round(vatAmount).toLocaleString()}원`, summaryX, currentY);
    currentY += 7;
    doc.setFontSize(13);
    doc.text(`합계금액: ${Math.round(grandTotal).toLocaleString()}원`, summaryX, currentY);
    currentY += 11;

    // 메모
    if (memo) {
      doc.setFontSize(10);
      doc.text(`비고: ${memo}`, margin, currentY);
      currentY += 7;
    }

    // 유효기간
    if (validUntil) {
      doc.setFontSize(10);
      doc.text(`유효기간: ${validUntil}`, margin, currentY);
    }

    // PDF 저장
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);

    message.success({ content: 'PDF가 다운로드되었습니다.', key: 'pdf-export' });
  } catch (error) {
    console.error('Document Vector PDF export error:', error);
    message.error({ content: `PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, key: 'pdf-export' });
  }
};

/**
 * 견적서 전용 벡터 PDF - 화면 레이아웃 그대로 재현
 */
export interface QuotationVectorPdfOptions {
  filename: string;
  documentNumber: string;
  date: string;
  validUntil?: string;
  supplier: {
    name: string;
    businessNumber?: string;
    representative?: string;
    address?: string;
    phone?: string;
    fax?: string;
    sealImage?: string;
  };
  receiver: {
    name: string;
    representative?: string;
    address?: string;
    phone?: string;
  };
  items: Array<{
    productName: string;
    spec?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    supplyAmount: number;
    vatAmount: number;
    totalAmount: number;
  }>;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  memo?: string;
}

export const exportQuotationToVectorPdf = async (options: QuotationVectorPdfOptions): Promise<void> => {
  const { filename, documentNumber, date, validUntil, supplier, receiver, items, supplyAmount, vatAmount, totalAmount, memo } = options;

  try {
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    const doc = await createPDFWithKoreanFont('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const margin = 15;
    const navy: [number, number, number] = [26, 35, 126];
    const gray: [number, number, number] = [120, 120, 120];
    const lightGray: [number, number, number] = [245, 245, 245];
    const borderGray: [number, number, number] = [200, 200, 200];
    const red: [number, number, number] = [211, 47, 47];
    const fmt = (n: number) => new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(n));

    let y = margin;

    // ── 1. 제목 ──────────────────────────────────────
    doc.setFont('NanumGothic', 'normal');
    doc.setFontSize(26);
    doc.setTextColor(...navy);
    doc.text('견  적  서', pageWidth / 2, y + 10, { align: 'center' });
    y += 16;
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('QUOTATION', pageWidth / 2, y + 4, { align: 'center' });
    y += 12;

    // ── 2. 귀하 ──────────────────────────────────────
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const receiverLabel = receiver.name ? `${receiver.name} 귀하` : '귀하';
    doc.text(receiverLabel, margin, y + 6);
    y += 12;

    // ── 3. 견적 정보(좌) + 견적금액 박스(우) ──────────
    const infoW = 88;
    const labelW = 28;
    const rowH = 9;
    const infoRows = [
      ['견적번호', documentNumber],
      ['견적일자', date],
      ['유효기간', validUntil ? `${validUntil}까지` : '-'],
    ];

    infoRows.forEach((row, i) => {
      const ry = y + i * rowH;
      // 라벨 셀
      doc.setFillColor(...lightGray);
      doc.setDrawColor(...borderGray);
      doc.rect(margin, ry, labelW, rowH, 'FD');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(row[0], margin + 3, ry + 6);
      // 값 셀
      doc.setFillColor(255, 255, 255);
      doc.rect(margin + labelW, ry, infoW - labelW, rowH, 'FD');
      doc.setTextColor(0, 0, 0);
      doc.text(row[1], margin + labelW + 3, ry + 6);
    });

    // 견적금액 박스
    const boxX = margin + infoW + 5;
    const boxW = pageWidth - margin - boxX;
    const boxH = rowH * 3;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.8);
    doc.setFillColor(255, 255, 255);
    doc.rect(boxX, y, boxW, boxH, 'FD');
    doc.setLineWidth(0.2);

    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text('견적금액', boxX + boxW / 2, y + 8, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(...red);
    doc.text(`\u20A9 ${fmt(totalAmount)}`, boxX + boxW / 2, y + 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text('(부가세 포함)', boxX + boxW / 2, y + 24, { align: 'center' });

    y += boxH + 8;

    // ── 4. 품목 테이블 ────────────────────────────────
    const emptyCount = Math.max(0, 5 - items.length);
    const tableBody: RowInput[] = [
      ...items.map((item, i) => [
        String(i + 1),
        item.productName,
        item.spec || '',
        item.unit || '',
        fmt(item.quantity),
        fmt(item.unitPrice),
        fmt(item.supplyAmount),
        fmt(item.vatAmount),
      ]),
      ...Array.from({ length: emptyCount }).map(() => ['', '', '', '', '', '', '', '']),
    ];

    autoTable(doc, {
      startY: y,
      head: [['No', '품목명', '규격', '단위', '수량', '단가', '공급가액', '세액']],
      body: tableBody,
      foot: [['합  계', '', '', '', '', fmt(supplyAmount), fmt(vatAmount), fmt(totalAmount)]],
      theme: 'grid',
      styles: {
        font: 'NanumGothic',
        fontSize: 9,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        halign: 'center',
        valign: 'middle',
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
      },
      footStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        fontSize: 10,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 14, halign: 'center' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 26, halign: 'right' },
        7: { cellWidth: 22, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as any).lastAutoTable?.finalY || y + 60;
    y += 4;

    // ── 5. 비고 ──────────────────────────────────────
    if (memo) {
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(...borderGray);
      doc.setFillColor(250, 250, 250);
      const memoLines = doc.splitTextToSize(`비고: ${memo}`, pageWidth - margin * 2 - 6);
      const memoH = memoLines.length * 5 + 6;
      doc.rect(margin, y, pageWidth - margin * 2, memoH, 'FD');
      doc.text(memoLines, margin + 3, y + 5);
      y += memoH + 4;
    }

    // ── 6. 구분선 ─────────────────────────────────────
    y += 2;
    doc.setDrawColor(...navy);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineWidth(0.2);
    y += 6;

    // ── 7. 공급자 정보 ────────────────────────────────
    doc.setFontSize(11);
    doc.setTextColor(...navy);
    doc.setFont('NanumGothic', 'normal');
    doc.text('공급자', margin, y + 5);
    y += 9;

    const supplierRows = [
      ['상호', supplier.name || ''],
      ['사업자번호', formatBusinessNumber(supplier.businessNumber || '')],
      ['대표자', supplier.representative || ''],
      ['주소', supplier.address || ''],
      ['연락처', [supplier.phone && `Tel: ${supplier.phone}`, supplier.fax && `Fax: ${supplier.fax}`].filter(Boolean).join(' / ')],
    ];

    const sealBoxX = pageWidth - margin - 28;
    const sealBoxY = y;
    const sealBoxSize = supplierRows.length * 7 + 2;

    supplierRows.forEach((row, i) => {
      const ry = y + i * 7;
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(row[0], margin, ry + 5);
      doc.setTextColor(0, 0, 0);
      doc.setFont('NanumGothic', 'normal');
      doc.text(row[1], margin + 22, ry + 5);
    });

    // (인) 도장 박스
    doc.setDrawColor(...borderGray);
    doc.setFillColor(255, 255, 255);
    doc.rect(sealBoxX, sealBoxY, 28, sealBoxSize, 'FD');

    if (supplier.sealImage) {
      try {
        const imgSrc = supplier.sealImage.startsWith('data:')
          ? supplier.sealImage
          : supplier.sealImage;
        doc.addImage(imgSrc, 'PNG', sealBoxX + 2, sealBoxY + 2, 24, sealBoxSize - 4);
      } catch {
        doc.setFontSize(9);
        doc.setTextColor(...gray);
        doc.text('(인)', sealBoxX + 14, sealBoxY + sealBoxSize / 2 + 3, { align: 'center' });
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text('(인)', sealBoxX + 14, sealBoxY + sealBoxSize / 2 + 3, { align: 'center' });
    }

    // PDF 저장
    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(`${filename}_${dateStr}.pdf`);

    message.success({ content: '견적서 PDF가 다운로드되었습니다.', key: 'pdf-export' });
  } catch (error) {
    console.error('Quotation Vector PDF export error:', error);
    message.error({ content: `PDF 내보내기에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`, key: 'pdf-export' });
  }
};
