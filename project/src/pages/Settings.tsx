import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Settings, User, Mail, Calendar, Flame, Coins, Zap, Trophy, Save, Check } from 'lucide-react';

const AVATARS = ['🦊', '🐉', '🦄', '🤖', '🧙', '🥷', '🐼', '🐱', '🐺', '🦉', '🐧', '🔥', '⚡', '🌟', '👑', '🦸', '🧛', '🦅'];

export default function SettingsPage() {
  const profile = useStore(s => s.profile)!;
  const refreshProfile = useStore(s => s.refreshProfile);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    await supabase.from('profiles').update({ username, bio, avatar }).eq('id', profile.id);
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-gray-400" /> Settings
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Manage your profile and preferences</p>
      </div>

      {/* Profile card */}
      <div className="glass-strong rounded-xl3 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center text-5xl">{avatar}</div>
          <div>
            <h2 className="text-2xl font-display font-bold">{profile.username || 'Player'}</h2>
            <p className="text-sm text-gray-500">Joined {joinDate}</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatBox icon={<Zap className="w-4 h-4" />} label="Level" value={profile.level} color="text-primary-400" />
          <StatBox icon={<Flame className="w-4 h-4" />} label="Streak" value={`${profile.streak}d`} color="text-accent-orange" />
          <StatBox icon={<Coins className="w-4 h-4" />} label="Coins" value={profile.coins.toLocaleString()} color="text-accent-gold" />
          <StatBox icon={<Trophy className="w-4 h-4" />} label="Best Streak" value={`${profile.longest_streak}d`} color="text-accent-emerald" />
        </div>

        {/* Edit fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your productivity journey..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all resize-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Avatar</label>
            <div className="grid grid-cols-9 gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} className={`aspect-square rounded-xl text-2xl flex items-center justify-center border transition-all ${avatar === a ? 'border-primary-500 bg-primary-500/10 scale-105' : 'border-white/10 hover:border-white/20'}`}>{a}</button>
              ))}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${saved ? 'bg-accent-emerald/20 text-accent-emerald' : 'gradient-primary text-white glow-primary'}`}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </motion.button>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="glass rounded-xl3 p-6">
        <h3 className="font-display font-semibold mb-4">Keyboard Shortcuts</h3>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            { key: '1', action: 'Dashboard' },
            { key: '2', action: 'Missions' },
            { key: '3', action: 'Focus' },
            { key: '4', action: 'Habits' },
            { key: '5', action: 'Achievements' },
            { key: '6', action: 'Shop' },
            { key: '7', action: 'Analytics' },
            { key: '8', action: 'Settings' },
          ].map(s => (
            <div key={s.key} className="flex items-center justify-between py-1.5">
              <span className="text-gray-400">{s.action}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className={`flex items-center gap-1.5 text-xs ${color} mb-1`}>{icon}<span>{label}</span></div>
      <p className="text-lg font-display font-bold">{value}</p>
    </div>
  );
}
