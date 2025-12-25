// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import DashboardAdmin from './components/DashboardAdmin.jsx';
import DashboardUser from './components/DashboardUser.jsx';
import DashboardWorker from './components/DashboardWorker.jsx';
import PaymentPage from './pages/PaymentPage';
import { useAuth } from './context/AuthContext.jsx';

// Protected Route Component
function ProtectedRoute({ children, allowedTypes }) {
  const { user, token, loading } = useAuth();

  // Show loading while verifying token
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a, #1f2937)',
        color: '#f9fafb'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedTypes && !allowedTypes.includes(user.type)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<HomePage />} />

        {/* Protected dashboard routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedTypes={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedTypes={['user']}>
              <DashboardUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker"
          element={
            <ProtectedRoute allowedTypes={['worker']}>
              <DashboardWorker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute allowedTypes={["user"]}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
