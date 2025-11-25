import { Business } from './Business';
export declare class User {
    id: number;
    email: string;
    password: string;
    name: string;
    phone: string;
    avatar?: string;
    role: string;
    businessId?: number;
    isActive: boolean;
    businesses: Business[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map