import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  Profile, Task, Habit, HabitLog, FocusSession,
  Achievement, UserAchievement, ShopItem, UserPurchase,
  ActivityEntry, DailyStat, Difficulty,
} from '@/lib/types';
import { DIFFICULTY_REWARDS, levelFromXp, todayStr, daysBetween, FOCUS_REWARDS } from '@/lib/game';

interface Celebration {
  id: number;
  type: 'xp' | 'coins' | 'levelup' | 'achievement' | 'streak';
  amount?: number;
  title?: string;
  description?: string;
  icon?: string;
  rarity?: string;
}

interface AppState {
  // auth
  session: { user: { id: string; email: string } } | null;
  profile: Profile | null;
  loading: boolean;

  // data
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  focusSessions: FocusSession[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  shopItems: ShopItem[];
  purchases: UserPurchase[];
  activity: ActivityEntry[];
  dailyStats: DailyStat[];

  // celebrations queue
  celebrations: Celebration[];

  // actions
  init: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loadAll: () => Promise<void>;

  addTask: (title: string, difficulty: Difficulty, dueDate?: string | null, description?: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;

  addHabit: (name: string, icon: string, frequency: string, color: string) => Promise<void>;
  toggleHabit: (habitId: string, date: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  logFocusSession: (mode: string, minutes: number) => Promise<void>;

  buyItem: (item: ShopItem) => Promise<void>;
  equipItem: (item: ShopItem) => Promise<void>;

  dismissCelebration: (id: number) => void;

  // derived helpers
  isHabitDone: (habitId: string, date: string) => boolean;
}

let celebId = 0;

export const useStore = create<AppState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  tasks: [],
  habits: [],
  habitLogs: [],
  focusSessions: [],
  achievements: [],
  userAchievements: [],
  shopItems: [],
  purchases: [],
  activity: [],
  dailyStats: [],
  celebrations: [],

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      set({ loading: false, session: null });
      return;
    }
    set({ session: { user: { id: session.user.id, email: session.user.email || '' } } });
    await get().loadAll();
    set({ loading: false });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, tasks: [], habits: [], habitLogs: [], focusSessions: [], activity: [], dailyStats: [], userAchievements: [], purchases: [] });
  },

  refreshProfile: async () => {
    const uid = get().session?.user.id;
    if (!uid) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    set({ profile: data as Profile | null });
  },

  loadAll: async () => {
    const uid = get().session?.user.id;
    if (!uid) return;

    // ensure profile exists
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!profile) {
      const email = get().session?.user.email || 'User';
      const { data: newProfile } = await supabase.from('profiles').insert({
        id: uid,
        username: email.split('@')[0],
        bio: '',
      }).select('*').maybeSingle();
      profile = newProfile;
    }
    set({ profile: profile as Profile });

    const [tasks, habits, habitLogs, focusSessions, achievements, userAch, shopItems, purchases, activity, stats] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('habits').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('habit_logs').select('*').eq('user_id', uid).order('log_date', { ascending: false }),
      supabase.from('focus_sessions').select('*').eq('user_id', uid).order('completed_at', { ascending: false }),
      supabase.from('achievements').select('*').order('category', { ascending: true }),
      supabase.from('user_achievements').select('*').eq('user_id', uid),
      supabase.from('shop_items').select('*').order('price', { ascending: true }),
      supabase.from('user_purchases').select('*').eq('user_id', uid),
      supabase.from('activity_log').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(30),
      supabase.from('daily_stats').select('*').eq('user_id', uid).order('stat_date', { ascending: false }).limit(365),
    ]);

    set({
      tasks: tasks.data as Task[] || [],
      habits: habits.data as Habit[] || [],
      habitLogs: habitLogs.data as HabitLog[] || [],
      focusSessions: focusSessions.data as FocusSession[] || [],
      achievements: achievements.data as Achievement[] || [],
      userAchievements: userAch.data as UserAchievement[] || [],
      shopItems: shopItems.data as ShopItem[] || [],
      purchases: purchases.data as UserPurchase[] || [],
      activity: activity.data as ActivityEntry[] || [],
      dailyStats: stats.data as DailyStat[] || [],
    });

    await checkStreak(get, set);
    await checkAchievements(get, set);
  },

  addTask: async (title, difficulty, dueDate = null, description = '') => {
    const uid = get().session?.user.id;
    if (!uid) return;
    const rewards = DIFFICULTY_REWARDS[difficulty];
    const { data } = await supabase.from('tasks').insert({
      user_id: uid, title, description, difficulty,
      xp_reward: rewards.xp, coin_reward: rewards.coins,
      due_date: dueDate, status: 'pending',
    }).select('*').single();
    if (data) set({ tasks: [data as Task, ...get().tasks] });
    await logActivity(get, set, 'task_created', `New mission: ${title}`, '📜');
  },

  completeTask: async (id) => {
    const uid = get().session?.user.id;
    const profile = get().profile;
    if (!uid || !profile) return;
    const task = get().tasks.find(t => t.id === id);
    if (!task || task.status === 'completed') return;

    const now = new Date().toISOString();
    await supabase.from('tasks').update({ status: 'completed', completed_at: now }).eq('id', id);
    set({ tasks: get().tasks.map(t => t.id === id ? { ...t, status: 'completed', completed_at: now } : t) });

    const xpGained = task.xp_reward;
    const coinsGained = task.coin_reward;
    const before = levelFromXp(profile.xp);
    const newXp = profile.xp + xpGained;
    const after = levelFromXp(newXp);

    await updateProfile(get, set, { xp: newXp, coins: profile.coins + coinsGained });
    await updateDailyStats(get, set, { xp_earned: xpGained, coins_earned: coinsGained, tasks_completed: 1 });
    await logActivity(get, set, 'task_completed', `Completed: ${task.title}`, '✅', { xp: xpGained, coins: coinsGained });

    queueCelebration(set, { type: 'xp', amount: xpGained });
    queueCelebration(set, { type: 'coins', amount: coinsGained });

    if (after.level > before.level) {
      queueCelebration(set, { type: 'levelup', amount: after.level });
      await logActivity(get, set, 'levelup', `Reached Level ${after.level}!`, '🆙');
    }

    await checkAchievements(get, set);
  },

  deleteTask: async (id) => {
    await supabase.from('tasks').delete().eq('id', id);
    set({ tasks: get().tasks.filter(t => t.id !== id) });
  },

  updateTask: async (id, patch) => {
    await supabase.from('tasks').update(patch).eq('id', id);
    set({ tasks: get().tasks.map(t => t.id === id ? { ...t, ...patch } : t) });
  },

  addHabit: async (name, icon, frequency, color) => {
    const uid = get().session?.user.id;
    if (!uid) return;
    const { data } = await supabase.from('habits').insert({
      user_id: uid, name, icon, frequency, color,
    }).select('*').single();
    if (data) set({ habits: [data as Habit, ...get().habits] });
    await logActivity(get, set, 'habit_created', `New habit: ${name}`, icon);
  },

  toggleHabit: async (habitId, date) => {
    const uid = get().session?.user.id;
    const profile = get().profile;
    if (!uid || !profile) return;
    const existing = get().habitLogs.find(l => l.habit_id === habitId && l.log_date === date);
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id);
      set({ habitLogs: get().habitLogs.filter(l => l.id !== existing.id) });
    } else {
      const { data } = await supabase.from('habit_logs').insert({
        user_id: uid, habit_id: habitId, log_date: date, count: 1,
      }).select('*').single();
      if (data) {
        set({ habitLogs: [data as HabitLog, ...get().habitLogs] });
        const xpGained = 15;
        const coinsGained = 5;
        const before = levelFromXp(profile.xp);
        const newXp = profile.xp + xpGained;
        const after = levelFromXp(newXp);
        await updateProfile(get, set, { xp: newXp, coins: profile.coins + coinsGained });
        await updateDailyStats(get, set, { xp_earned: xpGained, coins_earned: coinsGained, habits_completed: 1 });
        queueCelebration(set, { type: 'xp', amount: xpGained });
        if (after.level > before.level) {
          queueCelebration(set, { type: 'levelup', amount: after.level });
        }
        await checkAchievements(get, set);
      }
    }
  },

  deleteHabit: async (id) => {
    await supabase.from('habits').delete().eq('id', id);
    set({ habits: get().habits.filter(h => h.id !== id), habitLogs: get().habitLogs.filter(l => l.habit_id !== id) });
  },

  logFocusSession: async (mode, minutes) => {
    const uid = get().session?.user.id;
    const profile = get().profile;
    if (!uid || !profile) return;
    const rewards = FOCUS_REWARDS[mode as keyof typeof FOCUS_REWARDS] || FOCUS_REWARDS.pomodoro;
    const xpGained = Math.round(minutes * rewards.xpPerMin);
    const coinsGained = Math.round(minutes * rewards.coinsPerMin);
    const { data } = await supabase.from('focus_sessions').insert({
      user_id: uid, mode, duration_minutes: minutes, xp_earned: xpGained, coins_earned: coinsGained,
    }).select('*').single();
    if (data) set({ focusSessions: [data as FocusSession, ...get().focusSessions] });

    const before = levelFromXp(profile.xp);
    const newXp = profile.xp + xpGained;
    const after = levelFromXp(newXp);
    await updateProfile(get, set, { xp: newXp, coins: profile.coins + coinsGained });
    await updateDailyStats(get, set, { xp_earned: xpGained, coins_earned: coinsGained, focus_minutes: minutes });
    await logActivity(get, set, 'focus', `${minutes} min focus session (+${xpGained} XP)`, '🧘');

    queueCelebration(set, { type: 'xp', amount: xpGained });
    queueCelebration(set, { type: 'coins', amount: coinsGained });
    if (after.level > before.level) {
      queueCelebration(set, { type: 'levelup', amount: after.level });
    }
    await checkAchievements(get, set);
  },

  buyItem: async (item) => {
    const uid = get().session?.user.id;
    const profile = get().profile;
    if (!uid || !profile) return;
    if (profile.coins < item.price) return;
    const { data } = await supabase.from('user_purchases').insert({
      user_id: uid, shop_item_id: item.id,
    }).select('*').single();
    if (data) {
      set({ purchases: [data as UserPurchase, ...get().purchases] });
      await updateProfile(get, set, { coins: profile.coins - item.price });
      await logActivity(get, set, 'purchase', `Bought ${item.name}`, item.icon);
      queueCelebration(set, { type: 'achievement', title: 'Purchase Complete!', description: item.name, icon: item.icon });
    }
  },

  equipItem: async (_item) => {
    // equip logic could update profile.settings — simplified
  },

  dismissCelebration: (id) => {
    set({ celebrations: get().celebrations.filter(c => c.id !== id) });
  },

  isHabitDone: (habitId, date) => {
    return get().habitLogs.some(l => l.habit_id === habitId && l.log_date === date);
  },
}));

