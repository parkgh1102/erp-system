export interface Business {
  id: number;
  businessNumber: string;
  companyName: string;
  representative: string;
  businessType?: string;
  businessItem?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  homepage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCreateRequest {
  businessNumber: string;
  companyName: string;
  representative: string;
  businessType?: string;
  businessItem?: string;
  address?: string;
  phone?: string;
  fax?: string;
  email?: string;
  homepage?: string;
}

export interface BusinessUpdateRequest extends Partial<BusinessCreateRequest> {}

export interface BusinessListResponse {
  success: boolean;
  data: Business[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BusinessResponse {
  success: boolean;
  data: Business;
  message?: string;
}

export interface BusinessValidationResponse {
  success: boolean;
  isValid: boolean;
  message: string;
}