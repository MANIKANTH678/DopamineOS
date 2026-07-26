import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import AuthScreen from '@/components/AuthScreen';
import AppShell from '@/components/AppShell';
import Celebrations from '@/components/Celebrations';

export default function App() {
  const session = useStore(s => s.session);
  const loading = useStore(s => s.loading);
  const init = useStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Loading DopamineOS...</p>
        </div>
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return (
    <>
      <AppShell />
      <Celebrations />
    </>
  );
}
