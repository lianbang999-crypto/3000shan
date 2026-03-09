import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TabBar from './components/layout/TabBar';
import HomePage from './pages/HomePage';
import RecordPage from './pages/RecordPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import LibraryPage from './pages/LibraryPage';
import OnboardingPage from './pages/OnboardingPage';
import { seedDatabase } from './db/seed';
import { db } from './db';
import { useAppStore } from './stores/app';

function AppContent() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  if (!isOnboarded) {
    return <OnboardingPage />;
  }

  return (
    <div className="h-full max-w-lg mx-auto bg-bg relative">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setTheme = useAppStore((s) => s.setTheme);
  const setGoal = useAppStore((s) => s.setGoal);

  useEffect(() => {
    async function init() {
      await seedDatabase();
      // Load settings from DB
      const onboarded = await db.settings.get('onboarded');
      const theme = await db.settings.get('theme');
      const goal = await db.settings.get('goal');
      if (onboarded?.value) setOnboarded(true);
      if (theme?.value) setTheme(theme.value as 'light' | 'dark');
      if (goal?.value) setGoal(goal.value as number);
      setReady(true);
    }
    init();
  }, [setOnboarded, setTheme, setGoal]);

  if (!ready) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="text-3xl mb-2">善</div>
          <div className="text-text-muted text-sm">正在准备...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
