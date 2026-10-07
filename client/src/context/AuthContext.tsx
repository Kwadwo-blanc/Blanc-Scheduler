import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  setActiveWorkspace: (ws: Workspace) => void;
  switchPersona: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const token = api.getToken();
      if (token) {
        const { user: me } = await api.getMe();
        setUser(me);
        const wsRes = await api.getWorkspaces();
        setWorkspaces(wsRes.workspaces);
        if (wsRes.workspaces.length > 0) {
          setActiveWorkspace(wsRes.workspaces[0]);
        }
      } else {
        // Auto-login default demo student persona
        await switchPersona('alex.student@continuum.dev');
      }
    } catch (err) {
      console.warn('Auth initialization fallback:', err);
      // Fallback to demo persona
      await switchPersona('alex.student@continuum.dev').catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      const wsRes = await api.getWorkspaces();
      setWorkspaces(wsRes.workspaces);
      if (wsRes.workspaces.length > 0) {
        setActiveWorkspace(wsRes.workspaces[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.login(email, 'Password123!');
      setUser(res.user);
      const wsRes = await api.getWorkspaces();
      setWorkspaces(wsRes.workspaces);
      if (wsRes.workspaces.length > 0) {
        setActiveWorkspace(wsRes.workspaces[0]);
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    setActiveWorkspace(null);
    setWorkspaces([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeWorkspace,
        workspaces,
        loading,
        login,
        logout,
        setActiveWorkspace,
        switchPersona
      }}
    >
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