// ---- helpers ----

async function updateProfile(get: () => AppState, set: (partial: Partial<AppState>) => void, patch: Partial<Profile>) {
  const uid = get().session?.user.id;
  const current = get().profile;
  if (!uid || !current) return;
  const updated = { ...current, ...patch };
  set({ profile: updated });
  const { level } = levelFromXp(updated.xp);
  if (level !== updated.level) {
    const withLevel = { ...updated, level };
    set({ profile: withLevel });
    await supabase.from('profiles').update({ ...patch, level }).eq('id', uid);
  } else {
    await supabase.from('profiles').update(patch).eq('id', uid);
  }
}

async function updateDailyStats(get: () => AppState, set: (partial: Partial<AppState>) => void, patch: Partial<DailyStat>) {
  const uid = get().session?.user.id;
  if (!uid) return;
  const today = todayStr();
  const existing = get().dailyStats.find(s => s.stat_date === today);
  if (existing) {
    const updated: Partial<DailyStat> = {
      xp_earned: existing.xp_earned + (patch.xp_earned || 0),
      coins_earned: existing.coins_earned + (patch.coins_earned || 0),
      tasks_completed: existing.tasks_completed + (patch.tasks_completed || 0),
      focus_minutes: existing.focus_minutes + (patch.focus_minutes || 0),
      habits_completed: existing.habits_completed + (patch.habits_completed || 0),
    };
    await supabase.from('daily_stats').update(updated).eq('id', existing.id);
    set({ dailyStats: get().dailyStats.map(s => s.id === existing.id ? { ...s, ...updated } : s) });
  } else {
    const { data } = await supabase.from('daily_stats').insert({
      user_id: uid, stat_date: today, ...patch,
    } as never).select('*').single();
    if (data) set({ dailyStats: [data as DailyStat, ...get().dailyStats] });
  }
}

