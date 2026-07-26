import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { DIFFICULTY_REWARDS } from '@/lib/game';
import type { Difficulty, Task } from '@/lib/types';
import {
  Plus, X, Swords, CheckCircle2, Circle, Trash2, Calendar,
  ChevronDown, Filter, Zap, Coins, Flame,
} from 'lucide-react';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'legendary', 'epic'];

export default function Missions() {
  const tasks = useStore(s => s.tasks);
  const addTask = useStore(s => s.addTask);
  const completeTask = useStore(s => s.completeTask);
  const deleteTask = useStore(s => s.deleteTask);

  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const pending = tasks.filter(t => t.status === 'pending');
  const completed = tasks.filter(t => t.status === 'completed');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask(title.trim(), difficulty, dueDate || null, description.trim());
    setTitle(''); setDescription(''); setDueDate(''); setDifficulty('medium'); setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Swords className="w-7 h-7 text-primary-400" /> Missions
          </h1>
          <p className="text-gray-400 mt-1 text-sm">{pending.length} active · {completed.length} completed · {tasks.length} total</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAdd(true)}
          className="gradient-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 glow-primary self-start"
        >
          <Plus className="w-4 h-4" /> New Mission
        </motion.button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
        {(['pending', 'completed', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`relative px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${filter === f ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {filter === f && <motion.div layoutId="missionFilter" className="absolute inset-0 gradient-primary rounded-lg" transition={{ type: 'spring', stiffness: 300, damping: 25 }} />}
            <span className="relative z-10">{f}</span>
          </button>
        ))}
      </div>

      {/* Mission list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl3 p-12 text-center">
          <Swords className="w-12 h-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-500">No {filter} missions. Create one to start your quest!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((task, i) => (
              <MissionCard key={task.id} task={task} index={i} onComplete={() => completeTask(task.id)} onDelete={() => deleteTask(task.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg"
            >
              <div className="glass-strong rounded-xl3 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-display font-bold flex items-center gap-2">
                    <Swords className="w-5 h-5 text-primary-400" /> New Mission
                  </h2>
                  <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Mission Title</label>
                    <input
                      autoFocus
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Complete DSA Question"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Description (optional)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Add details..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Difficulty</label>
                    <div className="grid grid-cols-5 gap-2">
                      {DIFFICULTIES.map(d => {
                        const r = DIFFICULTY_REWARDS[d];
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`py-2 rounded-lg text-xs font-medium border transition-all ${difficulty === d ? `${r.color} border-current bg-white/5` : 'text-gray-500 border-white/10 hover:border-white/20'}`}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-primary-400"><Zap className="w-3 h-3" />+{DIFFICULTY_REWARDS[difficulty].xp} XP</span>
                      <span className="flex items-center gap-1 text-accent-gold"><Coins className="w-3 h-3" />+{DIFFICULTY_REWARDS[difficulty].coins} coins</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Due Date (optional)</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 transition-all"
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full gradient-primary text-white font-semibold py-3 rounded-xl glow-primary"
                  >
                    Create Mission
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MissionCard({ task, index, onComplete, onDelete }: {
  task: Task; index: number; onComplete: () => void; onDelete: () => void;
}) {
  const r = DIFFICULTY_REWARDS[task.difficulty];
  const isDone = task.status === 'completed';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04 }}
      className={`glass rounded-xl2 p-4 border-l-2 ${isDone ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: r.color.includes('emerald') ? '#10B981' : r.color.includes('primary') ? '#6C63FF' : r.color.includes('orange') ? '#FF8C42' : r.color.includes('gold') ? '#FFD700' : '#FF4D8D' }}
    >
      <div className="flex items-start gap-3">
        <button onClick={onComplete} className="mt-0.5 transition-transform hover:scale-110">
          {isDone ? <CheckCircle2 className="w-6 h-6 text-accent-emerald" /> : <Circle className="w-6 h-6 text-gray-600 hover:text-primary-400" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${isDone ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${r.color} bg-white/5`}>{r.label}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Zap className="w-3 h-3" />{task.xp_reward}</span>
            <span className="text-xs text-accent-gold flex items-center gap-1"><Coins className="w-3 h-3" />{task.coin_reward}</span>
            {task.due_date && <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{task.due_date}</span>}
          </div>
        </div>
        <button onClick={onDelete} className="text-gray-600 hover:text-red-400 transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
