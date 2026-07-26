import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { Zap, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const init = useStore(s => s.init);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username } },
        });
        if (error) throw error;
        // auto sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      await init();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-primary-500/20 blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-0 top-0 w-96 h-96 rounded-full bg-accent-cyan/15 blur-3xl"
          animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary glow-primary mb-4"
          >
            <Zap className="w-8 h-8 text-white" fill="white" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold gradient-text">DopamineOS</h1>
          <p className="text-gray-400 mt-2">Get addicted to productivity</p>
        </div>

        <div className="glass-strong rounded-xl3 p-8">
          {/* tabs */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`relative flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${mode === m ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="authTab"
                    className="absolute inset-0 gradient-primary rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10">{m === 'signin' ? 'Sign In' : 'Sign Up'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <InputField icon={<User className="w-4 h-4" />} placeholder="Username" value={username} onChange={setUsername} />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField icon={<Mail className="w-4 h-4" />} placeholder="Email" type="email" value={email} onChange={setEmail} required />
            <InputField icon={<Lock className="w-4 h-4" />} placeholder="Password" type="password" value={password} onChange={setPassword} required />

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full gradient-primary text-white font-semibold py-3 rounded-xl glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Sparkles className="w-5 h-5 animate-pulse" /> : <ArrowRight className="w-5 h-5" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-primary-400 hover:text-primary-300 font-semibold"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          By continuing you agree to stay productive and crush your goals.
        </p>
      </motion.div>
    </div>
  );
}

function InputField({ icon, placeholder, type = 'text', value, onChange, required }: {
  icon: React.ReactNode; placeholder: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
      />
    </div>
  );
}
