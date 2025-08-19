import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Breadcrumb } from './components/Breadcrumb';
import { Sitemap } from './components/Sitemap';
import { QuoteModal } from './components/QuoteModal';
import FloatingSocial from './components/FloatingSocial';
import ScrollToTop from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { HirePage } from './pages/HirePage';
import { ServicesPage } from './pages/ServicesPage';
import { PackagesPage } from './pages/PackagesPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminSignup } from './pages/admin/AdminSignup';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuoteManagement } from './pages/admin/QuoteManagement';
import { CustomerManagement } from './pages/admin/CustomerManagement';
import { PackagesManagement } from './pages/admin/packagesManagement';
import EquipmentManagement from './pages/admin/EquipmentManagement';
import { MessageManagement } from './pages/admin/MessageManagement';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const location = useLocation();

  const openQuoteModal = (data = null) => {
    setQuoteData(data);
    setIsQuoteModalOpen(true);
  };
  
  const closeQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setQuoteData(null);
  };

  // Global keyboard shortcut for admin access
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl + Shift + A for admin access
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        window.location.href = '/admin/login';
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Check if current path is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen">
      <Header onQuoteClick={openQuoteModal} />
      <ScrollToTop />
      
      {/* Breadcrumb for non-admin pages */}
      {!isAdminRoute && <Breadcrumb />}
      
      {/* Add padding to account for fixed header */}
      <main className={isAdminRoute ? '' : 'pt-0'}>
        <Routes future={{ v7_relativeSplatPath: true }}>
          <Route path="/" element={<HomePage onQuoteClick={openQuoteModal} />} />
          <Route path="/hire" element={<HirePage onQuoteClick={openQuoteModal} />} />
          <Route path="/services" element={<ServicesPage onQuoteClick={openQuoteModal} />} />
          <Route path="/packages" element={<PackagesPage onQuoteClick={openQuoteModal} />} />
          <Route path="/about" element={<AboutPage onQuoteClick={openQuoteModal} />} />
          <Route path="/contact" element={<ContactPage onQuoteClick={openQuoteModal} />} />
          <Route path="/sitemap" element={<Sitemap />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes future={{ v7_relativeSplatPath: true }}>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/quotes" element={<QuoteManagement />} />
                  <Route path="/customers" element={<CustomerManagement />} />
                  <Route path="/packages" element={<PackagesManagement />} />
                  <Route path="/messages" element={<MessageManagement />} />
                  <Route path="/equipment" element={<EquipmentManagement />} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />
          
          {/* Handle preview_page.html redirect */}
          <Route path="/preview_page.html" element={<Navigate to="/" replace />} />
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer for non-admin pages */}
      {!isAdminRoute && <Footer />}
      
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={closeQuoteModal} 
        preSelectedItem={quoteData?.preSelectedItem}
      />
      {/* Floating Social Icons for non-admin pages */}
      {!isAdminRoute && <FloatingSocial />}
    </div>
  );
}

export default function App() {
  // Determine the basename for the router
  const basename = window.location.pathname.includes('preview_page.html') 
    ? window.location.pathname.replace('/preview_page.html', '') 
    : '';

  return (
    <AuthProvider>
      <Router basename={basename}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </Router>
    </AuthProvider>
  );
}
