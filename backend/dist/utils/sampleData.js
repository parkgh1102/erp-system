"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSampleData = createSampleData;
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Business_1 = require("../entities/Business");
const Customer_1 = require("../entities/Customer");
const Product_1 = require("../entities/Product");
const Transaction_1 = require("../entities/Transaction");
const TransactionItem_1 = require("../entities/TransactionItem");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function createSampleData() {
    console.log('🌱 샘플 데이터 생성 시작...');
    try {
        const userRepository = database_1.AppDataSource.getRepository(User_1.User);
        const businessRepository = database_1.AppDataSource.getRepository(Business_1.Business);
        const customerRepository = database_1.AppDataSource.getRepository(Customer_1.Customer);
        const productRepository = database_1.AppDataSource.getRepository(Product_1.Product);
        const transactionRepository = database_1.AppDataSource.getRepository(Transaction_1.Transaction);
        const transactionItemRepository = database_1.AppDataSource.getRepository(TransactionItem_1.TransactionItem);
        // 1. 샘플 사용자 생성
        const hashedPassword = await bcryptjs_1.default.hash('test123!@#', 12);
        const sampleUser = userRepository.create({
            email: 'admin@test.com',
            password: hashedPassword,
            name: '관리자',
            phone: '010-1234-5678'
        });
        const savedUser = await userRepository.save(sampleUser);
        console.log('✅ 샘플 사용자 생성 완료');
        // 2. 샘플 사업체 생성
        const sampleBusiness = businessRepository.create({
            userId: savedUser.id,
            businessNumber: '1234567890',
            companyName: '(주)테스트컴퍼니',
            representative: '김대표',
            businessType: '도소매업',
            businessItem: 'IT 서비스',
            address: '서울시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            fax: '02-1234-5679'
        });
        const savedBusiness = await businessRepository.save(sampleBusiness);
        console.log('✅ 샘플 사업체 생성 완료');
        // 2-2. 추가 샘플 사업체 생성 (businessId 2를 위해)
        const sampleBusiness2 = businessRepository.create({
            userId: savedUser.id,
            businessNumber: '9876543210',
            companyName: '가온에프에스유한회사',
            representative: '이수연',
            businessType: '서비스업',
            businessItem: 'IT 솔루션',
            address: '경기도 남양주시 오남읍 양지로125번길 6, 에이동',
            phone: '031-1234-5678',
            fax: '031-1234-5679'
        });
        await businessRepository.save(sampleBusiness2);
        console.log('✅ 추가 샘플 사업체 생성 완료');
        // 2-3. 세 번째 샘플 사업체 생성 (businessId 3을 위해)
        const sampleBusiness3 = businessRepository.create({
            userId: savedUser.id,
            businessNumber: '1122334455',
            companyName: '테스트 주식회사',
            representative: '박대표',
            businessType: '제조업',
            businessItem: '소프트웨어 개발',
            address: '서울시 서초구 강남대로 123',
            phone: '02-3333-4444',
            fax: '02-3333-4445'
        });
        await businessRepository.save(sampleBusiness3);
        console.log('✅ 세 번째 샘플 사업체 생성 완료');
        // 3. 샘플 고객 생성
        const sampleCustomers = [
            {
                businessId: savedBusiness.id,
                customerCode: 'CUST001',
                name: '고객사 A',
                businessNumber: '9876543210',
                address: '서울시 서초구 서초대로 456',
                phone: '02-9876-5432',
                representative: '이대표'
            },
            {
                businessId: savedBusiness.id,
                customerCode: 'CUST002',
                name: '고객사 B',
                businessNumber: '5555666677',
                address: '부산시 해운대구 센텀로 789',
                phone: '051-5555-6666',
                representative: '박대표'
            }
        ];
        const savedCustomers = await customerRepository.save(sampleCustomers);
        console.log('✅ 샘플 고객 생성 완료');
        // 4. 샘플 제품 생성
        const sampleProducts = [
            {
                businessId: savedBusiness.id,
                productCode: 'WEB001',
                name: '웹사이트 개발',
                category: 'IT 서비스',
                description: '반응형 웹사이트 개발 서비스',
                unitPrice: 5000000,
                unit: '건'
            },
            {
                businessId: savedBusiness.id,
                productCode: 'APP001',
                name: '모바일 앱 개발',
                category: 'IT 서비스',
                description: 'Android/iOS 모바일 앱 개발',
                unitPrice: 8000000,
                unit: '건'
            },
            {
                businessId: savedBusiness.id,
                productCode: 'MAIN001',
                name: '시스템 유지보수',
                category: 'IT 서비스',
                description: '월간 시스템 유지보수 서비스',
                unitPrice: 500000,
                unit: '월'
            },
            {
                businessId: savedBusiness.id,
                productCode: 'DB001',
                name: 'DB 설계 및 구축',
                category: 'IT 서비스',
                description: '데이터베이스 설계 및 구축 서비스',
                unitPrice: 2000000,
                unit: '건'
            }
        ];
        const savedProducts = await productRepository.save(sampleProducts);
        console.log('✅ 샘플 제품 생성 완료');
        // Business ID 3을 위한 샘플 데이터 생성
        const sampleBusiness3Data = await businessRepository.findOne({ where: { businessNumber: '1122334455' } });
        if (sampleBusiness3Data) {
            // Business ID 3용 고객 데이터
            const sampleCustomers3 = [
                {
                    businessId: sampleBusiness3Data.id,
                    customerCode: 'CUST301',
                    name: '스마트솔루션',
                    businessNumber: '3333444455',
                    address: '서울시 강남구 테헤란로 321',
                    phone: '02-7777-8888',
                    representative: '최대표'
                },
                {
                    businessId: sampleBusiness3Data.id,
                    customerCode: 'CUST302',
                    name: '디지털혁신',
                    businessNumber: '6666777788',
                    address: '경기도 성남시 분당구 판교로 456',
                    phone: '031-8888-9999',
                    representative: '김부장'
                }
            ];
            await customerRepository.save(sampleCustomers3);
            console.log('✅ Business ID 3용 샘플 고객 생성 완료');
            // Business ID 3용 제품 데이터
            const sampleProducts3 = [
                {
                    businessId: sampleBusiness3Data.id,
                    productCode: 'PROD301',
                    name: '클라우드 서비스',
                    category: '클라우드',
                    description: 'AWS 클라우드 인프라 구축',
                    unitPrice: 3000000,
                    unit: '월'
                },
                {
                    businessId: sampleBusiness3Data.id,
                    productCode: 'PROD302',
                    name: 'AI 솔루션',
                    category: '인공지능',
                    description: '머신러닝 모델 개발 및 구축',
                    unitPrice: 7000000,
                    unit: '건'
                }
            ];
            await productRepository.save(sampleProducts3);
            console.log('✅ Business ID 3용 샘플 제품 생성 완료');
        }
        // 5. 샘플 거래 생성
        const sampleTransactions = [
            {
                businessId: savedBusiness.id,
                customerId: savedCustomers[0].id,
                type: 'sales',
                date: new Date('2024-01-15'),
                description: '웹사이트 개발 프로젝트',
                totalAmount: 5500000,
                taxAmount: 500000,
                status: 'completed'
            },
            {
                businessId: savedBusiness.id,
                customerId: savedCustomers[1].id,
                type: 'sales',
                date: new Date('2024-02-01'),
                description: '모바일 앱 개발 프로젝트',
                totalAmount: 8800000,
                taxAmount: 800000,
                status: 'in_progress'
            },
            {
                businessId: savedBusiness.id,
                customerId: savedCustomers[0].id,
                type: 'sales',
                date: new Date('2024-03-01'),
                description: '시스템 유지보수 (3월)',
                totalAmount: 550000,
                taxAmount: 50000,
                status: 'completed'
            }
        ];
        const savedTransactions = await transactionRepository.save(sampleTransactions);
        console.log('✅ 샘플 거래 생성 완료');
        // 6. 샘플 거래 항목 생성
        const sampleTransactionItems = [
            // 첫 번째 거래 (웹사이트 개발)
            {
                transactionId: savedTransactions[0].id,
                productId: savedProducts[0].id,
                itemName: '웹사이트 개발',
                specification: '반응형 웹사이트',
                quantity: 1,
                unitPrice: 5000000,
                amount: 5000000,
                taxAmount: 500000,
                taxExempt: false
            },
            // 두 번째 거래 (모바일 앱 개발)
            {
                transactionId: savedTransactions[1].id,
                productId: savedProducts[1].id,
                itemName: '모바일 앱 개발',
                specification: 'Android + iOS',
                quantity: 1,
                unitPrice: 8000000,
                amount: 8000000,
                taxAmount: 800000,
                taxExempt: false
            },
            // 세 번째 거래 (유지보수)
            {
                transactionId: savedTransactions[2].id,
                productId: savedProducts[2].id,
                itemName: '시스템 유지보수',
                specification: '월간 유지보수',
                quantity: 1,
                unitPrice: 500000,
                amount: 500000,
                taxAmount: 50000,
                taxExempt: false
            }
        ];
        await transactionItemRepository.save(sampleTransactionItems);
        console.log('✅ 샘플 거래 항목 생성 완료');
        console.log('🎉 샘플 데이터 생성이 완료되었습니다!');
        console.log('📧 테스트 계정: admin@test.com');
        console.log('🔑 비밀번호: test123!@#');
    }
    catch (error) {
        console.error('❌ 샘플 데이터 생성 실패:', error);
        throw error;
    }
}
//# sourceMappingURL=sampleData.js.map