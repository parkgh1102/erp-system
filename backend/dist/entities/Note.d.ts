import { Business } from './Business';
export declare enum NoteType {
    GENERAL = "\uC77C\uBC18",
    TRANSACTION = "\uAC70\uB798\uAD00\uB828",
    CUSTOMER = "\uACE0\uAC1D\uAD00\uB828"
}
export declare class Note {
    id: number;
    businessId: number;
    title: string;
    content?: string;
    noteType: NoteType;
    relatedId?: number;
    relatedType?: string;
    tags?: string;
    createdBy?: number;
    createdAt: Date;
    updatedAt: Date;
    business: Business;
}
//# sourceMappingURL=Note.d.ts.map