import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';
import { User, UserRole, Job } from '../types';

const ACTIVE_JOB_KEY = 'reloop_active_job';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => Promise<void>;
  reloadUser: () => Promise<void>;
  activeJob: Job | null;
  acceptJob: (job: Job) => Promise<void>;
  completeJob: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const reloadUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        // Load active job from storage if user is a driver
        if (currentUser?.role === UserRole.DRIVER) {
          const storedJob = localStorage.getItem(ACTIVE_JOB_KEY);
          if (storedJob) {
            setActiveJob(JSON.parse(storedJob));
          }
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await authService.login(email, pass);
    setUser(loggedInUser);
  };

  const signup = async (email: string, pass: string, name: string, role: UserRole) => {
    const newUser = await authService.signup(email, pass, name, role);
    setUser(newUser);
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
    setActiveJob(null);
    localStorage.removeItem(ACTIVE_JOB_KEY);
  };

  const updateUser = async (updatedUser: User) => {
    const savedUser = await authService.updateUser(updatedUser);
    setUser(savedUser);
  };

  const acceptJob = async (job: Job) => {
    return new Promise<void>((resolve) => {
        const jobInProgress = { ...job, status: 'IN_PROGRESS' as 'IN_PROGRESS', driverId: user?.id };
        setActiveJob(jobInProgress);
        localStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify(jobInProgress));
        resolve();
    });
  };

  const completeJob = async () => {
     return new Promise<void>((resolve) => {
        setActiveJob(null);
        localStorage.removeItem(ACTIVE_JOB_KEY);
        resolve();
    });
  };


  const value = { user, loading, login, signup, logout, updateUser, reloadUser, activeJob, acceptJob, completeJob };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
