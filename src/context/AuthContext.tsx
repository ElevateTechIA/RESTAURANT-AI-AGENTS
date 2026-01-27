'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signIn as firebaseSignIn,
  signUp as firebaseSignUp,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  resetPassword as firebaseResetPassword,
  getUserData,
  onAuthStateChange,
  updateUserData,
} from '@/lib/firebase/auth';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role?: UserRole
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userData = await getUserData(fbUser.uid);
          setUser(userData);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const userData = await firebaseSignIn(email, password);
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole = 'customer'
    ) => {
      setError(null);
      setLoading(true);
      try {
        const userData = await firebaseSignUp(email, password, displayName, role);
        setUser(userData);
      } catch (err: any) {
        setError(err.message || 'Failed to sign up');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const userData = await firebaseSignInWithGoogle();
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await firebaseResetPassword(email);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      throw err;
    }
  }, []);

  const updateUser = useCallback(
    async (data: Partial<User>) => {
      if (!user) throw new Error('No user logged in');

      setError(null);
      try {
        await updateUserData(user.id, data);
        setUser((prev) => (prev ? { ...prev, ...data } : null));
      } catch (err: any) {
        setError(err.message || 'Failed to update user');
        throw err;
      }
    },
    [user]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
