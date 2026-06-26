import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AdminUser } from '../types';
import { loginAdmin } from '../data/adminStore';

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
}

interface AdminAuthContextType {
  state: AdminAuthState;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    // Check local storage on mount
    const savedAdmin = localStorage.getItem('admin_user');
    if (savedAdmin) {
      setState({
        user: JSON.parse(savedAdmin),
        isAuthenticated: true
      });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginAdmin(email, password);
      if (response && response.user) {
        const adminUser: AdminUser = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          token: response.token
        };
        
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
        
        setState({
          user: adminUser,
          isAuthenticated: true
        });
        return true;
      }
    } catch (err) {
      console.error('Login error:', err);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('admin_user');
    setState({
      user: null,
      isAuthenticated: false
    });
  };

  return (
    <AdminAuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
