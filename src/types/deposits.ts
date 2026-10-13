export interface SubmitDepositInput {
  userId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
}

export interface DepositRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DepositActionResult {
  success: boolean;
  data?: any;
  error?: string;
}
