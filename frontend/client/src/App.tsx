import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { QuestionsPage } from './pages/QuestionsPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { AskQuestionPage } from './pages/AskQuestionPage';
import { TagsPage } from './pages/TagsPage';
import { AIChatPage } from './pages/AIChatPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/questions/:id" element={<QuestionDetailPage />} />
          <Route path="/ask" element={<AskQuestionPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
