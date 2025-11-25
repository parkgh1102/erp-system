/**
 * 개선된 데이터베이스 설정
 *
 * 기존 database.ts를 수정하지 않고 새로운 보안 강화 설정 제공
 *
 * 주요 개선사항:
 * 1. synchronize를 false로 설정 (모든 환경)
 * 2. 연결 풀 최적화
 * 3. 보안 설정 강화
 *
 * 적용 방법:
 * backend/src/config/database.ts 대신 이 파일 사용
 */
import { DataSource } from 'typeorm';
/**
 * 데이터 소스 생성
 */
export declare const AppDataSource: DataSource;
/**
 * 데이터베이스 연결 초기화
 */
export declare function initializeDatabase(): Promise<DataSource>;
/**
 * 데이터베이스 연결 종료
 */
export declare function closeDatabase(): Promise<void>;
/**
 * 데이터베이스 헬스 체크
 */
export declare function checkDatabaseHealth(): Promise<boolean>;
export default AppDataSource;
//# sourceMappingURL=database.d.ts.map