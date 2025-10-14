export declare enum AccountType {
    ASSET = "\uC790\uC0B0",
    LIABILITY = "\uBD80\uCC44",
    EQUITY = "\uC790\uBCF8",
    REVENUE = "\uC218\uC775",
    EXPENSE = "\uBE44\uC6A9"
}
export declare class Account {
    id: number;
    code: string;
    name: string;
    accountType: AccountType;
    parentId?: number;
    isActive: boolean;
    createdAt: Date;
    parent: Account;
    children: Account[];
}
//# sourceMappingURL=Account.d.ts.map