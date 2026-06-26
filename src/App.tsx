import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Storefront from './components/Storefront';
import AdminApp from './components/admin/AdminApp';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/*" element={<Storefront />} />
              <Route path="/admin/*" element={<AdminApp />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

export default App;