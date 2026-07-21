import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppDataSource } from '../config/database';
import { Sales } from '../entities/Sales';
import { SalesItem } from '../entities/SalesItem';
import { Purchase } from '../entities/Purchase';
import { PurchaseItem } from '../entities/PurchaseItem';
import { Payment, PaymentType } from '../entities/Payment';
import { Customer } from '../entities/Customer';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import { Between, MoreThanOrEqual, LessThanOrEqual, Like } from 'typeorm';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * ERP 데이터를 조회하는 헬퍼 함수들
 */
class ERPDataHelper {
  // 매출 통계 조회
  static async getSalesStats(businessId: number, startDate?: string, endDate?: string) {
    const salesRepo = AppDataSource.getRepository(Sales);

    let whereCondition: any = { businessId };
    if (startDate && endDate) {
      whereCondition.transactionDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereCondition.transactionDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereCondition.transactionDate = LessThanOrEqual(new Date(endDate));
    }

    const sales = await salesRepo.find({
      where: whereCondition,
      relations: ['customer', 'items', 'items.product']
    });

    const totalSales = sales.reduce((sum, sale) => sum + (Number(sale.totalAmount) || 0), 0);
    const totalVat = sales.reduce((sum, sale) => sum + (Number(sale.vatAmount) || 0), 0);

    return {
      count: sales.length,
      totalAmount: totalSales,
      totalVat: totalVat,
      grandTotal: totalSales + totalVat,
      sales: sales.slice(0, 10) // 최근 10개만 반환
    };
  }

  // 매입 통계 조회
  static async getPurchaseStats(businessId: number, startDate?: string, endDate?: string) {
    const purchaseRepo = AppDataSource.getRepository(Purchase);

    let whereCondition: any = { businessId };
    if (startDate && endDate) {
      whereCondition.purchaseDate = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereCondition.purchaseDate = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereCondition.purchaseDate = LessThanOrEqual(new Date(endDate));
    }

    const purchases = await purchaseRepo.find({
      where: whereCondition,
      relations: ['customer', 'items', 'items.product']
    });

    const totalPurchase = purchases.reduce((sum, purchase) => sum + (Number(purchase.totalAmount) || 0), 0);
    const totalVat = purchases.reduce((sum, purchase) => sum + (Number(purchase.vatAmount) || 0), 0);

    return {
      count: purchases.length,
      totalAmount: totalPurchase,
      totalVat: totalVat,
      grandTotal: totalPurchase + totalVat,
      purchases: purchases.slice(0, 10)
    };
  }

  // 고객 정보 조회
  static async getCustomerInfo(businessId: number, searchTerm?: string) {
    const customerRepo = AppDataSource.getRepository(Customer);

    const query = customerRepo.createQueryBuilder('customer')
      .where('customer.businessId = :businessId', { businessId });

    if (searchTerm) {
      query.andWhere(
        '(LOWER(customer.name) LIKE LOWER(:search) OR LOWER(customer.businessNumber) LIKE LOWER(:search) OR LOWER(customer.phone) LIKE LOWER(:search))',
        { search: `%${searchTerm}%` }
      );
    }

    const customers = await query.take(10).getMany();

    return {
      count: customers.length,
      customers
    };
  }

