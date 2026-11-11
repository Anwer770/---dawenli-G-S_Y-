export interface User {
  id: number;
  username: string;
  display_name: string;
  is_owner: number;
  created_at: string;
}

export interface Entry {
  id: number;
  user_id: number;
  date: string;
  full_text: string;
  summary: string;
  mood: string;
  tags_json: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceItem {
  id: number;
  user_id: number;
  date: string;
  amount: number;
  currency: string;
  direction: 'expense' | 'income';
  category: string;
  note: string;
  created_at: string;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  categoryTotals: Record<string, number>;
}

export interface AssetItem {
  id: number;
  type: 'gold' | 'cash' | 'other';
  sub_type: string;
  amount: number;
  unit: string;
  buy_price: number;
  notes: string;
  estimatedValueEGP: number;
}

export interface HealthRecord {
  id: number;
  date: string;
  category: 'عرض' | 'دواء' | 'نوم' | 'تمرين' | 'نفسية' | 'ملاحظة';
  body_region: 'راس' | 'صدر' | 'معدة' | 'بطن' | 'ذراعين' | 'ساقين' | 'عام';
  severity: string;
  details: string;
  created_at: string;
}

export interface Meal {
  id: number;
  date: string;
  meal_type: 'فطار' | 'غدا' | 'عشا' | 'سناك' | 'مشروب';
  description: string;
  calories?: number;
  created_at: string;
}

export interface Condition {
  id: number;
  title: string;
  description: string;
  start_date: string;
  status: 'active' | 'resolved';
  doctor_notes?: string;
}

export interface Habit {
  id: number;
  title: string;
  habit_type: 'do' | 'quit';
  streak: number;
  target_days: number;
  doneToday: boolean;
}

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  current_amount: number;
  unit: string;
  periodicity: string;
  deadline?: string;
  percentage: number;
  history?: Array<{
    id: number;
    change_amount: number;
    new_total: number;
    source: string;
    note?: string;
    date: string;
  }>;
}

export interface Task {
  id: number;
  title: string;
  date?: string;
  time?: string;
  completed: number;
  priority: string;
  note?: string;
}

export interface Metric {
  id: number;
  name: string;
  unit: string;
  daily_target: number;
  todayValue: number;
  history: Array<{ date: string; value: number }>;
}

export interface Idea {
  id: number;
  title: string;
  description?: string;
  tags_json: string;
  status: 'inbox' | 'converted' | 'archived';
  created_at: string;
}

export interface Problem {
  id: number;
  title: string;
  domain: string;
  severity: string;
  status: 'active' | 'resolved';
  resolution?: string;
  created_at: string;
}

export interface ProfileFact {
  id: number;
  category: 'هوية' | 'صحة' | 'شغل' | 'علاقات' | 'تفضيلات';
  key: string;
  value: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}
