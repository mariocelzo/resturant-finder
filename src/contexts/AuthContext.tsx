import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInAsGuest: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Inizializza l'auth al mount del provider
  useEffect(() => {
    initializeAuth();
  }, []);

  // Setup listener per cambi di stato auth
  useEffect(() => {
    console.log('🔄 Configurando auth state listener...');
    
    const { data: { subscription } } = AuthService.onAuthStateChange((authUser) => {
      console.log('🔄 Auth state changed:', authUser ? 'logged in' : 'logged out');
      setUser(authUser);
    });

    return () => {
      console.log('🔄 Pulendo auth state listener...');
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🚀 Inizializzando autenticazione...');
      setLoading(true);
      
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        console.log('✅ Utente trovato:', currentUser.isGuest ? 'Guest' : currentUser.email);
        setUser(currentUser);
      } else {
        console.log('🔓 Nessun utente autenticato');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Errore inizializzazione auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 Tentativo di login:', email);
      const result = await AuthService.signIn(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Errore login context:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('👤 Tentativo di registrazione:', email);
      const result = await AuthService.signUp(email, password);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Errore registrazione context:', error);
      return false;
    }
  };

  const signInAsGuest = async (): Promise<boolean> => {
    try {
      console.log('👻 Tentativo login guest...');
      const result = await AuthService.signInAsGuest();

      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Errore login guest context:', error);
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('🔐 Tentativo Google Sign-In...');
      const result = await AuthService.signInWithGoogle();

      if (result.success) {
        // OAuth flow initiated, user will be set via onAuthStateChange
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Errore Google Sign-In context:', error);
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('👋 Logout dal context...');
      const success = await AuthService.signOut();
      
      if (success) {
        setUser(null);
        console.log('✅ Logout completato dal context');
      } else {
        console.error('❌ Errore logout');
      }
    } catch (error) {
      console.error('❌ Errore logout context:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInAsGuest,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  console.log('🔍 Auth Context State:', {
    hasUser: !!user,
    userType: user?.isGuest ? 'guest' : user?.email ? 'registered' : 'none',
    loading
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizzato per usare il context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook per ottenere solo i dati dell'utente
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

// Hook per verificare se l'utente è autenticato
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

