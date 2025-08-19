import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthToken, clearAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = getAuthToken();
      const user = localStorage.getItem('adminUser');
      
      if (token && user) {
        setIsAuthenticated(true);
        setAdminUser(JSON.parse(user));
      } else {
        setIsAuthenticated(false);
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (user) => {
    setIsAuthenticated(true);
    setAdminUser(user);
  };

  const logout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setAdminUser(null);
    window.location.href = '/admin/login';
  };

  const value = {
    isAuthenticated,
    adminUser,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
