import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuditorDashboard from './pages/AuditorDashboard';
import AuditeeDashboard from './pages/AuditeeDashboard';
import AuditWorkspace from './pages/AuditWorkspace';
import GenerateDocument from './pages/GenerateDocument';
import AuditTool from './pages/AuditTool';
import ProtectedRoute from './components/ProtectedRoute';
import DirectorDashboard from './pages/DirectorDashboard';
import DivisionChiefDashboard from './pages/DivisionChiefDashboard';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import IasCares from './pages/IasCares';
import Aapes from './pages/Aapes';
import MovMonitoring from './pages/MovMonitoring';
import SsoCallback from './pages/SsoCallback';
import { DataProvider } from './context/DataContext';

function AnimatedRoutes({ user, DefaultRouteComponent }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/sso-callback" element={<SsoCallback />} />

        <Route path="/director/*" element={
          <ProtectedRoute designation="director">
            <DirectorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/division-chief/*" element={
          <ProtectedRoute designation="division_chief">
            <DivisionChiefDashboard />
          </ProtectedRoute>
        } />

        <Route path="/assistant-division-chief/*" element={
          <ProtectedRoute designation="assistant_division_chief">
            <DivisionChiefDashboard />
          </ProtectedRoute>
        } />

        <Route path="/auditor" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'assistant_auditor']}>
            <AuditorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/auditor/workspace/:id" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'assistant_auditor', 'division_chief', 'director', 'auditee']}>
            <AuditWorkspace />
          </ProtectedRoute>
        } />
        <Route path="/auditor/workspace/:id/generate/:doc" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'assistant_auditor', 'division_chief', 'director']}>
            <GenerateDocument />
          </ProtectedRoute>
        } />
        {/* Interactive Audit Planning Tools — auditees get read-only access */}
        <Route path="/auditor/workspace/:id/tool/:toolKey" element={
          <ProtectedRoute designations={['lead_auditor', 'auditor', 'assistant_auditor', 'division_chief', 'assistant_division_chief', 'director', 'auditee']}>
            <AuditTool />
          </ProtectedRoute>
        } />
        
        <Route path="/ias-cares" element={
          <ProtectedRoute designations={['director', 'division_chief', 'assistant_division_chief', 'lead_auditor', 'auditor', 'assistant_auditor']}>
            <IasCares />
          </ProtectedRoute>
        } />

        <Route path="/aapes" element={
          <ProtectedRoute designations={['director', 'division_chief', 'assistant_division_chief', 'lead_auditor', 'auditor', 'assistant_auditor', 'auditee']}>
            <Aapes />
          </ProtectedRoute>
        } />

        <Route path="/mov-monitoring" element={
          <ProtectedRoute designations={['director', 'division_chief', 'assistant_division_chief', 'lead_auditor', 'auditor', 'assistant_auditor', 'auditee']}>
            <MovMonitoring />
          </ProtectedRoute>
        } />

        <Route path="/auditor/*" element={<Navigate to="/auditor" replace />} />


        <Route path="/auditee/*" element={
          <ProtectedRoute designation="auditee">
            <AuditeeDashboard />
          </ProtectedRoute>
        } />

        <Route path="/" element={<DefaultRouteComponent />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Clear stale legacy caches
  if (user && !user.designation) {
    localStorage.clear();
    window.location.href = import.meta.env.BASE_URL + 'login';
    return null;
  }

  const DefaultRouteComponent = () => {
    if (!user) return <Navigate to="/login" replace />;
    if (user.designation === 'director') return <Navigate to="/director" replace />;
    if (user.designation === 'division_chief') return <Navigate to="/division-chief" replace />;
    if (user.designation === 'assistant_division_chief') return <Navigate to="/assistant-division-chief" replace />;
    if (user.designation === 'lead_auditor' || user.designation === 'auditor' || user.designation === 'assistant_auditor') return <Navigate to="/auditor" replace />;
    return <Navigate to="/auditee" replace />;
  };

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <DataProvider>
        <AnimatedRoutes user={user} DefaultRouteComponent={DefaultRouteComponent} />
      </DataProvider>
    </BrowserRouter>
  )
}

export default App;
