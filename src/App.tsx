import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintsList from './pages/admin/ComplaintsList';
import ComplaintDetail from './pages/admin/ComplaintDetail';
import UserManagement from './pages/admin/UserManagement';
import Reports from './pages/admin/Reports';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import ResidentDashboard from './pages/resident/ResidentDashboard';
import NewComplaint from './pages/resident/NewComplaint';
import MyComplaints from './pages/resident/MyComplaints';

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-navy-800 mb-2">Access Denied</h2>
        <p className="text-slate-600 text-sm">You do not have permission to access this page.</p>
      </div>
    </div>
  );
}

function RoleRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace />;
  switch (profile.role) {
    case 'admin': return <Navigate to="/admin" replace />;
    case 'maintenance': return <Navigate to="/maintenance" replace />;
    case 'resident': return <Navigate to="/resident" replace />;
    default: return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root redirect */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/complaints" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><ComplaintsList /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/complaints/:id" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><ComplaintDetail /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><UserManagement /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout><Reports /></Layout>
        </ProtectedRoute>
      } />

      {/* Maintenance routes */}
      <Route path="/maintenance" element={
        <ProtectedRoute allowedRoles={['maintenance']}>
          <Layout><MaintenanceDashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* Resident routes */}
      <Route path="/resident" element={
        <ProtectedRoute allowedRoles={['resident']}>
          <Layout><ResidentDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/resident/new" element={
        <ProtectedRoute allowedRoles={['resident']}>
          <Layout><NewComplaint /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/resident/complaints" element={
        <ProtectedRoute allowedRoles={['resident']}>
          <Layout><MyComplaints /></Layout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
