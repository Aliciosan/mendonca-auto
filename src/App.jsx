import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AutoProvider, useAuto } from './context/AutoContext';
import { Toaster } from 'sonner'; // O componente de notificação

import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import ClientDashboard from './pages/ClientDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuto();
  if (!user) return <Navigate to="/" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/gerente" element={<ProtectedRoute role="gerente"><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/cliente" element={<ProtectedRoute role="cliente"><ClientDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AutoProvider>
      <Toaster position="top-right" richColors /> {/* Notificações aqui */}
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AutoProvider>
  );
}