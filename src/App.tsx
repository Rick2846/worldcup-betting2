import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminPage } from './pages/AdminPage'
import { ChampionPredictionPage } from './pages/ChampionPredictionPage'
import { ChampionPredictionsListPage } from './pages/ChampionPredictionsListPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { MatchPredictionPage } from './pages/MatchPredictionPage'
import { MatchPredictionsListPage } from './pages/MatchPredictionsListPage'
import { ProfilePage } from './pages/ProfilePage'
import { RankingPage } from './pages/RankingPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/champion" element={<ChampionPredictionPage />} />
          <Route path="/champion/list" element={<ChampionPredictionsListPage />} />
          <Route path="/matches" element={<MatchPredictionPage />} />
          <Route path="/matches/list" element={<MatchPredictionsListPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
