import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { FOCUS_REWARDS } from '@/lib/game';
import { Timer, Play, Pause, Square, Coffee, Brain, Settings2, Volume2, VolumeX } from 'lucide-react';

type Mode = 'pomodoro' | 'deep_work' | 'custom';

const PRESETS: Record<Mode, { label: string; minutes: number; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pomodoro: { label: 'Pomodoro', minutes: 25, icon: Timer, color: 'text-primary-400' },
  deep_work: { label: 'Deep Work', minutes: 50, icon: Brain, color: 'text-accent-cyan' },
  custom: { label: 'Custom', minutes: 30, icon: Settings2, color: 'text-accent-pink' },
};

const SOUNDS = [
  { id: 'rain', label: 'Rain', icon: '🌧️' },
  { id: 'cafe', label: 'Cafe', icon: '☕' },
  { id: 'brown', label: 'Brown Noise', icon: '🔊' },
  { id: 'lofi', label: 'Lo-fi', icon: '🎵' },
  { id: 'forest', label: 'Forest', icon: '🌳' },
  { id: 'ocean', label: 'Ocean', icon: '🌊' },
];

export default function Focus() {
  const logFocusSession = useStore(s => s.logFocusSession);
  const focusSessions = useStore(s => s.focusSessions);
  const [mode, setMode] = useState<Mode>('pomodoro');
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const d = PRESETS[mode].minutes;
    setDuration(d);
    setRemaining(d * 60);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false);
            handleComplete();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleComplete = useCallback(async () => {
    await logFocusSession(mode, duration);
  }, [logFocusSession, mode, duration]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = 1 - remaining / (duration * 60);
  const circumference = 2 * Math.PI * 130;

  const rewards = FOCUS_REWARDS[mode];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Timer className="w-7 h-7 text-primary-400" /> Focus Mode
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Deep work earns more XP. Stay focused and level up.</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PRESETS) as Mode[]).map(m => {
          const p = PRESETS[m];
          const Icon = p.icon;
          return (
            <button
              key={m}
              onClick={() => { setMode(m); setRunning(false); }}
              className={`relative px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition-all ${mode === m ? 'glass-strong border-primary-500/30 ' + p.color : 'glass border-white/[0.06] text-gray-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Timer */}
      <div className="glass-strong rounded-xl3 p-8 flex flex-col items-center">
        {/* Circular timer */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="130" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle
              cx="140" cy="140" r="130" fill="none"
              stroke="url(#timerGrad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6C63FF" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <motion.div
              key={remaining}
              initial={remaining < duration * 60 ? { scale: 1.05 } : {}}
              animate={{ scale: 1 }}
              className="text-6xl font-display font-bold tabular-nums"
            >
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </motion.div>
            <p className="text-sm text-gray-500 mt-2">{PRESETS[mode].label} · {duration} min</p>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs">
              <span className="text-primary-400">+{Math.round(duration * rewards.xpPerMin)} XP</span>
              <span className="text-accent-gold">+{Math.round(duration * rewards.coinsPerMin)} 🪙</span>
            </div>
          </div>
        </div>

        {/* Custom duration slider */}
        {mode === 'custom' && !running && (
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Duration</span>
              <span>{duration} min</span>
            </div>
            <input
              type="range" min={5} max={120} step={5}
              value={duration}
              onChange={e => { const v = Number(e.target.value); setDuration(v); setRemaining(v * 60); }}
              className="w-full"
            />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          {!running ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRunning(true)}
              className="gradient-primary w-16 h-16 rounded-full flex items-center justify-center glow-primary"
            >
              <Play className="w-7 h-7 text-white" fill="white" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRunning(false)}
              className="glass-strong w-16 h-16 rounded-full flex items-center justify-center border border-white/20"
            >
              <Pause className="w-7 h-7 text-white" />
            </motion.button>
          )}
          <button
            onClick={() => { setRunning(false); setRemaining(duration * 60); }}
            className="glass w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10"
          >
            <Square className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Ambient sounds */}
      <div className="glass rounded-xl3 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Coffee className="w-5 h-5 text-accent-cyan" /> Ambient Sounds
          </h3>
          <button onClick={() => setSound(sound ? null : 'rain')} className="text-gray-400 hover:text-white">
            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SOUNDS.map(s => (
            <button
              key={s.id}
              onClick={() => setSound(sound === s.id ? null : s.id)}
              className={`p-3 rounded-xl text-center border transition-all ${sound === s.id ? 'glass-strong border-primary-500/40' : 'glass border-white/[0.06] hover:border-white/20'}`}
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </button>
          ))}
        </div>
        {sound && <p className="text-xs text-gray-500 mt-3 text-center">Playing: {SOUNDS.find(s => s.id === sound)?.label} (preview — connect a sound source to enable audio)</p>}
      </div>

      {/* Recent sessions */}
      <div className="glass rounded-xl3 p-6">
        <h3 className="font-display font-semibold mb-4">Recent Sessions</h3>
        {focusSessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No sessions yet. Start your first focus session!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {focusSessions.slice(0, 10).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.mode === 'pomodoro' ? '🍅' : s.mode === 'deep_work' ? '🧠' : '⚙️'}</span>
                  <span className="text-gray-300">{s.duration_minutes} min {s.mode.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-primary-400">+{s.xp_earned} XP</span>
                  <span className="text-accent-gold">+{s.coins_earned} 🪙</span>
                  <span className="text-gray-600">{new Date(s.completed_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
