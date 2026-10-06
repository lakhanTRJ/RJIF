import { Navigate, Route, Routes } from 'react-router-dom';
import PublicPage from './pages/PublicPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
      <Route path="/admin/*" element={<AdminPanel />} />
      <Route path="/404" element={<PublicPage forced404 />} />
      <Route path="*" element={<PublicPage />} />
    </Routes>
  );
}
