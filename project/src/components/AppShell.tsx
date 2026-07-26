import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { levelFromXp } from '@/lib/game';
import {
  LayoutDashboard, Swords, Timer, Repeat, Trophy, ShoppingBag,
  BarChart3, Settings, LogOut, Zap, Menu, X, Flame, Coins, Sparkles,
} from 'lucide-react';
import Dashboard from '@/pages/Dashboard';
import Missions from '@/pages/Missions';
import Focus from '@/pages/Focus';
import Habits from '@/pages/Habits';
import Achievements from '@/pages/Achievements';
import Shop from '@/pages/Shop';
import Analytics from '@/pages/Analytics';
import SettingsPage from '@/pages/Settings';

type Page = 'dashboard' | 'missions' | 'focus' | 'habits' | 'achievements' | 'shop' | 'analytics' | 'settings';

const NAV: { id: Page; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'missions', label: 'Missions', icon: Swords },
  { id: 'focus', label: 'Focus', icon: Timer },
  { id: 'habits', label: 'Habits', icon: Repeat },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AppShell() {
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useStore(s => s.profile);
  const signOut = useStore(s => s.signOut);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keys: Record<string, Page> = { '1': 'dashboard', '2': 'missions', '3': 'focus', '4': 'habits', '5': 'achievements', '6': 'shop', '7': 'analytics', '8': 'settings' };
      if (keys[e.key]) { setPage(keys[e.key]); setMobileOpen(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!profile) return null;
  const { level, progress, intoLevel, xpForNext } = levelFromXp(profile.xp);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 glass border-r border-white/[0.06] p-4 z-40">
        <SidebarContent page={page} setPage={setPage} profile={profile} level={level} progress={progress} intoLevel={intoLevel} xpForNext={xpForNext} signOut={signOut} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 glass-strong border-r border-white/[0.1] p-4 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent page={page} setPage={(p) => { setPage(p); setMobileOpen(false); }} profile={profile} level={level} progress={progress} intoLevel={intoLevel} xpForNext={xpForNext} signOut={signOut} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 glass border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-400" fill="currentColor" />
            <span className="font-display font-bold gradient-text">DopamineOS</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-accent-gold"><Flame className="w-4 h-4" />{profile.streak}</span>
            <span className="flex items-center gap-1 text-accent-gold"><Coins className="w-4 h-4" />{profile.coins}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="p-4 lg:p-8 max-w-7xl mx-auto"
          >
            {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
            {page === 'missions' && <Missions />}
            {page === 'focus' && <Focus />}
            {page === 'habits' && <Habits />}
            {page === 'achievements' && <Achievements />}
            {page === 'shop' && <Shop />}
            {page === 'analytics' && <Analytics />}
            {page === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarContent({ page, setPage, profile, level, progress, intoLevel, xpForNext, signOut }: {
  page: Page; setPage: (p: Page) => void; profile: { username: string; avatar: string; streak: number; coins: number; xp: number };
  level: number; progress: number; intoLevel: number; xpForNext: number; signOut: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 py-2 mb-6">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        <span className="font-display font-bold text-lg gradient-text">DopamineOS</span>
      </div>

      {/* Profile card */}
      <div className="glass rounded-xl2 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">{profile.avatar}</div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-white border-2 border-ink-800">{level}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{profile.username}</p>
            <p className="text-xs text-gray-500">Level {level}</p>
          </div>
        </div>
        {/* XP bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{intoLevel} XP</span>
            <span>{xpForNext} XP</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        {/* stats */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
            <Flame className="w-3.5 h-3.5 text-accent-orange" />
            <span className="text-gray-300">{profile.streak}d</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-white/5 rounded-lg px-2.5 py-1.5">
            <Coins className="w-3.5 h-3.5 text-accent-gold" />
            <span className="text-gray-300">{profile.coins}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {active && (
                <motion.div
                  layoutId="navActive"
                  className="absolute inset-0 gradient-primary/20 rounded-xl border border-primary-500/30"
                  style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,229,255,0.08))' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* sign out */}
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all mt-2"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    </>
  );
}