  // 제품 재고 조회
  static async getProductInventory(businessId: number, searchTerm?: string) {
    const productRepo = AppDataSource.getRepository(Product);

    const query = productRepo.createQueryBuilder('product')
      .where('product.businessId = :businessId', { businessId });

    if (searchTerm) {
      query.andWhere(
        '(LOWER(product.name) LIKE LOWER(:search) OR LOWER(product.productCode) LIKE LOWER(:search))',
        { search: `%${searchTerm}%` }
      );
    }

    const products = await query.take(10).getMany();

    return {
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        productCode: p.productCode,
        currentStock: p.currentStock || 0,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        taxType: p.taxType
      }))
    };
  }

  // 전체 대시보드 통계
  static async getDashboardStats(businessId: number) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // 1-12
    const lastDay = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날짜

    const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const salesStats = await this.getSalesStats(
      businessId,
      firstDayStr,
      lastDayStr  // 이번 달 말일까지
    );

    const purchaseStats = await this.getPurchaseStats(
      businessId,
      firstDayStr,
      lastDayStr  // 이번 달 말일까지
    );

    const customerCount = await AppDataSource.getRepository(Customer).count({ where: { businessId } });
    const productCount = await AppDataSource.getRepository(Product).count({ where: { businessId } });

    return {
      thisMonthSales: salesStats,
      thisMonthPurchase: purchaseStats,
      totalCustomers: customerCount,
      totalProducts: productCount,
      profit: salesStats.totalAmount - purchaseStats.totalAmount
    };
  }

  // 고객 검색 (이름 또는 사업자번호로)
  static async findCustomerByName(businessId: number, customerName: string) {
    const customerRepo = AppDataSource.getRepository(Customer);

    const customers = await customerRepo.find({
      where: [
        { businessId, name: Like(`%${customerName}%`) },
        { businessId, businessNumber: Like(`%${customerName}%`) }
      ]
    });

    return customers;
  }

  // 제품 검색 (이름 또는 코드로)
  static async findProductByName(businessId: number, productName: string) {
    const productRepo = AppDataSource.getRepository(Product);

    const products = await productRepo.find({
      where: [
        { businessId, name: Like(`%${productName}%`) },
        { businessId, productCode: Like(`%${productName}%`) }
      ]
    });

    return products;
  }

  /**
   * 제품 가격과 과세 유형으로 가격 유형 자동 인식
   * @returns 'tax_exempt' (면세), 'vat_included' (부가세 포함), 'vat_separate' (부가세 별도)
   */
  static inferPriceType(sellPrice: number, taxType: string): string {
    // 1. DB에 저장된 영어 값으로 직접 확인 (최우선)
    if (taxType === 'tax_free') return 'tax_exempt';
    if (taxType === 'tax_inclusive') return 'vat_included';
    if (taxType === 'tax_separate') return 'vat_separate';

    // 2. 한글 면세/영세 확인 (AI 추출값)
    if (taxType === '면세' || taxType === 'tax_exempt') return 'tax_exempt';
    if (taxType === '영세' || taxType === 'zero_rated') return 'tax_exempt';

    // 3. 과세 품목인 경우 가격 패턴으로 판단
    if (taxType === '과세' || taxType === 'taxable' || !taxType) {
      if (sellPrice % 10 === 0) return 'vat_separate';

      const priceWithoutVAT = sellPrice / 1.1;
      const roundedPrice = Math.round(priceWithoutVAT);
      if (Math.abs(priceWithoutVAT - roundedPrice) < 1 && roundedPrice % 10 === 0) {
        return 'vat_included';
      }
      return 'vat_separate';
    }

    return 'vat_separate';
  }

  // 매출 등록
  static async createSales(businessId: number, salesData: {
    customerId?: number;
    customerName?: string;
    transactionDate: string;
    totalAmount: number;
    vatAmount: number;
    description?: string;
    memo?: string;
    items: Array<{
      productId?: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      taxType?: string;
    }>;
  }) {
    const salesRepo = AppDataSource.getRepository(Sales);
    const salesItemRepo = AppDataSource.getRepository(SalesItem);

    // 매출 생성
    const sales = salesRepo.create({
      businessId,
      customerId: salesData.customerId || null,
      transactionDate: salesData.transactionDate || new Date().toISOString().split('T')[0],
      totalAmount: salesData.totalAmount || 0,
      vatAmount: salesData.vatAmount || 0,
      description: salesData.description || null,
      memo: salesData.memo || null
    });

    const savedSales = await salesRepo.save(sales);

    // 거래 항목들 생성
    if (salesData.items && salesData.items.length > 0) {
      const items = [];
      for (const itemData of salesData.items) {
        const supplyAmount = itemData.amount || (itemData.quantity * itemData.unitPrice);

        // taxType에 따라 VAT 계산
        let taxAmount = 0;
        const itemTaxType = itemData.taxType || '과세';
        if (itemTaxType === '과세') {
          taxAmount = supplyAmount * 0.1; // 10% VAT
        } else if (itemTaxType === '영세') {
          taxAmount = 0; // 0% VAT (zero-rated)
        } else {
          taxAmount = 0; // 면세 (tax-exempt)
        }

        const item = salesItemRepo.create({
          salesId: savedSales.id,
          productId: itemData.productId || null,
          itemName: itemData.productName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          supplyAmount: supplyAmount,
          taxAmount: taxAmount
        });
        items.push(item);
      }
      await salesItemRepo.save(items);
    }

    // 생성된 데이터를 다시 조회해서 반환
    const result = await salesRepo.findOne({
      where: { id: savedSales.id },
      relations: ['customer', 'items', 'items.product']
    });

    return result;
  }

  // 매입 등록
  static async createPurchase(businessId: number, purchaseData: {
    customerId?: number;
    customerName?: string;
    purchaseDate: string;
    totalAmount: number;
    vatAmount: number;
    memo?: string;
    items: Array<{
      productId?: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      amount: number;
      taxType?: string;
    }>;
  }) {
    const purchaseRepo = AppDataSource.getRepository(Purchase);
    const purchaseItemRepo = AppDataSource.getRepository(PurchaseItem);

    // 매입 생성
    const purchase = purchaseRepo.create({
      businessId,
      customerId: purchaseData.customerId || null,
      purchaseDate: purchaseData.purchaseDate,
      totalAmount: purchaseData.totalAmount,
      vatAmount: purchaseData.vatAmount,
      memo: purchaseData.memo || null
    });

    const savedPurchase = await purchaseRepo.save(purchase);

    // 매입 항목들 생성
    if (purchaseData.items && purchaseData.items.length > 0) {
      const items = [];
      for (const itemData of purchaseData.items) {
        const item = purchaseItemRepo.create({
          purchaseId: savedPurchase.id,
          productId: itemData.productId || null,
          productName: itemData.productName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          amount: itemData.amount
        });
        items.push(item);
      }
      await purchaseItemRepo.save(items);
    }

    // 생성된 데이터를 다시 조회해서 반환
    const result = await purchaseRepo.findOne({
      where: { id: savedPurchase.id },
      relations: ['customer', 'items', 'items.product']
    });

    return result;
  }

  // 수금 등록
  static async createPayment(businessId: number, paymentData: {
    customerId: number;
    customerName?: string;
    paymentDate: string;
    paymentType: '수금' | '입금';
    amount: number;
    paymentMethod?: string;
    description?: string;
    memo?: string;
  }) {
    const paymentRepo = AppDataSource.getRepository(Payment);

    // 수금/입금 생성
    const payment = paymentRepo.create({
      businessId,
      customerId: paymentData.customerId,
      paymentDate: paymentData.paymentDate,
      paymentType: paymentData.paymentType as PaymentType,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || null,
      description: paymentData.description || null,
      memo: paymentData.memo || null
    });

    const savedPayment = await paymentRepo.save(payment);

    // 생성된 데이터를 다시 조회해서 반환
    const result = await paymentRepo.findOne({
      where: { id: savedPayment.id },
      relations: ['customer']
    });

    return result;
  }
}

