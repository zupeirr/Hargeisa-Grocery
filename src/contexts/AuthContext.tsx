import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { createCustomerAPI, fetchAPI } from '../data/adminStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  state: AuthState;
  login: (phone: string, password: string) => Promise<boolean>;
  register: (name: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);



export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    const activeSession = localStorage.getItem('hargeisa_session');
    if (activeSession) {
      try {
        const user = JSON.parse(activeSession);
        return { user, isAuthenticated: true };
      } catch (e) {
        // Ignore
      }
    }
    return { user: null, isAuthenticated: false };
  });

  React.useEffect(() => {
    const users = localStorage.getItem('hargeisa_users');
    if (!users) {
      const defaultUsers = [
        {
          id: '1',
          name: 'Suber Sulub',
          phone: '+252 63 6097266',
          password: 'demo123',
          email: 'subeersulub10@gmail.com',
          addresses: [],
          loyaltyPoints: 150
        }
      ];
      localStorage.setItem('hargeisa_users', JSON.stringify(defaultUsers));
    }
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    const usersStr = localStorage.getItem('hargeisa_users') || '[]';
    const users = JSON.parse(usersStr);
    const foundUser = users.find((u: any) => u.phone === phone && u.password === password);
    
    if (foundUser) {
      const safeUser = { ...foundUser };
      delete safeUser.password;

      // Sync customer with backend database
      try {
        const backendCustomers = await fetchAPI(`/customers?search=${encodeURIComponent(phone)}`);
        const exactMatch = backendCustomers.find((c: any) => c.phone === phone);
        
        if (exactMatch) {
          safeUser.id = exactMatch.id;
        } else {
          const created = await createCustomerAPI(safeUser.name, safeUser.email, safeUser.phone);
          safeUser.id = created.id;
        }
      } catch (err) {
        console.error('Failed to sync customer with backend on login:', err);
      }

      setState({
        user: safeUser,
        isAuthenticated: true
      });
      localStorage.setItem('hargeisa_session', JSON.stringify(safeUser));
      return true;
    }
    return false;
  };

  const register = async (name: string, phone: string, password: string): Promise<boolean> => {
    const usersStr = localStorage.getItem('hargeisa_users') || '[]';
    const users = JSON.parse(usersStr);
    
    const exists = users.some((u: any) => u.phone === phone);
    if (exists) {
      throw new Error('Phone number is already registered.');
    }

    // Call backend API to create the customer in the database!
    let backendId = Date.now().toString();
    try {
      const createdCustomer = await createCustomerAPI(name, `${phone}@hargeisa.com`, phone);
      backendId = createdCustomer.id;
    } catch (err) {
      console.error('Failed to create customer on backend during registration:', err);
    }

    const newUser = {
      id: backendId,
      name,
      phone,
      password,
      email: `${phone}@hargeisa.com`,
      addresses: [],
      loyaltyPoints: 0
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('hargeisa_users', JSON.stringify(updatedUsers));

    const { password: _, ...safeUser } = newUser;
    setState({
      user: safeUser,
      isAuthenticated: true
    });
    localStorage.setItem('hargeisa_session', JSON.stringify(safeUser));
    return true;
  };

  const logout = () => {
    setState({
      user: null,
      isAuthenticated: false
    });
    localStorage.removeItem('hargeisa_session');
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