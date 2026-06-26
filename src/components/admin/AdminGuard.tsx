import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AlertTriangle, Clock } from 'lucide-react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // Warn 5 minutes before logout

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, logout: authLogout } = useAdminAuth();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_MS / 1000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    setShowWarning(false);
    authLogout();
  }, [authLogout]);

  const resetTimer = useCallback(() => {
    if (!state.isAuthenticated) return;
    setShowWarning(false);
    setSecondsLeft(WARNING_BEFORE_MS / 1000);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Show warning 5 minutes before logout
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsLeft(WARNING_BEFORE_MS / 1000);
      countdownRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Auto-logout at 30 min
    timeoutRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [state.isAuthenticated, logout]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [state.isAuthenticated, resetTimer]);

  if (!state.isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <>
      {children}

      {/* Session Timeout Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-orange-500/40 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Session Expiring Soon</h2>
            <p className="text-gray-400 mb-4 text-sm">
              You've been inactive. For your security, you'll be logged out in:
            </p>
            <div className="text-4xl font-mono font-bold text-orange-400 mb-6">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetTimer}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
              >
                Stay Logged In
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                <AlertTriangle size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

