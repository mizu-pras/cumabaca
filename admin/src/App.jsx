import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import ProtectedRoute from './components/Admin/ProtectedRoute';
import AdminLayout from './pages/Admin/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Languages from './pages/Languages';
import LanguageForm from './pages/Languages/components/LanguageForm';
import Websites from './pages/Websites';
import WebsiteForm from './pages/Websites/components/WebsiteForm';
import Komiks from './pages/Komiks';
import KomikForm from './pages/Komiks/components/KomikForm';
import KomikDetail from './pages/Komiks/components/KomikDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes with AdminLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Languages routes */}
          <Route path="languages" element={<Languages />} />
          <Route path="languages/new" element={<LanguageForm />} />
          <Route path="languages/:id/edit" element={<LanguageForm />} />

          {/* Websites routes */}
          <Route path="websites" element={<Websites />} />
          <Route path="websites/new" element={<WebsiteForm />} />
          <Route path="websites/:id/edit" element={<WebsiteForm />} />

          {/* Komiks routes */}
          <Route path="komiks" element={<Komiks />} />
          <Route path="komiks/:id" element={<KomikDetail />} />
          <Route path="komiks/new" element={<KomikForm />} />
          <Route path="komiks/:id/edit" element={<KomikForm />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
