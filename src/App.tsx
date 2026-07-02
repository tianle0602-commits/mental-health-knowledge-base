import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import KnowledgePage from '@/pages/KnowledgePage';
import ArticlePage from '@/pages/ArticlePage';
import SearchPage from '@/pages/SearchPage';
import DiaryPage from '@/pages/DiaryPage';

export default function App() {
  return (
    <BrowserRouter basename="/mental-health-knowledge-base">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="knowledge/:category" element={<KnowledgePage />} />
          <Route path="article/:id" element={<ArticlePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="diary" element={<DiaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}