/**
 * 사용자 의도를 분석하고 적절한 데이터를 가져오는 함수
 */
async function analyzeIntentAndFetchData(message: string, businessId: number) {
  const messageLower = message.toLowerCase();

  let context = '';
  let data: any = {};

  // 이번 달 시작일과 말일 (타임존 영향 없이)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // 1-12
  const lastDay = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날짜

  const firstDayStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 매출 관련 질문 (이번 달 1일 ~ 말일)
  if (messageLower.includes('매출') || messageLower.includes('판매') || messageLower.includes('sales')) {
    data.salesStats = await ERPDataHelper.getSalesStats(businessId, firstDayStr, lastDayStr);
    context += `\n\n[매출 데이터 (${firstDayStr} ~ ${lastDayStr})]\n건수: ${data.salesStats.count}건\n공급가액: ${data.salesStats.totalAmount.toLocaleString()}원\n부가세: ${data.salesStats.totalVat.toLocaleString()}원\n총 매출액(부가세 포함): ${data.salesStats.grandTotal.toLocaleString()}원`;
  }

  // 매입 관련 질문 (이번 달 1일 ~ 말일)
  if (messageLower.includes('매입') || messageLower.includes('구매') || messageLower.includes('purchase')) {
    data.purchaseStats = await ERPDataHelper.getPurchaseStats(businessId, firstDayStr, lastDayStr);
    context += `\n\n[매입 데이터 (${firstDayStr} ~ ${lastDayStr})]\n건수: ${data.purchaseStats.count}건\n공급가액: ${data.purchaseStats.totalAmount.toLocaleString()}원\n부가세: ${data.purchaseStats.totalVat.toLocaleString()}원\n총 매입액(부가세 포함): ${data.purchaseStats.grandTotal.toLocaleString()}원`;
  }

  // 고객 관련 질문
  if (messageLower.includes('고객') || messageLower.includes('거래처') || messageLower.includes('customer')) {
    data.customerInfo = await ERPDataHelper.getCustomerInfo(businessId);
    context += `\n\n[고객 정보]\n총 고객 수: ${data.customerInfo.count}명`;
  }

  // 재고 관련 질문
  if (messageLower.includes('재고') || messageLower.includes('제품') || messageLower.includes('product') || messageLower.includes('inventory')) {
    data.productInventory = await ERPDataHelper.getProductInventory(businessId);
    context += `\n\n[제품 재고]\n총 제품 수: ${data.productInventory.count}개`;
    if (data.productInventory.products.length > 0) {
      context += '\n주요 제품:\n';
      data.productInventory.products.slice(0, 5).forEach((p: any) => {
        context += `- ${p.name}: 재고 ${p.currentStock}개, 판매가 ${p.sellPrice.toLocaleString()}원\n`;
      });
    }
  }

  // 대시보드/전체 통계
  if (messageLower.includes('전체') || messageLower.includes('통계') || messageLower.includes('현황') || messageLower.includes('dashboard')) {
    data.dashboardStats = await ERPDataHelper.getDashboardStats(businessId);
    context += `\n\n[이번 달 전체 현황]\n총 매출액(부가세 포함): ${data.dashboardStats.thisMonthSales.grandTotal.toLocaleString()}원\n총 매입액(부가세 포함): ${data.dashboardStats.thisMonthPurchase.grandTotal.toLocaleString()}원\n수익(공급가액 기준): ${data.dashboardStats.profit.toLocaleString()}원\n고객 수: ${data.dashboardStats.totalCustomers}명\n제품 수: ${data.dashboardStats.totalProducts}개`;
  }

  return { context, data };
}

/**
 * AI를 사용해 거래 정보 추출 (매출, 매입, 수금, 입금)
 */
