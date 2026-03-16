import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { AuthPage } from './pages/AuthPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Contact } from './pages/Contact';
import { Services } from './pages/Services';
import { Products } from './pages/Products';
import { About } from './pages/About';

const ProtectedRoute = ({ children, adminOnly = false, employeeOnly = false }: { children: React.ReactNode, adminOnly?: boolean, employeeOnly?: boolean }) => {
  const { user, loading, isAdmin, isEmployee } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  // Role-based redirection
  if (isAdmin && employeeOnly) return <Navigate to="/admin" />;
  if (isEmployee && adminOnly) return <Navigate to="/dashboard" />;

  // Access control
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  if (employeeOnly && !isEmployee && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-black selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              
              {/* Dashboards */}
              <Route path="/dashboard" element={
                <ProtectedRoute employeeOnly>
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/*" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Public site routes */}
              <Route path="/products" element={<Products />} />
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
