import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { RARITY_STYLES } from '@/lib/game';
import type { Rarity } from '@/lib/types';
import { Trophy, Lock, Search } from 'lucide-react';

const CATEGORIES = ['all', 'missions', 'focus', 'streaks', 'xp', 'coins', 'habits', 'time', 'coding', 'learning', 'health', 'legendary', 'general'];

export default function Achievements() {
  const achievements = useStore(s => s.achievements);
  const userAchievements = useStore(s => s.userAchievements);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const filtered = achievements.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unlockedCount = achievements.filter(a => unlockedIds.has(a.id)).length;
  const pct = achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0;

  // rarity counts
  const rarityCounts = (['common', 'rare', 'epic', 'legendary', 'mythic'] as Rarity[]).map(r => ({
    rarity: r,
    total: achievements.filter(a => a.rarity === r).length,
    unlocked: achievements.filter(a => a.rarity === r && unlockedIds.has(a.id)).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-accent-gold" /> Achievements
        </h1>
        <p className="text-gray-400 mt-1 text-sm">{unlockedCount} of {achievements.length} unlocked · {pct}% complete</p>
      </div>

      {/* Progress bar */}
      <div className="glass-strong rounded-xl2 p-4">
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full gradient-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {rarityCounts.map(rc => {
            const r = RARITY_STYLES[rc.rarity];
            return (
              <div key={rc.rarity} className={`text-xs px-2.5 py-1 rounded-full ${r.bg} ${r.color} border ${r.border}`}>
                {r.label}: {rc.unlocked}/{rc.total}
              </div>
            );
          })}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search achievements..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary-500/50"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${filter === c ? 'glass-strong text-white' : 'text-gray-500 hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((a, i) => {
          const unlocked = unlockedIds.has(a.id);
          const r = RARITY_STYLES[a.rarity];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              whileHover={{ scale: 1.04, y: -2 }}
              className={`relative glass rounded-xl2 p-4 text-center border ${unlocked ? r.border : 'border-white/[0.06]'} ${unlocked ? r.glow : ''} ${!unlocked ? 'opacity-50' : ''}`}
            >
              <div className={`text-4xl mb-2 ${!unlocked ? 'grayscale' : ''}`}>
                {unlocked ? a.icon : <Lock className="w-8 h-8 mx-auto text-gray-700" />}
              </div>
              <p className="text-sm font-semibold truncate">{a.title}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.description}</p>
              <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block ${r.bg} ${r.color} ${r.border} border`}>{r.label}</div>
              {unlocked && (a.xp_reward > 0 || a.coin_reward > 0) && (
                <div className="flex items-center justify-center gap-2 mt-2 text-xs">
                  {a.xp_reward > 0 && <span className="text-primary-400">+{a.xp_reward} XP</span>}
                  {a.coin_reward > 0 && <span className="text-accent-gold">+{a.coin_reward} 🪙</span>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