async function extractTransactionInfo(message: string, businessId: number) {
  const today = new Date().toISOString().split('T')[0];

  const extractPrompt = `다음 메시지에서 거래 정보를 추출해주세요.

메시지: ${message}

다음 형식의 JSON으로 응답해주세요:

**단일 거래인 경우:**
{
  "isMultiple": false,
  "transaction": {
    "transactionType": "매출" | "매입" | "수금" | "입금" | null,
    "customerName": "고객명",
    "taxType": "과세" | "면세" | "영세",
    "items": [
      {
        "productName": "제품명",
        "quantity": 수량(숫자),
        "unitPrice": 단가(숫자),
        "amount": 금액(숫자),
        "taxType": "과세" | "면세" | "영세"
      }
    ],
    "totalAmount": 총 공급가액(숫자),
    "vatAmount": 부가세(숫자),
    "description": "설명",
    "transactionDate": "거래일(YYYY-MM-DD 형식)",
    "paymentMethod": "현금|카드|계좌이체 등 (수금/입금인 경우만)"
  }
}

**여러 거래인 경우:**
{
  "isMultiple": true,
  "transactions": [
    {
      "transactionType": "매출" | "매입" | "수금" | "입금" | null,
      "customerName": "고객명",
      "taxType": "과세" | "면세" | "영세",
      "items": [...],
      "totalAmount": 총 공급가액(숫자),
      "vatAmount": 부가세(숫자),
      "description": "설명",
      "transactionDate": "거래일(YYYY-MM-DD 형식)"
    },
    ... (거래 건수만큼 반복)
  ]
}

**거래 유형 판단 기준:**
- "판매", "매출", "팔았어", "판매했어" → 매출
- "구매", "매입", "샀어", "구입했어" → 매입
- "받았어", "수금", "입금받았어", "받음" → 수금
- "지급", "입금", "보냈어", "송금", "지불" → 입금

**면세/과세 판단 기준:**
- "면세", "비과세", "면세품목" → 면세 (부가세 0원)
- "영세", "영세율", "수출" → 영세 (부가세 0원)
- 명시되지 않으면 → 과세 (부가세 10%)
- 면세 품목 예시: 농산물, 축산물, 수산물, 도서, 신문, 잡지, 교육 서비스, 의료 서비스

**중요:**
- 금액에서 천단위 구분자(,) 제거
- "만원"은 10000을 곱하기
- **면세/영세인 경우 vatAmount는 0으로 설정**
- **과세인 경우만 부가세 10% 계산 (totalAmount는 부가세 제외 금액)**
- **여러 고객에 대한 거래가 있으면 isMultiple: true로 설정하고 각각 별도 거래로 분리**
- **한 고객에게 여러 품목을 판매한 경우 하나의 거래로 묶고 items 배열에 포함**
- **과세/면세 품목이 섞여 있으면 각 item의 taxType을 개별 설정하고, 전체 taxType은 "혼합"으로 설정**
- 수금/입금의 경우 items는 비워두고 totalAmount만 설정
- items가 명시되지 않은 경우 description에서 제품명 추출
- 날짜가 "오늘", "내일" 등으로 표현되면 실제 날짜로 변환 (오늘: ${today})
- JSON만 반환하고 다른 텍스트는 포함하지 마세요

**💰 금액 해석 기준 (매우 중요!):**
- **기본 원칙: 명시적으로 "부가세 포함", "VAT 포함", "세금 포함"이라고 하지 않으면 부가세 별도 금액으로 간주**
- 예시 1: "필기도구 10개 10,000원" → 공급가액 10,000원 (부가세 별도)
  - unitPrice: 1000, amount: 10000, totalAmount: 10000, vatAmount: 1000
- 예시 2: "필기도구 10개 부가세 포함 11,000원" → 총액 11,000원 (부가세 포함)
  - unitPrice: 1000, amount: 10000, totalAmount: 10000, vatAmount: 1000
- 예시 3: "노트북 1대 1,000,000원" → 공급가액 1,000,000원
  - totalAmount: 1000000, vatAmount: 100000
- **즉, 사용자가 말한 금액은 공급가액(부가세 제외)으로 해석하고, 거기에 10%를 더해서 vatAmount 계산**

예시 1 (단일 거래 - 부가세 별도):
입력: "홍길동에게 노트북 2대 100만원에 판매했어요"
출력:
{
  "isMultiple": false,
  "transaction": {
    "transactionType": "매출",
    "customerName": "홍길동",
    "taxType": "과세",
    "items": [{"productName": "노트북", "quantity": 2, "unitPrice": 500000, "amount": 1000000, "taxType": "과세"}],
    "totalAmount": 1000000,
    "vatAmount": 100000,
    "description": "노트북 판매",
    "transactionDate": "${today}"
  }
}

예시 2 (여러 고객에게 판매 - 다중 거래):
입력: "가나다라에게 박경환 10개 면세로 10만원, 123에게 필기도구 10개 1만원, 박경환에게 필기도구1 10개 1만원 판매"
출력:
{
  "isMultiple": true,
  "transactions": [
    {
      "transactionType": "매출",
      "customerName": "가나다라",
      "taxType": "면세",
      "items": [{"productName": "박경환", "quantity": 10, "unitPrice": 10000, "amount": 100000, "taxType": "면세"}],
      "totalAmount": 100000,
      "vatAmount": 0,
      "description": "박경환 판매 (면세)",
      "transactionDate": "${today}"
    },
    {
      "transactionType": "매출",
      "customerName": "123",
      "taxType": "과세",
      "items": [{"productName": "필기도구", "quantity": 10, "unitPrice": 1000, "amount": 10000, "taxType": "과세"}],
      "totalAmount": 10000,
      "vatAmount": 1000,
      "description": "필기도구 판매",
      "transactionDate": "${today}"
    },
    {
      "transactionType": "매출",
      "customerName": "박경환",
      "taxType": "과세",
      "items": [{"productName": "필기도구1", "quantity": 10, "unitPrice": 1000, "amount": 10000, "taxType": "과세"}],
      "totalAmount": 10000,
      "vatAmount": 1000,
      "description": "필기도구1 판매",
      "transactionDate": "${today}"
    }
  ]
}

예시 3 (수금):
입력: "박경환에게 50만원 현금으로 받았어요"
출력:
{
  "transactionType": "수금",
  "customerName": "박경환",
  "items": [],
  "totalAmount": 500000,
  "vatAmount": 0,
  "description": "수금",
  "transactionDate": "${today}",
  "paymentMethod": "현금"
}

예시 4 (입금):
입력: "김철수한테 100만원 계좌이체로 보냄"
출력:
{
  "transactionType": "입금",
  "customerName": "김철수",
  "items": [],
  "totalAmount": 1000000,
  "vatAmount": 0,
  "description": "입금",
  "transactionDate": "${today}",
  "paymentMethod": "계좌이체"
}`;

  const result = await model.generateContent(extractPrompt);
  const response = await result.response;
  const text = response.text().trim();

  // JSON 파싱
  try {
    // Markdown 코드 블록 제거
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const transactionInfo = JSON.parse(jsonText);
    return transactionInfo;
  } catch (parseError) {
    console.error('JSON 파싱 실패:', parseError);
    return null;
  }
}

