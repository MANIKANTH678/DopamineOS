import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { levelFromXp, DIFFICULTY_REWARDS, getDailyQuote, todayStr } from '@/lib/game';
import type { Difficulty } from '@/lib/types';
import {
  Flame, Coins, Zap, Target, Clock, TrendingUp, Quote,
  Plus, CheckCircle2, Circle, Trophy, Sparkles, ChevronRight, Brain,
} from 'lucide-react';

interface Props {
  onNavigate: (page: 'dashboard' | 'missions' | 'focus' | 'habits' | 'achievements' | 'shop' | 'analytics' | 'settings') => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const profile = useStore(s => s.profile)!;
  const tasks = useStore(s => s.tasks);
  const habits = useStore(s => s.habits);
  const focusSessions = useStore(s => s.focusSessions);
  const activity = useStore(s => s.activity);
  const userAchievements = useStore(s => s.userAchievements);
  const dailyStats = useStore(s => s.dailyStats);
  const isHabitDone = useStore(s => s.isHabitDone);
  const completeTask = useStore(s => s.completeTask);

  const { level, progress, intoLevel, xpForNext } = levelFromXp(profile.xp);
  const today = todayStr();
  const todayTasks = tasks.filter(t => t.due_date === today || (!t.due_date && t.status === 'pending'));
  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 5);
  const completedToday = tasks.filter(t => t.status === 'completed' && t.completed_at?.startsWith(today));
  const todayHabits = habits.filter(h => h.frequency === 'daily');
  const habitsDoneToday = todayHabits.filter(h => isHabitDone(h.id, today)).length;
  const todayStat = dailyStats.find(s => s.stat_date === today);
  const quote = getDailyQuote();

  // weekly data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().slice(0, 10);
    const stat = dailyStats.find(s => s.stat_date === ds);
    return { day: d.toLocaleDateString('en', { weekday: 'short' }), xp: stat?.xp_earned || 0, tasks: stat?.tasks_completed || 0 };
  });

  const maxWeekly = Math.max(...last7.map(d => d.xp), 100);
  const totalFocusMin = focusSessions.reduce((s, f) => s + f.duration_minutes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-display font-bold"
          >
            Welcome back, <span className="gradient-text">{profile.username}</span>
          </motion.h1>
          <p className="text-gray-400 mt-1 text-sm">
            {completedToday.length > 0
              ? `You've completed ${completedToday.length} mission${completedToday.length > 1 ? 's' : ''} today. Keep going!`
              : 'Ready to crush some missions today?'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate('missions')}
          className="gradient-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 glow-primary"
        >
          <Plus className="w-4 h-4" /> Quick Add Mission
        </motion.button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Zap className="w-5 h-5" />} label="Level" value={level} sub={`${intoLevel}/${xpForNext} XP`} progress={progress} color="primary" delay={0} />
        <StatCard icon={<Flame className="w-5 h-5" />} label="Current Streak" value={`${profile.streak}`} sub={`Best: ${profile.longest_streak}d`} color="orange" delay={0.05} />
        <StatCard icon={<Coins className="w-5 h-5" />} label="Coins" value={profile.coins.toLocaleString()} sub={`+${todayStat?.coins_earned || 0} today`} color="gold" delay={0.1} />
        <StatCard icon={<Target className="w-5 h-5" />} label="Productivity" value={profile.productivity_score} sub="Score" color="cyan" delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left col: XP + Missions */}
        <div className="lg:col-span-2 space-y-6">
          {/* XP Progress big card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl3 p-6 relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Experience</p>
                  <p className="text-2xl font-display font-bold">Level {level}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-bold gradient-text">{profile.xp.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total XP</p>
                </div>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full gradient-primary rounded-full relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                </motion.div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{xpForNext - intoLevel} XP until Level {level + 1}</p>
            </div>
          </motion.div>

          {/* Today's Missions */}
          <div className="glass rounded-xl3 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-400" /> Today's Missions
              </h2>
              <button onClick={() => onNavigate('missions')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending missions. Add one to start earning XP!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task, i) => {
                  const r = DIFFICULTY_REWARDS[task.difficulty];
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                    >
                      <button
                        onClick={() => completeTask(task.id)}
                        className="text-gray-500 hover:text-accent-emerald transition-colors"
                      >
                        <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${r.color}`}>{r.label}</span>
                          <span className="text-xs text-gray-500">+{task.xp_reward} XP</span>
                          <span className="text-xs text-accent-gold">+{task.coin_reward}🪙</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Weekly graph */}
          <div className="glass rounded-xl3 p-6">
            <h2 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent-cyan" /> Weekly Progress
            </h2>
            <div className="flex items-end justify-between gap-2 h-40">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    className="w-full rounded-t-lg gradient-primary relative group"
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.xp / maxWeekly) * 100}%` }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 100 }}
                    style={{ minHeight: d.xp > 0 ? 8 : 2 }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{d.xp}</span>
                  </motion.div>
                  <span className="text-xs text-gray-500">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {/* Focus timer mini */}
          <motion.button
            onClick={() => onNavigate('focus')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full glass-strong rounded-xl3 p-6 text-left relative overflow-hidden group"
          >
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent-cyan/10 rounded-full blur-3xl group-hover:bg-accent-cyan/20 transition-colors" />
            <div className="relative">
              <Clock className="w-8 h-8 text-accent-cyan mb-3" />
              <h3 className="font-display font-semibold">Focus Mode</h3>
              <p className="text-sm text-gray-400 mt-1">Start a focus session and earn XP for deep work.</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span>{totalFocusMin} min total</span>
                <span>·</span>
                <span>{focusSessions.length} sessions</span>
              </div>
            </div>
          </motion.button>

          {/* Habits today */}
          <div className="glass rounded-xl3 p-6">
            <h3 className="font-display font-semibold flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-accent-emerald" /> Today's Habits
            </h3>
            {todayHabits.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No daily habits yet.</p>
            ) : (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{habitsDoneToday}/{todayHabits.length} done</span>
                    <span>{Math.round((habitsDoneToday / todayHabits.length) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-accent-emerald rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(habitsDoneToday / todayHabits.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  {todayHabits.slice(0, 4).map(h => (
                    <div key={h.id} className="flex items-center gap-2 text-sm">
                      <span>{h.icon}</span>
                      <span className={`flex-1 truncate ${isHabitDone(h.id, today) ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{h.name}</span>
                      {isHabitDone(h.id, today) ? <CheckCircle2 className="w-4 h-4 text-accent-emerald" /> : <Circle className="w-4 h-4 text-gray-600" />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* AI Coach */}
          <div className="glass-strong rounded-xl3 p-6 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/15 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-display font-semibold">AI Coach</h3>
              </div>
              <p className="text-sm text-gray-300 italic">"{getCoachMessage(completedToday.length, habitsDoneToday, todayHabits.length)}"</p>
              <p className="text-xs text-gray-500 mt-2">— Coach Nova</p>
            </div>
          </div>

          {/* Quote */}
          <div className="glass rounded-xl3 p-6">
            <Quote className="w-5 h-5 text-primary-400 mb-2" />
            <p className="text-sm text-gray-300 italic">"{quote.text}"</p>
            <p className="text-xs text-gray-500 mt-2">— {quote.author}</p>
          </div>
        </div>
      </div>

      {/* Bottom: Recent activity + Achievements */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl3 p-6">
          <h3 className="font-display font-semibold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary-400" /> Recent Activity
          </h3>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No activity yet. Complete a mission to get started!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {activity.slice(0, 10).map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 text-sm py-1.5"
                >
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-gray-300 flex-1">{a.message}</span>
                  <span className="text-xs text-gray-600">{new Date(a.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl3 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-gold" /> Achievements
            </h3>
            <button onClick={() => onNavigate('achievements')} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-3">{userAchievements.length} unlocked</p>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const ua = userAchievements[i];
              if (!ua) return <div key={i} className="aspect-square rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-700 text-xl">?</div>;
              const ach = useStore.getState().achievements.find(a => a.id === ua.achievement_id);
              return (
                <motion.div
                  key={ua.id}
                  whileHover={{ scale: 1.1 }}
                  className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl"
                  title={ach?.title}
                >
                  {ach?.icon || '🏆'}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, progress, color, delay }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; progress?: number;
  color: 'primary' | 'orange' | 'gold' | 'cyan'; delay: number;
}) {
  const colors = {
    primary: 'text-primary-400 bg-primary-500/10',
    orange: 'text-accent-orange bg-accent-orange/10',
    gold: 'text-accent-gold bg-accent-gold/10',
    cyan: 'text-accent-cyan bg-accent-cyan/10',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-xl2 p-4 relative overflow-hidden"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>{icon}</div>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-display font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      {progress !== undefined && (
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ delay: delay + 0.2, duration: 0.8 }}
          />
        </div>
      )}
    </motion.div>
  );
}

function getCoachMessage(tasksDone: number, habitsDone: number, totalHabits: number): string {
  if (tasksDone === 0 && habitsDone === 0) return "Let's start small — pick one mission and knock it out. Momentum builds from there.";
  if (tasksDone >= 5) return "Incredible pace today! Remember to hydrate and take a 5-minute break between missions.";
  if (habitsDone === totalHabits && totalHabits > 0) return "All habits done —that's consistency in action. Your future self is grateful.";
  if (tasksDone > 0 && habitsDone < totalHabits) return "Great start on missions. A quick habit check-in keeps your streak alive.";
  return "You're making progress. Every mission completed is a vote for the person you're becoming.";
}
