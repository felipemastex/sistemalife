
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

// Definindo um tipo mais explícito para o estado de autenticação
type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

const AuthContext = createContext<{ user: User | null; authState: AuthState; logout: () => void; }>({
  user: null,
  authState: 'loading',
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    console.log('🔐 Iniciando listener de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuário autenticado:', user.uid);
        setUser(user);
        setAuthState('authenticated');
      } else {
        console.log('❌ Usuário não autenticado.');
        setUser(null);
        setAuthState('unauthenticated');
      }
    }, (error) => {
      console.error('🚨 Erro na autenticação:', error);
      setUser(null);
      setAuthState('unauthenticated'); // Tratar erro como não autenticado
    });

    // Limpeza ao desmontar
    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, authState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
