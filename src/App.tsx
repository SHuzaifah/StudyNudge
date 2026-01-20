import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/Layout';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onSuccess={() => { }} />;
  }

  return (
    <Router>
      <Layout session={session}>
        <Routes>
          <Route path="/" element={<Dashboard session={session} />} />
          <Route path="/profile" element={<ProfilePage session={session} />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tasks" element={<TasksPage session={session} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
