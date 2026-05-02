import { createContext, useContext, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hm_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem('hm_token', data.token);
      localStorage.setItem('hm_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const register = async (formData) => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') fd.append(k, v);
    });
    const { data } = await api.post('/auth/register', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