async function logActivity(get: () => AppState, set: (partial: Partial<AppState>) => void, type: string, message: string, icon: string, meta: Record<string, unknown> = {}) {
  const uid = get().session?.user.id;
  if (!uid) return;
  const { data } = await supabase.from('activity_log').insert({
    user_id: uid, type, message, icon, meta,
  } as never).select('*').single();
  if (data) set({ activity: [data as ActivityEntry, ...get().activity].slice(0, 30) });
}

function queueCelebration(set: (partial: Partial<AppState>) => void, c: Omit<Celebration, 'id'>) {
  const id = ++celebId;
  set({ celebrations: [...getCelebrations(), { ...c, id }] });
  function getCelebrations() {
    return (useStore.getState() as AppState).celebrations;
  }
}

async function checkStreak(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  const profile = get().profile;
  if (!profile) return;
  const today = todayStr();
  if (profile.last_checkin === today) return;

  let newStreak = profile.streak;
  if (profile.last_checkin) {
    const gap = daysBetween(profile.last_checkin, today);
    if (gap === 1) newStreak = profile.streak + 1;
    else if (gap > 1) newStreak = 1; // streak broken
    else newStreak = Math.max(1, profile.streak);
  } else {
    newStreak = 1;
  }

  const longest = Math.max(profile.longest_streak, newStreak);
  await updateProfile(get, set, { streak: newStreak, longest_streak: longest, last_checkin: today });
  if (newStreak > profile.streak) {
    queueCelebration(set, { type: 'streak', amount: newStreak });
  }
}

