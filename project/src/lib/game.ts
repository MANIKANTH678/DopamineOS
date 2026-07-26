import type { Difficulty, Rarity } from './types';

// Exponential XP progression: level n requires cumulative XP = 50 * n * (n+1) / 2 * scaling
// Level 1: 100, Level 2: 250, Level 3: 450... smooth exponential-ish growth
const BASE = 100;

export function xpForLevel(level: number): number {
  // XP required to go FROM this level TO next level
  return Math.round(BASE * Math.pow(level, 1.35));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpForLevel(l);
  return total;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; xpForNext: number; progress: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  const xpForNext = xpForLevel(level);
  return {
    level,
    intoLevel: remaining,
    xpForNext,
    progress: xpForNext > 0 ? remaining / xpForNext : 0,
  };
}

export const DIFFICULTY_REWARDS: Record<Difficulty, { xp: number; coins: number; label: string; color: string; glow: string }> = {
  easy: { xp: 20, coins: 10, label: 'Easy', color: 'text-accent-emerald', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]' },
  medium: { xp: 40, coins: 20, label: 'Medium', color: 'text-primary-400', glow: 'shadow-[0_0_20px_rgba(108,99,255,0.3)]' },
  hard: { xp: 70, coins: 35, label: 'Hard', color: 'text-accent-orange', glow: 'shadow-[0_0_20px_rgba(255,140,66,0.3)]' },
  legendary: { xp: 120, coins: 60, label: 'Legendary', color: 'text-accent-gold', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]' },
  epic: { xp: 200, coins: 100, label: 'Epic', color: 'text-accent-pink', glow: 'shadow-[0_0_20px_rgba(255,77,141,0.3)]' },
};

export const FOCUS_REWARDS = {
  pomodoro: { xpPerMin: 2, coinsPerMin: 1 },
  deep_work: { xpPerMin: 3, coinsPerMin: 1.5 },
  custom: { xpPerMin: 2, coinsPerMin: 1 },
};

export const RARITY_STYLES: Record<Rarity, { label: string; color: string; border: string; bg: string; glow: string }> = {
  common: { label: 'Common', color: 'text-gray-300', border: 'border-gray-500/30', bg: 'bg-gray-500/10', glow: '' },
  rare: { label: 'Rare', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.2)]' },
  epic: { label: 'Epic', color: 'text-accent-pink', border: 'border-pink-500/40', bg: 'bg-pink-500/10', glow: 'shadow-[0_0_16px_rgba(255,77,141,0.25)]' },
  legendary: { label: 'Legendary', color: 'text-accent-gold', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.3)]' },
  mythic: { label: 'Mythic', color: 'text-accent-cyan', border: 'border-cyan-400/50', bg: 'bg-cyan-400/10', glow: 'shadow-[0_0_24px_rgba(0,229,255,0.35)]' },
};

export const STREAK_MILESTONES = [
  { days: 7, reward: { xp: 50, coins: 50 }, label: 'Week Warrior' },
  { days: 30, reward: { xp: 200, coins: 200 }, label: 'Monthly Master' },
  { days: 100, reward: { xp: 500, coins: 500 }, label: 'Centurion' },
  { days: 365, reward: { xp: 2000, coins: 2000 }, label: 'Year of Fire' },
  { days: 1000, reward: { xp: 10000, coins: 10000 }, label: 'Thousand Suns' },
];

export const MOTIVATIONAL_QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'You don’t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'Don’t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Your limitation—it’s only your imagination.', author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
];

export function getDailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return MOTIVATIONAL_QUOTES[day % MOTIVATIONAL_QUOTES.length];
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
