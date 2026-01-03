import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock user for demo purposes
const mockUser: User = {
  id: '1',
  name: 'Suber Sulub',
  email: 'subeersulub10@gmail.com',
  phone: '+252 63 6097266',
  addresses: [
    {
      id: '1',
      label: 'Home',
      street: 'Jidka Xoriyada, Building 123',
      district: 'Maroodi Jeex',
      city: 'Hargeisa',
      isDefault: true
    }
  ],
  loyaltyPoints: 150
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - in real app, this would call an API
    if (email === 'demo@hargeisa.com' && password === 'demo123') {
      setState({
        user: mockUser,
        isAuthenticated: true
      });
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    // Mock registration - in real app, this would call an API
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      addresses: [],
      loyaltyPoints: 0
    };
    
    setState({
      user: newUser,
      isAuthenticated: true
    });
    return true;
  };

  const logout = () => {
    setState({
      user: null,
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};