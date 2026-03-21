import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuditorDashboard from './pages/AuditorDashboard';
import AuditeeDashboard from './pages/AuditeeDashboard';
import AuditWorkspace from './pages/AuditWorkspace';
import GenerateDocument from './pages/GenerateDocument';
import ProtectedRoute from './components/ProtectedRoute';
import DirectorDashboard from './pages/DirectorDashboard';
import DivisionChiefDashboard from './pages/DivisionChiefDashboard';

function App() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Clear stale legacy caches
  if (user && !user.designation) {
    localStorage.clear();
    window.location.href = import.meta.env.BASE_URL + 'login';
    return null;
  }

  const DefaultRoute = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.designation === 'director') return <Navigate to="/director" replace />;
    if (user.designation === 'division_chief' || user.designation === 'assistant_division_chief') return <Navigate to="/chief" replace />;
    if (user.designation === 'lead_auditor' || user.designation === 'auditor') return <Navigate to="/auditor" replace />;
    return <Navigate to="/auditee" replace />;
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/director/*" element={
          <ProtectedRoute designation="director">
            <DirectorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/chief/*" element={
          <ProtectedRoute designations={['division_chief', 'assistant_division_chief']}>
            <DivisionChiefDashboard />
          </ProtectedRoute>
        } />

        <Route path="/auditor" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor']}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/auditor/workspace/:id" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'division_chief']}>
            <AuditWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/auditor/workspace/:id/generate/:doc" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'division_chief']}>
            <GenerateDocument />
          </ProtectedRoute>
        } />
        <Route path="/auditor/*" element={<Navigate to="/auditor" replace />} />

        <Route path="/auditee/*" element={
          <ProtectedRoute designation="auditee">
            <AuditeeDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={<DefaultRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
