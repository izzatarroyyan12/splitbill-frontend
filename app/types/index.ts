export interface User {
  _id: string;
  username: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface ItemSplit {
  user_id?: string;
  username?: string;
  external_name?: string;
  quantity: number;
}

export interface Item {
  name: string;
  price_per_unit: number;
  quantity: number;
  split?: ItemSplit[];
}

export interface Participant {
  user_id?: string;
  username?: string;
  external_name?: string;
  amount_due: number;
  status: 'pending' | 'paid';
}

export interface Bill {
  _id: string;
  bill_name: string;
  total_amount: number;
  created_by: string;
  created_by_username: string;
  split_method: 'equal' | 'per_product';
  participants: Participant[];
  items: Item[];
  created_at: string;
  updated_at: string;
}

export interface CreateBillRequest {
  bill_name: string;
  split_method: 'equal' | 'per_product';
  participants: Omit<Participant, 'status'>[];
  items: Item[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AddBalanceRequest {
  amount: number;
}

export interface AddBalanceResponse {
  message: string;
  new_balance: number;
}

export interface PaymentConfirmationData {
  billId: string;
  password: string;
}

export interface PaymentResponse {
  message: string;
  new_balance: number;
  amount_paid: number;
}

export interface ExternalPaymentResponse {
  message: string;
  participant_name: string;
  amount_paid: number;
}

export interface MarkParticipantAsPaidRequest {
  billId: string;
  participantIndex: number;
}

export interface ApiError {
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse {
  message: string;
} 