
"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { app } from '@/lib/firebase';

const auth = getAuth(app);

const AuthContext = createContext<{ user: User | null; loading: boolean; logout: () => void; }>({
  user: null,
  loading: true,
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Iniciando listener de autenticação...');
    
    // Timeout de segurança para evitar travamento indefinido
    const authTimeout = setTimeout(() => {
      console.log('⚠️ Timeout de autenticação atingido, forçando parada do loading...');
      setLoading(false);
    }, 10000); // 10 segundos

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Estado de auth mudou:', user ? 'Usuário logado' : 'Usuário não logado');
      clearTimeout(authTimeout);
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('🚨 Erro na autenticação:', error);
      clearTimeout(authTimeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
