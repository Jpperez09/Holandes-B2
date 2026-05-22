import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
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
