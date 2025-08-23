export const PAYMENT_METHODS = [
  { value: 'pix', label: 'PIX', icon: 'fas fa-qrcode' },
  { value: 'debit_card', label: 'Cartão de Débito', icon: 'fas fa-credit-card' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: 'fas fa-credit-card' },
  { value: 'cash', label: 'Dinheiro', icon: 'fas fa-money-bill' },
  { value: 'transfer', label: 'Transferência', icon: 'fas fa-exchange-alt' },
  { value: 'other', label: 'Outro', icon: 'fas fa-ellipsis-h' },
] as const;

export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Receita', color: 'text-success' },
  { value: 'expense', label: 'Despesa', color: 'text-destructive' },
] as const;

export const INVESTMENT_TYPES = [
  { value: 'fixed_income', label: 'Renda Fixa', icon: 'fas fa-chart-bar', color: 'blue' },
  { value: 'real_estate_fund', label: 'Fundo Imobiliário', icon: 'fas fa-building', color: 'green' },
  { value: 'stocks', label: 'Ações', icon: 'fas fa-chart-line', color: 'purple' },
  { value: 'crypto', label: 'Criptomoedas', icon: 'fab fa-bitcoin', color: 'orange' },
  { value: 'savings', label: 'Poupança', icon: 'fas fa-piggy-bank', color: 'pink' },
  { value: 'other', label: 'Outros', icon: 'fas fa-coins', color: 'gray' },
] as const;

export const DEFAULT_CATEGORIES = [
  { name: 'Mercado', icon: 'fas fa-shopping-cart', color: '#2563eb' },
  { name: 'Transporte', icon: 'fas fa-car', color: '#dc2626' },
  { name: 'Lazer', icon: 'fas fa-gamepad', color: '#f59e0b' },
  { name: 'Saúde', icon: 'fas fa-heartbeat', color: '#10b981' },
  { name: 'Educação', icon: 'fas fa-graduation-cap', color: '#6366f1' },
  { name: 'Casa', icon: 'fas fa-home', color: '#8b5cf6' },
  { name: 'Trabalho', icon: 'fas fa-briefcase', color: '#059669' },
  { name: 'Investimentos', icon: 'fas fa-chart-pie', color: '#7c3aed' },
  { name: 'Outros', icon: 'fas fa-ellipsis-h', color: '#6b7280' },
] as const;

export const CHART_COLORS = [
  '#2563eb', // blue-600
  '#dc2626', // red-600  
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
] as const;
