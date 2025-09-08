'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser, getUser } from '@/lib/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'admin' | 'driver', driverId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        // Get user data from Firestore
        try {
          const userData = await getUser(firebaseUser.uid);
          if (userData) {
            setUser(userData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    if (!result.user) throw new Error('Failed to sign in');
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'driver', driverId?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (!result.user) throw new Error('Failed to create user');
    
    const userData: User = {
      id: result.user.uid,
      email,
      role,
      driverId: role === 'driver' ? driverId : undefined,
    };

    await createUser(userData);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};