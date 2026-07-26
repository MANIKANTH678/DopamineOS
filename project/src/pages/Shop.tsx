import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { RARITY_STYLES } from '@/lib/game';
import type { ShopItem } from '@/lib/types';
import { ShoppingBag, Coins, Check, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🛍️' },
  { id: 'theme', label: 'Themes', icon: '🎨' },
  { id: 'avatar', label: 'Avatars', icon: '🎭' },
  { id: 'sound', label: 'Sounds', icon: '🎵' },
  { id: 'pet', label: 'Pets', icon: '🐾' },
  { id: 'frame', label: 'Frames', icon: '🖼️' },
  { id: 'title', label: 'Titles', icon: '🏷️' },
  { id: 'booster', label: 'Boosters', icon: '⚡' },
  { id: 'wallpaper', label: 'Wallpapers', icon: '🌌' },
  { id: 'music', label: 'Music', icon: '🎧' },
  { id: 'ai_personality', label: 'AI Coaches', icon: '🤖' },
  { id: 'animation', label: 'Animations', icon: '✨' },
  { id: 'character', label: 'Characters', icon: '🦸' },
  { id: 'badge', label: 'Badges', icon: '🎖️' },
];

export default function Shop() {
  const shopItems = useStore(s => s.shopItems);
  const purchases = useStore(s => s.purchases);
  const profile = useStore(s => s.profile)!;
  const buyItem = useStore(s => s.buyItem);
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState<ShopItem | null>(null);

  const ownedIds = new Set(purchases.map(p => p.shop_item_id));
  const filtered = shopItems.filter(i => filter === 'all' || i.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-primary-400" /> Reward Shop
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Spend coins on themes, avatars, pets, and more</p>
        </div>
        <div className="glass-strong rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent-gold" />
          <span className="font-display font-bold text-lg gradient-gold">{profile.coins.toLocaleString()}</span>
          <span className="text-xs text-gray-500">coins</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${filter === c.id ? 'glass-strong text-white' : 'glass text-gray-400 hover:text-white'}`}
          >
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((item, i) => {
          const owned = ownedIds.has(item.id);
          const r = RARITY_STYLES[item.rarity];
          const canAfford = profile.coins >= item.price;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              whileHover={{ y: -4 }}
              className={`relative glass rounded-xl2 p-4 border ${r.border} ${r.glow} flex flex-col`}
            >
              {owned && (
                <div className="absolute top-2 right-2 bg-accent-emerald/20 text-accent-emerald rounded-full p-1">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="text-5xl text-center py-4">{item.icon}</div>
              <p className="font-semibold text-sm text-center">{item.name}</p>
              <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2 flex-1">{item.description}</p>
              <div className={`text-xs text-center mt-2 ${r.color}`}>{r.label}</div>
              {owned ? (
                <div className="mt-3 py-2 rounded-xl bg-accent-emerald/10 text-accent-emerald text-sm font-semibold text-center flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Owned
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: canAfford ? 1.03 : 1 }}
                  whileTap={{ scale: canAfford ? 0.97 : 1 }}
                  disabled={!canAfford}
                  onClick={() => setConfirm(item)}
                  className={`mt-3 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${canAfford ? 'gradient-primary text-white glow-primary' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
                >
                  <Coins className="w-4 h-4" />
                  {item.price.toLocaleString()}
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Confirm purchase modal */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 250, damping: 22 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-sm"
            >
              <div className="glass-strong rounded-xl3 p-6 text-center">
                <div className="text-6xl mb-3">{confirm.icon}</div>
                <h2 className="text-xl font-display font-bold">{confirm.name}</h2>
                <p className="text-sm text-gray-400 mt-1">{confirm.description}</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-lg font-bold">
                  <Coins className="w-5 h-5 text-accent-gold" />
                  <span className="gradient-gold">{confirm.price.toLocaleString()} coins</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Balance after: {(profile.coins - confirm.price).toLocaleString()} coins</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl glass text-sm font-medium hover:bg-white/10">Cancel</button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { buyItem(confirm); setConfirm(null); }}
                    className="flex-1 py-2.5 rounded-xl gradient-primary text-sm font-semibold glow-primary flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Buy
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
