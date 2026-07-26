import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { RARITY_STYLES } from '@/lib/game';
import type { Rarity } from '@/lib/types';

export default function Celebrations() {
  const celebrations = useStore(s => s.celebrations);
  const dismiss = useStore(s => s.dismissCelebration);

  useEffect(() => {
    if (celebrations.length === 0) return;
    const t = setTimeout(() => dismiss(celebrations[0].id), 3500);
    return () => clearTimeout(t);
  }, [celebrations, dismiss]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center gap-4">
      <AnimatePresence>
        {celebrations.map((c) => {
          if (c.type === 'levelup') return <LevelUp key={c.id} level={c.amount || 0} onDone={() => dismiss(c.id)} />;
          if (c.type === 'achievement') return <AchievementPopup key={c.id} title={c.title || ''} description={c.description || ''} icon={c.icon || '🏆'} rarity={c.rarity as Rarity} onDone={() => dismiss(c.id)} />;
          if (c.type === 'streak') return <StreakPopup key={c.id} streak={c.amount || 0} onDone={() => dismiss(c.id)} />;
          return <XpCoinPopup key={c.id} type={c.type} amount={c.amount || 0} onDone={() => dismiss(c.id)} />;
        })}
      </AnimatePresence>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = ['#6C63FF', '#00E5FF', '#FFD700', '#FF4D8D', '#10B981', '#FF8C42'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.5 + Math.random();
        const color = colors[i % colors.length];
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-sm"
            style={{ background: color, left: `${x}%`, top: '-10px' }}
            initial={{ y: 0, opacity: 1, rotate: 0 }}
            animate={{ y: '100vh', opacity: 0, rotate: 720 }}
            transition={{ duration, delay, ease: 'easeIn' }}
          />
        );
      })}
    </div>
  );
}

function LevelUp({ level, onDone }: { level: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative glass-strong rounded-xl3 px-12 py-8 flex flex-col items-center glow-primary"
    >
      <Confetti />
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="text-6xl mb-2"
      >
        🆙
      </motion.div>
      <p className="text-sm uppercase tracking-widest text-primary-300 font-semibold">Level Up</p>
      <p className="text-5xl font-display font-bold gradient-text neon-text mt-1">Level {level}</p>
    </motion.div>
  );
}

function AchievementPopup({ title, description, icon, rarity, onDone }: { title: string; description: string; icon: string; rarity: Rarity; onDone: () => void }) {
  const r = RARITY_STYLES[rarity];
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      className={`relative glass-strong rounded-xl3 px-10 py-6 flex items-center gap-5 border-2 ${r.border} ${r.glow}`}
    >
      <Confetti />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 8, -8, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-5xl"
      >
        {icon}
      </motion.div>
      <div>
        <p className={`text-xs uppercase tracking-widest font-semibold ${r.color}`}>{r.label} Achievement</p>
        <p className="text-xl font-display font-bold text-white">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
}

function StreakPopup({ streak, onDone }: { streak: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="relative glass-strong rounded-xl3 px-10 py-6 flex items-center gap-4 glow-gold"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="text-5xl"
      >
        🔥
      </motion.div>
      <div>
        <p className="text-xs uppercase tracking-widest text-accent-gold font-semibold">Streak</p>
        <p className="text-3xl font-display font-bold gradient-gold neon-gold">{streak} Days</p>
      </div>
    </motion.div>
  );
}

function XpCoinPopup({ type, amount, onDone }: { type: string; amount: number; onDone: () => void }) {
  const isXp = type === 'xp';
  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -30, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      className={`glass-strong rounded-full px-6 py-3 flex items-center gap-2 ${isXp ? 'glow-primary' : 'glow-gold'}`}
    >
      <motion.span
        animate={{ y: [0, -6, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="text-2xl"
      >
        {isXp ? '✨' : '🪙'}
      </motion.span>
      <span className={`font-display font-bold text-lg ${isXp ? 'gradient-text' : 'gradient-gold'}`}>
        +{amount} {isXp ? 'XP' : 'Coins'}
      </span>
    </motion.div>
  );
}
