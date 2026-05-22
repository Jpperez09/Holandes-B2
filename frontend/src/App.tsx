import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { endpoints } from './api/endpoints';
import { useApi } from './hooks/useApi';
import { Loading, ErrorState } from './components/ui';
import { Sidebar } from './components/Sidebar';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Today } from './screens/Today';
import { Learn } from './screens/Learn';
import { ModuleDetail } from './screens/ModuleDetail';
import { Review } from './screens/Review';
import { Progress } from './screens/Progress';
import { Library } from './screens/Library';
import { Resources } from './screens/Resources';
import { Settings } from './screens/Settings';
import { NotFound } from './screens/NotFound';

export default function App(): React.JSX.Element {
  // Settings load first: if no vault is configured yet, run the first-run wizard.
  const { data: settings, loading, error, reload } = useApi(
    () => endpoints.getSettings(),
    [],
  );

  if (loading) {
    return (
      <div className="onboarding">
        <div className="onboarding__card">
          <Loading label="Starting up…" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="onboarding">
        <div className="onboarding__card">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </div>
    );
  }

  if (!settings || !settings['vault_path']) {
    return <Onboarding onComplete={reload} />;
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<Today />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:slug" element={<ModuleDetail />} />
          <Route path="/review" element={<Review />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/library" element={<Library />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
