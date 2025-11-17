import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Add debug logging
  console.log('🔐 AuthContext - Token exists:', !!token);
  console.log('🔐 AuthContext - Token value:', token);
  console.log('🔐 AuthContext - User:', user);
  console.log('🔐 AuthContext - Loading:', loading);

  // Set axios default headers
  useEffect(() => {
    console.log('🔐 Setting axios headers with token:', !!token);
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Authorization header set');
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('🔐 Authorization header removed');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt for:', email);
      const response = await axios.post('http://localhost:5000/api/auth/login', { 
        email, 
        password 
      });
      
      console.log('🔐 Login response:', response.data);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('🔐 Login successful, user set:', userData);
      return { success: true };
    } catch (error) {
      console.error('🔐 Login error:', error);
      console.error('🔐 Login error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔐 Registration attempt for:', userData.email);
      const response = await axios.post('http://localhost:5000/api/auth/register', userData);
      
      console.log('🔐 Registration response:', response.data);
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      console.log('🔐 Registration successful, user set:', newUser);
      return { success: true };
    } catch (error) {
      console.error('🔐 Registration error:', error);
      console.error('🔐 Registration error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    console.log('🔐 Logging out user');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    console.log('🔐 Logout complete');
  };

  const fetchUser = async () => {
    console.log('🔐 fetchUser called, token exists:', !!token);
    if (token) {
      try {
        console.log('🔐 Making API call to /api/auth/me');
        const response = await axios.get('http://localhost:5000/api/auth/me');
        console.log('🔐 User data received:', response.data);
        setUser(response.data.user);
        console.log('🔐 User state updated');
      } catch (error) {
        console.error('🔐 Error fetching user:', error);
        console.error('🔐 Error details:', error.response?.data);
        console.error('🔐 Error status:', error.response?.status);
        localStorage.removeItem('token');
        setToken(null);
        console.log('🔐 Token cleared due to error');
      }
    } else {
      console.log('🔐 No token, skipping user fetch');
    }
    setLoading(false);
    console.log('🔐 Loading set to false');
  };

  useEffect(() => {
    console.log('🔐 AuthContext useEffect running');
    console.log('🔐 Current token:', token);
    fetchUser();
  }, [token]);

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  console.log('🔐 AuthContext rendering, loading:', loading);
  console.log('🔐 AuthContext user:', user);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};