/**
 * 챗봇 메시지 처리
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const user = (req as any).user;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(500).json({
        error: 'Gemini API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.',
        needsApiKey: true
      });
    }

    // businessId 확인
    const businessId = user?.businessId;
    if (!businessId) {
      console.error('❌ businessId가 없습니다:', user);
      return res.status(400).json({ error: '사업자 정보를 찾을 수 없습니다. 다시 로그인해주세요.' });
    }

    // 1단계: 조회 vs 등록 의도 구분
    const messageLower = message.toLowerCase();
    const isQueryIntent =
      messageLower.includes('얼마') ||
      messageLower.includes('조회') ||
      messageLower.includes('확인') ||
      messageLower.includes('알려') ||
      messageLower.includes('보여') ||
      messageLower.includes('어때') ||
      messageLower.includes('어떻게') ||
      messageLower.includes('통계') ||
      messageLower.includes('현황') ||
      messageLower.includes('?') ||
      (messageLower.includes('이번') && !messageLower.includes('등록') && !messageLower.includes('판매') && !messageLower.includes('구매'));

    if (isQueryIntent) {
      // 조회 의도인 경우 일반 질의응답 처리
      const { context, data } = await analyzeIntentAndFetchData(message, businessId);

      const prompt = `당신은 ERP 시스템의 AI 어시스턴트입니다. 사용자의 질문에 대해 친절하고 정확하게 답변해주세요.

사용자 질문: ${message}

ERP 시스템 데이터:${context}

위 데이터를 바탕으로 사용자의 질문에 답변해주세요.

**답변 규칙:**
- 한국어로 답변해주세요
- 숫자는 천 단위로 콤마를 찍어주세요
- **날짜 범위는 데이터에 명시된 그대로 사용하세요. 절대 날짜를 임의로 계산하거나 변경하지 마세요.**
- 데이터가 없을 경우 그 사실을 명확히 알려주세요
- 응답은 깔끔하게 줄바꿈하여 가독성 좋게 작성하세요

**매출/매입 데이터 답변 형식 (필수):**
사용자가 매출이나 매입을 물어보면 반드시 다음 형식으로 답변하세요:

[데이터에 표시된 날짜 범위 그대로]

총매출액(또는 총매입액): [부가세 포함 금액]원
공급가액: [공급가액]원
세액: [부가세]원

총 매출 건수: [건수]건`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        return res.json({
          message: aiResponse,
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (geminiError: any) {
        console.error('Gemini API error:', geminiError.message);

        // Gemini API 에러 시 조회된 데이터를 더 읽기 쉽게 포맷팅하여 반환
        let formattedResponse = '📊 조회 결과:\n';

        if (data.salesStats) {
          formattedResponse += `\n[매출 현황]\n`;
          formattedResponse += `• 거래 건수: ${data.salesStats.count}건\n`;
          formattedResponse += `• 공급가액: ${data.salesStats.totalAmount.toLocaleString()}원\n`;
          formattedResponse += `• 부가세: ${data.salesStats.totalVat.toLocaleString()}원\n`;
          formattedResponse += `• 총 매출액: ${data.salesStats.grandTotal.toLocaleString()}원\n`;
        }

        if (data.purchaseStats) {
          formattedResponse += `\n[매입 현황]\n`;
          formattedResponse += `• 거래 건수: ${data.purchaseStats.count}건\n`;
          formattedResponse += `• 공급가액: ${data.purchaseStats.totalAmount.toLocaleString()}원\n`;
          formattedResponse += `• 부가세: ${data.purchaseStats.totalVat.toLocaleString()}원\n`;
          formattedResponse += `• 총 매입액: ${data.purchaseStats.grandTotal.toLocaleString()}원\n`;
        }

        if (data.dashboardStats) {
          formattedResponse += `\n[이번 달 현황]\n`;
          formattedResponse += `• 총 매출액: ${data.dashboardStats.thisMonthSales.grandTotal.toLocaleString()}원\n`;
          formattedResponse += `• 총 매입액: ${data.dashboardStats.thisMonthPurchase.grandTotal.toLocaleString()}원\n`;
          formattedResponse += `• 수익: ${data.dashboardStats.profit.toLocaleString()}원\n`;
          formattedResponse += `• 고객 수: ${data.dashboardStats.totalCustomers}명\n`;
          formattedResponse += `• 제품 수: ${data.dashboardStats.totalProducts}개\n`;
        }

        if (data.customerInfo) {
          formattedResponse += `\n[고객 정보]\n`;
          formattedResponse += `• 총 고객 수: ${data.customerInfo.count}명\n`;
        }

        if (data.productInventory) {
          formattedResponse += `\n[제품 재고]\n`;
          formattedResponse += `• 총 제품 수: ${data.productInventory.count}개\n`;
        }

        // 데이터가 없는 경우
        if (!data.salesStats && !data.purchaseStats && !data.dashboardStats && !data.customerInfo && !data.productInventory) {
          formattedResponse = context || '조회된 데이터가 없습니다.';
        }

        return res.json({
          message: formattedResponse,
          data: data,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 2단계: 거래 등록 의도인 경우 거래 정보 추출
    const extractedData = await extractTransactionInfo(message, businessId);

    if (!extractedData) {
      // 거래 정보를 추출하지 못한 경우
      const { context, data } = await analyzeIntentAndFetchData(message, businessId);

      const prompt = `당신은 ERP 시스템의 AI 어시스턴트입니다. 사용자의 질문에 대해 친절하고 정확하게 답변해주세요.

사용자 질문: ${message}

ERP 시스템 데이터:${context}

위 데이터를 바탕으로 사용자의 질문에 답변해주세요.

**답변 규칙:**
- 한국어로 답변해주세요
- 숫자는 천 단위로 콤마를 찍어주세요
- **날짜 범위는 데이터에 명시된 그대로 사용하세요. 절대 날짜를 임의로 계산하거나 변경하지 마세요.**
- 데이터가 없을 경우 그 사실을 명확히 알려주세요
- 응답은 깔끔하게 줄바꿈하여 가독성 좋게 작성하세요

**매출/매입 데이터 답변 형식 (필수):**
사용자가 매출이나 매입을 물어보면 반드시 다음 형식으로 답변하세요:

[데이터에 표시된 날짜 범위 그대로]

총매출액(또는 총매입액): [부가세 포함 금액]원
공급가액: [공급가액]원
세액: [부가세]원

총 매출 건수: [건수]건`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponse = response.text();

        return res.json({
          message: aiResponse,
          data: data,
          timestamp: new Date().toISOString()
        });
      } catch (geminiError: any) {
        console.error('Gemini API error:', geminiError.message);

        // Gemini API 에러 시 조회된 데이터를 더 읽기 쉽게 포맷팅하여 반환
        let formattedResponse = '📊 조회 결과:\n';

        if (data.salesStats) {
          formattedResponse += `\n[매출 현황]\n`;
          formattedResponse += `• 거래 건수: ${data.salesStats.count}건\n`;
          formattedResponse += `• 공급가액: ${data.salesStats.totalAmount.toLocaleString()}원\n`;
          formattedResponse += `• 부가세: ${data.salesStats.totalVat.toLocaleString()}원\n`;
          formattedResponse += `• 총 매출액: ${data.salesStats.grandTotal.toLocaleString()}원\n`;
        }

        if (data.purchaseStats) {
          formattedResponse += `\n[매입 현황]\n`;
          formattedResponse += `• 거래 건수: ${data.purchaseStats.count}건\n`;
          formattedResponse += `• 공급가액: ${data.purchaseStats.totalAmount.toLocaleString()}원\n`;
          formattedResponse += `• 부가세: ${data.purchaseStats.totalVat.toLocaleString()}원\n`;
          formattedResponse += `• 총 매입액: ${data.purchaseStats.grandTotal.toLocaleString()}원\n`;
        }

        if (data.dashboardStats) {
          formattedResponse += `\n[이번 달 현황]\n`;
          formattedResponse += `• 총 매출액: ${data.dashboardStats.thisMonthSales.grandTotal.toLocaleString()}원\n`;
          formattedResponse += `• 총 매입액: ${data.dashboardStats.thisMonthPurchase.grandTotal.toLocaleString()}원\n`;
          formattedResponse += `• 수익: ${data.dashboardStats.profit.toLocaleString()}원\n`;
          formattedResponse += `• 고객 수: ${data.dashboardStats.totalCustomers}명\n`;
          formattedResponse += `• 제품 수: ${data.dashboardStats.totalProducts}개\n`;
        }

        // 데이터가 없는 경우
        if (!data.salesStats && !data.purchaseStats && !data.dashboardStats) {
          formattedResponse = context || '조회된 데이터가 없습니다.';
        }

        return res.json({
          message: formattedResponse,
          data: data,
          timestamp: new Date().toISOString()
        });
      }
    }

    // 다중 거래 처리
    const transactionList = extractedData.isMultiple
      ? extractedData.transactions
      : [extractedData.transaction];

    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < transactionList.length; i++) {
      const transactionInfo = transactionList[i];

      if (!transactionInfo.transactionType) {
        continue;
      }

      try {
        // 2단계: 고객 검색
        let customerId: number | undefined = undefined;
        if (transactionInfo.customerName) {
          const customers = await ERPDataHelper.findCustomerByName(user.businessId, transactionInfo.customerName);
          if (customers.length > 0) {
            customerId = customers[0].id;
          }
        }

        // 3단계: 제품 검색 및 ID, taxType, 가격 유형 매핑 (매출/매입인 경우만)
        if (transactionInfo.items && transactionInfo.items.length > 0) {
          for (const item of transactionInfo.items) {
            const products = await ERPDataHelper.findProductByName(user.businessId, item.productName);
            if (products.length > 0) {
              const product = products[0];
              item.productId = product.id;

              // DB에 있는 제품의 taxType 사용 (우선순위: DB > AI 추출값)
              if (product.taxType) {
                item.taxType = product.taxType;
              }

              // 제품의 판매가와 과세 유형으로 가격 유형 추론
              if (product.sellPrice) {
                const priceType = ERPDataHelper.inferPriceType(Number(product.sellPrice), item.taxType);

                // 가격 유형에 따라 금액 재계산
                if (priceType === 'tax_exempt') {
                  item.taxType = '면세';
                } else if (priceType === 'vat_included') {
                  const originalAmount = item.amount;
                  item.amount = Math.round(originalAmount / 1.1);
                  item.unitPrice = Math.round(item.amount / item.quantity);
                } else {
                  item.taxType = '과세';
                }
              }
            }
          }

          // 거래 전체 금액 재계산
          transactionInfo.totalAmount = transactionInfo.items.reduce((sum: number, item: any) => sum + item.amount, 0);

          // 부가세 재계산
          transactionInfo.vatAmount = transactionInfo.items.reduce((sum: number, item: any) => {
            if (item.taxType === '면세' || item.taxType === '영세') {
              return sum + 0;
            } else {
              return sum + Math.round(item.amount * 0.1);
            }
          }, 0);
        }

        // 조회 전용 역할(sales_viewer) 차단.
        // 이 라우트는 POST /message 하나로 조회와 등록을 모두 처리하므로 requireWriteRole을
        // 라우트에 걸면 조회 질문까지 막힌다. 따라서 실제 '등록' 직전에만 검사한다.
        // (JWT에는 role이 없어 DB에서 확인)
        const writer = await AppDataSource.getRepository(User).findOne({
          where: { id: user.userId }
        });
        if (writer?.role === 'sales_viewer') {
          return res.json({
            response: '조회 전용 권한으로는 거래를 등록할 수 없습니다. 조회는 계속 이용하실 수 있습니다.',
            success: false
          });
        }

        // 4단계: 거래 유형별 처리
        let result: any;
        let successMessage: string;

        if (transactionInfo.transactionType === '매출') {
          // 매출 등록
          result = await ERPDataHelper.createSales(user.businessId, {
            customerId,
            customerName: transactionInfo.customerName,
            transactionDate: transactionInfo.transactionDate,
            totalAmount: transactionInfo.totalAmount,
            vatAmount: transactionInfo.vatAmount,
            description: transactionInfo.description,
            items: transactionInfo.items || []
          });

          const taxTypeLabel = transactionInfo.taxType || '과세';
          successMessage = `✅ 매출이 성공적으로 등록되었습니다!

📋 등록 정보:
${customerId ? `• 고객: ${transactionInfo.customerName}` : `• 고객: ${transactionInfo.customerName || '미지정'} (신규 고객 또는 미등록)`}
• 거래일: ${transactionInfo.transactionDate}
• 과세구분: ${taxTypeLabel}
• 공급가액: ${transactionInfo.totalAmount.toLocaleString()}원
• 부가세: ${transactionInfo.vatAmount.toLocaleString()}원${transactionInfo.vatAmount === 0 ? ` (${taxTypeLabel})` : ''}
• 총 금액: ${(transactionInfo.totalAmount + transactionInfo.vatAmount).toLocaleString()}원
${transactionInfo.items && transactionInfo.items.length > 0 ? `\n📦 거래 품목:\n${transactionInfo.items.map((item: any) => `  - ${item.productName}: ${item.quantity}개 x ${item.unitPrice.toLocaleString()}원 = ${item.amount.toLocaleString()}원${item.taxType && item.taxType !== '과세' ? ` (${item.taxType})` : ''}`).join('\n')}` : ''}

매출 ID: #${result?.id}`;

        } else if (transactionInfo.transactionType === '매입') {
          // 매입 등록
          result = await ERPDataHelper.createPurchase(user.businessId, {
            customerId,
            customerName: transactionInfo.customerName,
            purchaseDate: transactionInfo.transactionDate,
            totalAmount: transactionInfo.totalAmount,
            vatAmount: transactionInfo.vatAmount,
            memo: transactionInfo.description,
            items: transactionInfo.items || []
          });

          const taxTypeLabel = transactionInfo.taxType || '과세';
          successMessage = `✅ 매입이 성공적으로 등록되었습니다!

📋 등록 정보:
${customerId ? `• 공급처: ${transactionInfo.customerName}` : `• 공급처: ${transactionInfo.customerName || '미지정'} (신규 또는 미등록)`}
• 매입일: ${transactionInfo.transactionDate}
• 과세구분: ${taxTypeLabel}
• 공급가액: ${transactionInfo.totalAmount.toLocaleString()}원
• 부가세: ${transactionInfo.vatAmount.toLocaleString()}원${transactionInfo.vatAmount === 0 ? ` (${taxTypeLabel})` : ''}
• 총 금액: ${(transactionInfo.totalAmount + transactionInfo.vatAmount).toLocaleString()}원
${transactionInfo.items && transactionInfo.items.length > 0 ? `\n📦 매입 품목:\n${transactionInfo.items.map((item: any) => `  - ${item.productName}: ${item.quantity}개 x ${item.unitPrice.toLocaleString()}원 = ${item.amount.toLocaleString()}원${item.taxType && item.taxType !== '과세' ? ` (${item.taxType})` : ''}`).join('\n')}` : ''}

매입 ID: #${result?.id}`;

        } else if (transactionInfo.transactionType === '수금' || transactionInfo.transactionType === '입금') {
          // 수금/입금 등록
          if (!customerId) {
            return res.status(400).json({
              error: `${transactionInfo.transactionType} 등록을 위해서는 고객 정보가 필요합니다.`,
              message: `"${transactionInfo.customerName}" 고객을 찾을 수 없습니다. 먼저 고객을 등록해주세요.`
            });
          }

          result = await ERPDataHelper.createPayment(user.businessId, {
            customerId,
            customerName: transactionInfo.customerName,
            paymentDate: transactionInfo.transactionDate,
            paymentType: transactionInfo.transactionType as '수금' | '입금',
            amount: transactionInfo.totalAmount,
            paymentMethod: transactionInfo.paymentMethod,
            description: transactionInfo.description
          });

          successMessage = `✅ ${transactionInfo.transactionType}이 성공적으로 등록되었습니다!

📋 등록 정보:
• 고객: ${transactionInfo.customerName}
• ${transactionInfo.transactionType}일: ${transactionInfo.transactionDate}
• 금액: ${transactionInfo.totalAmount.toLocaleString()}원
${transactionInfo.paymentMethod ? `• 방법: ${transactionInfo.paymentMethod}` : ''}

${transactionInfo.transactionType} ID: #${result?.id}`;
        }

        results.push({
          index: i + 1,
          success: true,
          message: successMessage,
          data: result
        });

      } catch (error: any) {
        console.error('Transaction registration failed:', error.message);
        errors.push({
          index: i + 1,
          transactionInfo,
          error: error.message
        });
      }
    }

    // 모든 거래 처리 완료 후 응답 생성
    if (results.length === 0) {
      return res.status(500).json({
        error: '모든 거래 등록에 실패했습니다.',
        errors
      });
    }

    // 성공 메시지 조합
    let finalMessage = '';

    if (results.length === 1) {
      // 단일 거래
      finalMessage = results[0].message;
    } else {
      // 다중 거래
      finalMessage = `✅ 총 ${results.length}건의 거래가 등록되었습니다!\n\n`;
      finalMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      results.forEach((r, idx) => {
        const lines = r.message.split('\n');
        // 첫 줄 제외 (✅ 매출이... 부분)
        const content = lines.slice(2).join('\n');
        finalMessage += `**[${idx + 1}번째 거래]**\n${content}\n`;
        if (idx < results.length - 1) {
          finalMessage += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
      });

      if (errors.length > 0) {
        finalMessage += `\n\n⚠️ ${errors.length}건의 거래 등록 실패`;
      }
    }

    return res.json({
      message: finalMessage,
      data: {
        totalCount: transactionList.length,
        successCount: results.length,
        failCount: errors.length,
        results: results.map(r => r.data),
        errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({
      error: '챗봇 응답 생성 중 오류가 발생했습니다.',
      details: error.message,
      errorType: error.name
    });
  }
};

/**
 * 챗봇 상태 확인
 */
export const getStatus = async (req: Request, res: Response) => {
  try {
    const hasApiKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');

    res.json({
      status: 'ok',
      hasApiKey,
      model: 'gemini-1.5-flash',
      features: [
        '매출/매입 통계 조회',
        '고객 정보 조회',
        '제품 재고 관리',
        '대시보드 통계',
        '자연어 질의응답',
        '매출 자동 등록',
        '매입 자동 등록',
        '수금/입금 자동 등록'
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
