/*
# DopamineOS Core Schema

1. New Tables
- `profiles`: Game profile for each user — avatar, username, bio, level, xp, coins, streak, productivity_score, join_date, settings.
- `tasks`: Mission-style tasks with difficulty (easy/medium/hard/legendary/epic), XP/coin rewards, status, due date.
- `habits`: Daily/weekly/monthly/custom habits with streak tracking.
- `habit_logs`: Per-day completion records for habits.
- `focus_sessions`: Completed focus timer sessions (pomodoro/deep work/custom) with duration and rewards.
- `achievements`: Shared catalog of 200+ achievements with rarity tiers.
- `user_achievements`: Per-user unlocked achievements.
- `shop_items`: Shared catalog of purchasable cosmetics (themes, avatars, sounds, etc.).
- `user_purchases`: Per-user owned shop items.
- `activity_log`: Recent-activity feed entries (mission complete, level up, achievement, focus, etc.).
- `daily_stats`: Aggregated daily productivity stats for analytics (xp earned, coins earned, tasks done, focus minutes).

2. Security
- All tables ENABLE ROW LEVEL SECURITY.
- profiles: owner-scoped (auth.uid() = id).
- tasks, habits, habit_logs, focus_sessions, user_achievements, user_purchases, activity_log, daily_stats: owner-scoped via user_id with DEFAULT auth.uid().
- achievements, shop_items: shared catalog, readable by all authenticated (TO authenticated USING true) — no writes from client.
- 4 separate CRUD policies per owner-scoped table.

3. Important Notes
- Owner columns default to auth.uid() so inserts that omit user_id succeed.
- No destructive operations; idempotent with IF NOT EXISTS.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar text DEFAULT '🦊',
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  coins int NOT NULL DEFAULT 0,
  streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_checkin date,
  freeze_used_this_month boolean NOT NULL DEFAULT false,
  productivity_score int NOT NULL DEFAULT 0,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- TASKS (missions)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  difficulty text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  xp_reward int NOT NULL DEFAULT 30,
  coin_reward int NOT NULL DEFAULT 15,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- HABITS
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text DEFAULT '✅',
  frequency text NOT NULL DEFAULT 'daily',
  target_count int NOT NULL DEFAULT 1,
  streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  color text DEFAULT '#6C63FF',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- HABIT LOGS
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  count int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_id ON habit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);

DROP POLICY IF EXISTS "select_own_habit_logs" ON habit_logs;
CREATE POLICY "select_own_habit_logs" ON habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habit_logs" ON habit_logs;
CREATE POLICY "insert_own_habit_logs" ON habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habit_logs" ON habit_logs;
CREATE POLICY "update_own_habit_logs" ON habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habit_logs" ON habit_logs;
CREATE POLICY "delete_own_habit_logs" ON habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- FOCUS SESSIONS
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'pomodoro',
  duration_minutes int NOT NULL DEFAULT 25,
  xp_earned int NOT NULL DEFAULT 0,
  coins_earned int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);

DROP POLICY IF EXISTS "select_own_focus_sessions" ON focus_sessions;
CREATE POLICY "select_own_focus_sessions" ON focus_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_focus_sessions" ON focus_sessions;
CREATE POLICY "insert_own_focus_sessions" ON focus_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_focus_sessions" ON focus_sessions;
CREATE POLICY "update_own_focus_sessions" ON focus_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_focus_sessions" ON focus_sessions;
CREATE POLICY "delete_own_focus_sessions" ON focus_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACHIEVEMENTS (shared catalog)
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  rarity text NOT NULL DEFAULT 'common',
  xp_reward int NOT NULL DEFAULT 0,
  coin_reward int NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'general'
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_achievements" ON achievements;
CREATE POLICY "read_achievements" ON achievements FOR SELECT TO authenticated USING (true);

-- USER ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

DROP POLICY IF EXISTS "select_own_user_achievements" ON user_achievements;
CREATE POLICY "select_own_user_achievements" ON user_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_achievements" ON user_achievements;
CREATE POLICY "insert_own_user_achievements" ON user_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_achievements" ON user_achievements;
CREATE POLICY "update_own_user_achievements" ON user_achievements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_achievements" ON user_achievements;
CREATE POLICY "delete_own_user_achievements" ON user_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SHOP ITEMS (shared catalog)
CREATE TABLE IF NOT EXISTS shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'theme',
  icon text DEFAULT '🎨',
  price int NOT NULL DEFAULT 100,
  rarity text NOT NULL DEFAULT 'common'
);
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_shop_items" ON shop_items;
CREATE POLICY "read_shop_items" ON shop_items FOR SELECT TO authenticated USING (true);

-- USER PURCHASES
CREATE TABLE IF NOT EXISTS user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_item_id uuid NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_item_id)
);
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);

DROP POLICY IF EXISTS "select_own_user_purchases" ON user_purchases;
CREATE POLICY "select_own_user_purchases" ON user_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_user_purchases" ON user_purchases;
CREATE POLICY "insert_own_user_purchases" ON user_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_user_purchases" ON user_purchases;
CREATE POLICY "update_own_user_purchases" ON user_purchases FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_user_purchases" ON user_purchases;
CREATE POLICY "delete_own_user_purchases" ON user_purchases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT '⭐',
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);

DROP POLICY IF EXISTS "select_own_activity_log" ON activity_log;
CREATE POLICY "select_own_activity_log" ON activity_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_activity_log" ON activity_log;
CREATE POLICY "insert_own_activity_log" ON activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_activity_log" ON activity_log;
CREATE POLICY "update_own_activity_log" ON activity_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_activity_log" ON activity_log;
CREATE POLICY "delete_own_activity_log" ON activity_log FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DAILY STATS
CREATE TABLE IF NOT EXISTS daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date date NOT NULL DEFAULT CURRENT_DATE,
  xp_earned int NOT NULL DEFAULT 0,
  coins_earned int NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  focus_minutes int NOT NULL DEFAULT 0,
  habits_completed int NOT NULL DEFAULT 0,
  UNIQUE (user_id, stat_date)
);
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);

DROP POLICY IF EXISTS "select_own_daily_stats" ON daily_stats;
CREATE POLICY "select_own_daily_stats" ON daily_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_daily_stats" ON daily_stats;
CREATE POLICY "insert_own_daily_stats" ON daily_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_daily_stats" ON daily_stats;
CREATE POLICY "update_own_daily_stats" ON daily_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_daily_stats" ON daily_stats;
CREATE POLICY "delete_own_daily_stats" ON daily_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);
