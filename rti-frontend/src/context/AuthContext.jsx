import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refreshProfile = async () => {
    try {
      const { data } = await api.get('/auth/profile');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const loginWithToken = (token) => {
    localStorage.setItem('rti_token', token);
    refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem('rti_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, initializing, refreshProfile, loginWithToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}