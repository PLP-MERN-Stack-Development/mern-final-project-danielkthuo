import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Axios instance
  const api = useMemo(() => {
    const instance = axios.create({ withCredentials: true });
    if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return instance;
  }, [token]);

  // LOGIN
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  // REGISTER
  const register = async (userData) => {
    try {
      const { data } = await api.post('/api/auth/register', userData);
      const { token: newToken, user: newUser } = data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  // FETCH CURRENT USER
  const fetchUser = async () => {
    if (!token) return setLoading(false);
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = { user, login, register, logout, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
