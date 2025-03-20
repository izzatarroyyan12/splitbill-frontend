export interface User {
  _id: string;
  username: string;
  email: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  _id: string;
  bill_name: string;
  total_amount: number;
  created_by: string;
  split_method: 'equal' | 'per_product';
  participants: Array<{
    external_name: string;
    amount_due: number;
    status: 'unpaid' | 'paid';
  }>;
  items: Array<{
    name: string;
    price_per_unit: number;
    quantity: number;
    split?: Array<{
      external_name: string;
      quantity: number;
    }>;
  }>;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  error?: string;
  message?: string;
  status?: number;
} 