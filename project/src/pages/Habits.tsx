import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { todayStr, daysBetween } from '@/lib/game';
import { Repeat, Plus, X, CheckCircle2, Flame, Trash2 } from 'lucide-react';

const HABIT_ICONS = ['💧', '📚', '🏃', '🧘', '✍️', '💻', '🎯', '🌱', '💊', '😴', '🥗', '🏋️', '🎨', '🎸', '🦷', '☀️'];
const HABIT_COLORS = ['#6C63FF', '#00E5FF', '#10B981', '#FFD700', '#FF8C42', '#FF4D8D', '#7C4DFF'];

export default function Habits() {
  const habits = useStore(s => s.habits);
  const habitLogs = useStore(s => s.habitLogs);
  const addHabit = useStore(s => s.addHabit);
  const toggleHabit = useStore(s => s.toggleHabit);
  const deleteHabit = useStore(s => s.deleteHabit);
  const isHabitDone = useStore(s => s.isHabitDone);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [frequency, setFrequency] = useState('daily');
  const [color, setColor] = useState(HABIT_COLORS[0]);

  const today = todayStr();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addHabit(name.trim(), icon, frequency, color);
    setName(''); setIcon(HABIT_ICONS[0]); setFrequency('daily'); setColor(HABIT_COLORS[0]); setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Repeat className="w-7 h-7 text-accent-emerald" /> Habits
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{habits.length} habits tracked · {habitLogs.length} total completions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="gradient-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 glow-primary self-start"
        >
          <Plus className="w-4 h-4" /> New Habit
        </motion.button>
      </div>

      {habits.length === 0 ? (
        <div className="glass rounded-xl3 p-12 text-center">
          <Repeat className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No habits yet. Create one to start building consistency!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {habits.map((h, i) => {
              const doneToday = isHabitDone(h.id, today);
              const completionRate = last7.filter(d => habitLogs.some(l => l.habit_id === h.id && l.log_date === d)).length / 7;
              return (
                <motion.div
                  key={h.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl2 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${h.color}20` }}>
                      {h.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{h.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="capitalize">{h.frequency}</span>
                        <span className="flex items-center gap-1 text-accent-orange"><Flame className="w-3 h-3" />{h.streak}d streak</span>
                        <span>Best: {h.longest_streak}d</span>
                        <span>{Math.round(completionRate * 100)}% this week</span>
                      </div>
                    </div>
                    {/* Week dots */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {last7.map(d => {
                        const done = habitLogs.some(l => l.habit_id === h.id && l.log_date === d);
                        return (
                          <div
                            key={d}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${done ? 'text-white' : 'bg-white/5 text-gray-700'}`}
                            style={done ? { background: h.color } : {}}
                          >
                            {done && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        );
                      })}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleHabit(h.id, today)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${doneToday ? 'bg-accent-emerald/20 text-accent-emerald' : 'glass hover:bg-white/10 text-gray-400'}`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.button>
                    <button onClick={() => deleteHabit(h.id)} className="text-gray-600 hover:text-red-400 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Progress ring bar */}
                  <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: h.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
            >
              <div className="glass-strong rounded-xl3 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2"><Repeat className="w-5 h-5 text-accent-emerald" /> New Habit</h2>
                  <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Habit Name</label>
                    <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Drink 8 glasses of water" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Icon</label>
                    <div className="grid grid-cols-8 gap-2">
                      {HABIT_ICONS.map(ic => (
                        <button key={ic} type="button" onClick={() => setIcon(ic)} className={`aspect-square rounded-lg text-xl flex items-center justify-center border transition-all ${icon === ic ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-white/20'}`}>{ic}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Color</label>
                    <div className="flex gap-2">
                      {HABIT_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Frequency</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['daily', 'weekly', 'monthly', 'custom'].map(f => (
                        <button key={f} type="button" onClick={() => setFrequency(f)} className={`py-2 rounded-lg text-xs font-medium capitalize border transition-all ${frequency === f ? 'text-primary-400 border-primary-500/40 bg-white/5' : 'text-gray-500 border-white/10 hover:border-white/20'}`}>{f}</button>
                      ))}
                    </div>
                  </div>
                  <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full gradient-primary text-white font-semibold py-3 rounded-xl glow-primary">Create Habit</motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
