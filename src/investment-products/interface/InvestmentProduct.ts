export interface InvestmentProduct {
  id: string;
  name: string;
  description: string;
  term_days: number;
  annual_rate: number;
  penalty_rate: number;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
