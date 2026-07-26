import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { levelFromXp } from '@/lib/game';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Target, Flame, Coins, Zap, Activity } from 'lucide-react';

const PIE_COLORS = ['#6C63FF', '#00E5FF', '#FFD700', '#FF4D8D', '#10B981', '#FF8C42'];

export default function Analytics() {
  const dailyStats = useStore(s => s.dailyStats);
  const tasks = useStore(s => s.tasks);
  const focusSessions = useStore(s => s.focusSessions);
  const habits = useStore(s => s.habits);
  const habitLogs = useStore(s => s.habitLogs);
  const profile = useStore(s => s.profile)!;

  // last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().slice(0, 10);
    const stat = dailyStats.find(s => s.stat_date === ds);
    return {
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      xp: stat?.xp_earned || 0,
      coins: stat?.coins_earned || 0,
      tasks: stat?.tasks_completed || 0,
      focus: stat?.focus_minutes || 0,
      habits: stat?.habits_completed || 0,
    };
  });

  const last7 = last30.slice(-7);
  const totalXp30 = last30.reduce((s, d) => s + d.xp, 0);
  const totalCoins30 = last30.reduce((s, d) => s + d.coins, 0);
  const totalTasks30 = last30.reduce((s, d) => s + d.tasks, 0);
  const totalFocus30 = last30.reduce((s, d) => s + d.focus, 0);
  const totalHabits30 = last30.reduce((s, d) => s + d.habits, 0);

  // task difficulty distribution
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const diffData = (['easy', 'medium', 'hard', 'legendary', 'epic'] as const).map(d => ({
    name: d,
    value: completedTasks.filter(t => t.difficulty === d).length,
  })).filter(d => d.value > 0);

  // focus mode distribution
  const focusData = (['pomodoro', 'deep_work', 'custom'] as const).map(m => ({
    name: m.replace('_', ' '),
    value: focusSessions.filter(f => f.mode === m).length,
  })).filter(d => d.value > 0);

  // heatmap - last 84 days (12 weeks)
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const ds = d.toISOString().slice(0, 10);
    const stat = dailyStats.find(s => s.stat_date === ds);
    const intensity = stat?.xp_earned || 0;
    return { date: ds, intensity, day: d.getDay() };
  });

  const { level } = levelFromXp(profile.xp);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-accent-cyan" /> Analytics
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Track your productivity over time</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard icon={<Zap className="w-5 h-5" />} label="XP (30d)" value={totalXp30.toLocaleString()} color="text-primary-400" />
        <SummaryCard icon={<Coins className="w-5 h-5" />} label="Coins (30d)" value={totalCoins30.toLocaleString()} color="text-accent-gold" />
        <SummaryCard icon={<Target className="w-5 h-5" />} label="Tasks (30d)" value={totalTasks30} color="text-accent-emerald" />
        <SummaryCard icon={<Clock className="w-5 h-5" />} label="Focus min (30d)" value={totalFocus30} color="text-accent-cyan" />
        <SummaryCard icon={<Activity className="w-5 h-5" />} label="Habits (30d)" value={totalHabits30} color="text-accent-pink" />
      </div>

      {/* XP Line chart */}
      <ChartCard title="XP Growth (30 days)" icon={<TrendingUp className="w-5 h-5 text-primary-400" />}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={last30}>
            <defs>
              <linearGradient id="xpLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} interval={4} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
            <Line type="monotone" dataKey="xp" stroke="#6C63FF" strokeWidth={2} dot={false} fill="url(#xpLine)" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly bar chart */}
        <ChartCard title="This Week" icon={<BarChart3 className="w-5 h-5 text-accent-cyan" />}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="xp" fill="#00E5FF" radius={[6, 6, 0, 0]} />
              <Bar dataKey="tasks" fill="#6C63FF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Difficulty pie */}
        <ChartCard title="Mission Difficulty" icon={<Target className="w-5 h-5 text-accent-emerald" />}>
          {diffData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={diffData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {diffData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Heatmap */}
      <ChartCard title="Activity Heatmap (12 weeks)" icon={<Flame className="w-5 h-5 text-accent-orange" />}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const cell = heatmap[idx];
                if (!cell) return <div key={dayIdx} className="w-4 h-4" />;
                const level = cell.intensity === 0 ? 0 : cell.intensity < 50 ? 1 : cell.intensity < 150 ? 2 : cell.intensity < 300 ? 3 : 4;
                const colors = ['bg-white/[0.04]', 'bg-primary-500/20', 'bg-primary-500/40', 'bg-primary-500/70', 'bg-primary-500'];
                return <div key={dayIdx} className={`w-4 h-4 rounded ${colors[level]}`} title={`${cell.date}: ${cell.intensity} XP`} />;
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>Less</span>
          {['bg-white/[0.04]', 'bg-primary-500/20', 'bg-primary-500/40', 'bg-primary-500/70', 'bg-primary-500'].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded ${c}`} />
          ))}
          <span>More</span>
        </div>
      </ChartCard>

      {/* Focus mode distribution */}
      <ChartCard title="Focus Mode Distribution" icon={<Clock className="w-5 h-5 text-accent-cyan" />}>
        {focusData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={focusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {focusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(20,20,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl2 p-4">
      <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-2 ${color}`}>{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-display font-bold mt-0.5">{value}</p>
    </motion.div>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl3 p-6">
      <h3 className="font-display font-semibold flex items-center gap-2 mb-4">{icon} {title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">No data yet</div>;
}
