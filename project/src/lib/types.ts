export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary' | 'epic';
export type TaskStatus = 'pending' | 'completed';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type FocusMode = 'pomodoro' | 'deep_work' | 'custom';

export interface Profile {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  longest_streak: number;
  last_checkin: string | null;
  freeze_used_this_month: boolean;
  productivity_score: number;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  status: TaskStatus;
  xp_reward: number;
  coin_reward: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  frequency: HabitFrequency;
  target_count: number;
  streak: number;
  longest_streak: number;
  color: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string;
  count: number;
  created_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  mode: FocusMode;
  duration_minutes: number;
  xp_earned: number;
  coins_earned: number;
  completed_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  rarity: Rarity;
  xp_reward: number;
  coin_reward: number;
  category: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface ShopItem {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  price: number;
  rarity: Rarity;
}

export interface UserPurchase {
  id: string;
  user_id: string;
  shop_item_id: string;
  purchased_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  type: string;
  message: string;
  icon: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface DailyStat {
  id: string;
  user_id: string;
  stat_date: string;
  xp_earned: number;
  coins_earned: number;
  tasks_completed: number;
  focus_minutes: number;
  habits_completed: number;
}