async function checkAchievements(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  const profileRaw = get().profile;
  const uid = get().session?.user.id;
  if (!profileRaw || !uid) return;
  const profile = profileRaw;
  const unlocked = new Set(get().userAchievements.map(ua => ua.achievement_id));
  const all = get().achievements;
  const tasksDone = get().tasks.filter(t => t.status === 'completed').length;
  const focusCount = get().focusSessions.length;
  const focusMinutes = get().focusSessions.reduce((s, f) => s + f.duration_minutes, 0);
  const habitsTracked = get().habits.length;
  const habitCompletions = get().habitLogs.length;
  const purchasesCount = get().purchases.length;
  const { level } = levelFromXp(profile.xp);

  function shouldUnlock(code: string): boolean {
    const m = code.match(/(\d+)$/);
    const n = m ? parseInt(m[1]) : 0;
    if (code.startsWith('mission_')) return tasksDone >= n;
    if (code.startsWith('hard_mission_')) return get().tasks.filter(t => t.status === 'completed' && t.difficulty === 'hard').length >= n;
    if (code.startsWith('legendary_mission_')) return get().tasks.filter(t => t.status === 'completed' && t.difficulty === 'legendary').length >= n;
    if (code.startsWith('epic_mission_')) return get().tasks.filter(t => t.status === 'completed' && t.difficulty === 'epic').length >= n;
    if (code.startsWith('focus_') && code.includes('session')) return focusCount >= n;
    if (code === 'focus_1') return focusCount >= 1;
    if (code === 'focus_5') return focusCount >= 5;
    if (code === 'focus_10') return focusCount >= 10;
    if (code === 'focus_25') return focusCount >= 25;
    if (code === 'focus_50') return focusCount >= 50;
    if (code === 'focus_100') return focusCount >= 100;
    if (code === 'focus_250') return focusCount >= 250;
    if (code === 'focus_500') return focusCount >= 500;
    if (code === 'focus_750') return focusCount >= 750;
    if (code === 'focus_1000') return focusCount >= 1000;
    if (code.startsWith('focus_minutes_')) return focusMinutes >= n;
    if (code.startsWith('streak_')) return profile.streak >= n;
    if (code.startsWith('level_')) return level >= n;
    if (code.startsWith('xp_')) return profile.xp >= n;
    if (code.startsWith('coins_')) {
      if (code === 'coins_100') return profile.coins >= 100;
      if (code === 'coins_500') return profile.coins >= 500;
      if (code === 'coins_1000') return profile.coins >= 1000;
      if (code === 'coins_5000') return profile.coins >= 5000;
      if (code === 'coins_10000') return profile.coins >= 10000;
      if (code === 'coins_50000') return profile.coins >= 50000;
      if (code === 'coins_100k') return profile.coins >= 100000;
      if (code === 'coins_200k') return profile.coins >= 200000;
      if (code === 'coins_500k') return profile.coins >= 500000;
      if (code === 'coins_1m') return profile.coins >= 1000000;
    }
    if (code === 'first_mission') return tasksDone >= 1;
    if (code === 'first_focus' || code === 'focus_1') return focusCount >= 1;
    if (code === 'first_habit' || code === 'habit_1') return habitsTracked >= 1;
    if (code === 'habits_5') return habitsTracked >= 5;
    if (code === 'habits_10') return habitsTracked >= 10;
    if (code.startsWith('habit_completion_')) return habitCompletions >= n;
    if (code.startsWith('shop_') || code.startsWith('first_purchase') || code === 'theme_buyer' || code === 'avatar_buyer' || code === 'sound_buyer' || code === 'pet_buyer') return purchasesCount >= 1;
    if (code === 'shop_10') return purchasesCount >= 10;
    if (code === 'daily_login_1') return true;
    if (code === 'daily_login_7') return profile.streak >= 7;
    if (code === 'daily_login_30') return profile.streak >= 30;
    if (code === 'daily_login_100') return profile.streak >= 100;
    if (code === 'daily_login_365') return profile.streak >= 365;
    if (code === 'profile_complete') return !!profile.username && !!profile.bio && !!profile.avatar;
    if (code === 'bio_added') return !!profile.bio;
    if (code === 'avatar_changed') return profile.avatar !== '🦊';
    return false;
  }

  const toUnlock = all.filter(a => !unlocked.has(a.id) && shouldUnlock(a.code));
  if (toUnlock.length === 0) return;

  const inserts = toUnlock.map(a => ({ user_id: uid, achievement_id: a.id }));
  const { data } = await supabase.from('user_achievements').insert(inserts as never).select('*');
  if (data) {
    set({ userAchievements: [...get().userAchievements, ...(data as UserAchievement[])] });
    let xpBonus = 0, coinBonus = 0;
    for (const a of toUnlock) {
      xpBonus += a.xp_reward;
      coinBonus += a.coin_reward;
      queueCelebration(set, { type: 'achievement', title: a.title, description: a.description, icon: a.icon, rarity: a.rarity });
      await logActivity(get, set, 'achievement', `Unlocked: ${a.title}`, a.icon);
    }
    if (xpBonus > 0 || coinBonus > 0) {
      await updateProfile(get, set, { xp: profile.xp + xpBonus, coins: profile.coins + coinBonus });
    }
  }
}
