import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();

const AUTH_TOKEN_KEY = 'authToken';
const USER_DATA_KEY = 'userData';
const LEGACY_AUTH_KEYS = ['user', 'userId', 'userEmail', 'userName'];

const buildStoredUser = (userData) => {
  if (!userData) return null;

  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    status: userData.status,
    phone: userData.phone,
    gender: userData.gender,
    address: userData.address,
  };
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

const saveStoredAuth = (authToken, userData) => {
  const storedUser = buildStoredUser(userData);

  localStorage.setItem(AUTH_TOKEN_KEY, authToken);
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(storedUser));

  if (storedUser?.id) localStorage.setItem('userId', storedUser.id);
  if (storedUser?.email) localStorage.setItem('userEmail', storedUser.email);
  if (storedUser?.name) localStorage.setItem('userName', storedUser.name);
};

const readStoredAuth = () => {
  const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_DATA_KEY);

  if (!savedToken || !savedUser) {
    return { token: null, user: null };
  }

  try {
    return {
      token: savedToken,
      user: JSON.parse(savedUser),
    };
  } catch (error) {
    console.error('Error parsing saved user:', error);
    clearStoredAuth();
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => readStoredAuth());
  const { user, token } = auth;
  const loading = false;

  useEffect(() => {
    const handleStorage = (event) => {
      if (![AUTH_TOKEN_KEY, USER_DATA_KEY].includes(event.key)) return;
      setAuth(readStoredAuth());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback((authToken, userData) => {
    if (!authToken || !userData?.id) {
      clearStoredAuth();
      setAuth({ token: null, user: null });
      return;
    }

    setAuth({ token: authToken, user: userData });
    saveStoredAuth(authToken, userData);
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
    clearStoredAuth();
  }, []);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const isAuthenticated = useCallback(() => !!token && !!user, [token, user]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    isAuthenticated,
  }), [user, token, loading, login, logout, hasRole, isAuthenticated]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
