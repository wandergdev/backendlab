import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LangProvider } from './i18n/lang';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Modules } from './pages/Modules';
import { ModulePage } from './pages/ModulePage';
import { LessonPage } from './pages/LessonPage';
import { Review } from './pages/Review';
import { LabDetail, Labs } from './pages/Labs';
import { Glossary } from './pages/Glossary';
import { Roadmap } from './pages/Roadmap';

// HashRouter (#/ruta) permite publicar la web en cualquier hosting estático sin configurar el servidor.
export default function App() {
  return (
    <LangProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/modules" element={<Modules />} />
            <Route path="/m/:id" element={<ModulePage />} />
            <Route path="/m/:id/lesson" element={<LessonPage />} />
            <Route path="/m/:id/practice" element={<ModulePage tab="practice" />} />
            <Route path="/m/:id/labs" element={<ModulePage tab="labs" />} />
            <Route path="/m/:id/cards" element={<ModulePage tab="cards" />} />
            <Route path="/review" element={<Review />} />
            <Route path="/labs" element={<Labs />} />
            <Route path="/labs/:labId" element={<LabDetail />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </LangProvider>
  );
}
