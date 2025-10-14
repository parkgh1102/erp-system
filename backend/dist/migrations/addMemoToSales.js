"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
async function addMemoColumn() {
    try {
        await database_1.AppDataSource.initialize();
        console.log('✅ Database connection established');
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        // Check if column exists (SQLite)
        const tableInfo = await queryRunner.query(`PRAGMA table_info(sales);`);
        const columnExists = tableInfo.some((col) => col.name === 'memo');
        if (!columnExists) {
            console.log('Adding memo column to sales table...');
            await queryRunner.query('ALTER TABLE sales ADD COLUMN memo TEXT;');
            console.log('✅ memo column added successfully');
        }
        else {
            console.log('ℹ️  memo column already exists');
        }
        await queryRunner.release();
        await database_1.AppDataSource.destroy();
        console.log('✅ Migration completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
addMemoColumn();
//# sourceMappingURL=addMemoToSales.js.map