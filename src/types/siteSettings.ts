export interface SiteSettings {
  id: number;
  site_name: string;
  contact_email: string;
  support_phone: string;
  currency: string;
  // Task Lifecycle & Automation
  slot_reservation_minutes: number;
  auto_approve_hours: number;
  auto_publish_tasks: boolean;
  min_task_reward: number;
  max_task_reward: number;
  task_expiry_days: number;
  max_tasks_per_client: number;
  proof_requirement: boolean;
  // Financial Limits
  platform_commission: number;
  min_withdrawal: number;
  withdrawal_fee: number;
  min_deposit_amount: number;
  daily_withdrawal_limit: number;
  automatic_payout: boolean;
  // Payment Gateway
  payment_gateway: string;
  gateway_api_key: string;
  gateway_sandbox_mode: boolean;
  // Client & Onboarding
  open_registration: boolean;
  require_verification: boolean;
  default_client_status: string;
  // Security & Notifications
  system_notifications: boolean;
  two_factor_auth: boolean;
  // Maintenance Mode
  maintenance_mode: boolean;
  maintenance_notice: string;
  updated_at?: string;
}

export const defaultSiteSettings: SiteSettings = {
  id: 1,
  site_name: 'Ctask',
  contact_email: 'support@ctask.com',
  support_phone: '+880 1700-000000',
  currency: '৳',
  slot_reservation_minutes: 30,
  auto_approve_hours: 48,
  auto_publish_tasks: false,
  min_task_reward: 1,
  max_task_reward: 500,
  task_expiry_days: 7,
  max_tasks_per_client: 10,
  proof_requirement: true,
  platform_commission: 10,
  min_withdrawal: 50,
  withdrawal_fee: 2,
  min_deposit_amount: 100,
  daily_withdrawal_limit: 2000,
  automatic_payout: false,
  payment_gateway: 'bKash',
  gateway_api_key: '',
  gateway_sandbox_mode: true,
  open_registration: true,
  require_verification: true,
  default_client_status: 'active',
  system_notifications: true,
  two_factor_auth: false,
  maintenance_mode: false,
  maintenance_notice: 'Platform is undergoing scheduled maintenance. Task submissions and withdrawals are temporarily paused.',
};
