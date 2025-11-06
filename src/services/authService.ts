import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  isGuest: boolean;
  created_at?: string;
}

export class AuthService {
  
  /**
   * Registra un nuovo utente con email e password
   */
  static async signUp(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('👤 Registrando nuovo utente:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ Errore registrazione:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Utente registrato con successo');
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          isGuest: false,
          created_at: data.user.created_at,
        };
        return { success: true, user };
      }

      return { success: false, error: 'Registrazione fallita' };
    } catch (error) {
      console.error('❌ Errore nel servizio auth:', error);
      return { success: false, error: 'Errore di rete' };
    }
  }

  /**
   * Login con email e password
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔑 Login utente:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ Errore login:', error.message);
        let errorMessage = 'Credenziali non valide';
        
        if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Email non confermata. Controlla la tua casella email.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o password non corretti';
        }
        
        return { success: false, error: errorMessage };
      }

      if (data.user) {
        console.log('✅ Login effettuato con successo');
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          isGuest: false,
        };
        return { success: true, user };
      }

      return { success: false, error: 'Login fallito' };
    } catch (error) {
      console.error('❌ Errore nel servizio auth:', error);
      return { success: false, error: 'Errore di rete' };
    }
  }

  /**
   * Login come ospite (per testing rapido)
   */
  static async signInAsGuest(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('👻 Login come ospite...');
      
      // Genera un ID guest univoco
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const guestEmail = `${guestId}@guest.local`;
      
      // Salva i dati del guest in AsyncStorage
      const guestUser: User = {
        id: guestId,
        email: guestEmail,
        isGuest: true,
        created_at: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('guest_user', JSON.stringify(guestUser));
      console.log('✅ Login guest completato:', guestId);
      
      return { success: true, user: guestUser };
    } catch (error) {
      console.error('❌ Errore login guest:', error);
      return { success: false, error: 'Errore nella creazione dell\'account ospite' };
    }
  }

  /**
   * Logout
   */
  static async signOut(): Promise<boolean> {
    try {
      console.log('👋 Logout...');
      
      // Se è un utente guest, rimuovi da AsyncStorage
      const guestUser = await AsyncStorage.getItem('guest_user');
      if (guestUser) {
        await AsyncStorage.removeItem('guest_user');
        console.log('✅ Guest user rimosso');
        return true;
      }
      
      // Altrimenti logout da Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Errore logout:', error);
        return false;
      }
      
      console.log('✅ Logout completato');
      return true;
    } catch (error) {
      console.error('❌ Errore nel logout:', error);
      return false;
    }
  }

  /**
   * Ottiene l'utente corrente
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Prima controlla se c'è un guest user
      const guestUserData = await AsyncStorage.getItem('guest_user');
      if (guestUserData) {
        const guestUser = JSON.parse(guestUserData) as User;
        console.log('👻 Utente guest trovato:', guestUser.id);
        return guestUser;
      }
      
      // Altrimenti controlla Supabase
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('❌ Errore get user:', error);
        return null;
      }
      
      if (user) {
        const currentUser: User = {
          id: user.id,
          email: user.email || '',
          isGuest: false,
        };
        console.log('👤 Utente autenticato:', currentUser.email);
        return currentUser;
      }
      
      console.log('🔓 Nessun utente autenticato');
      return null;
    } catch (error) {
      console.error('❌ Errore nel get current user:', error);
      return null;
    }
  }

  /**
   * Verifica se l'utente è autenticato
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Reset password per:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'your-app://reset-password' // Cambia con il tuo deep link
        }
      );

      if (error) {
        console.error('❌ Errore reset password:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Email di reset inviata');
      return { success: true };
    } catch (error) {
      console.error('❌ Errore nel reset password:', error);
      return { success: false, error: 'Errore di rete' };
    }
  }

  /**
   * Cambia password (utente autenticato)
   */
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Aggiornando password...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Errore aggiornamento password:', error.message);
        return { success: false, error: error.message };
      }

      console.log('✅ Password aggiornata');
      return { success: true };
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento password:', error);
      return { success: false, error: 'Errore di rete' };
    }
  }

  /**
   * Sign in with Google (OAuth) - Mobile Native Flow
   */
  static async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔐 Google Sign-In...');

      // Import dinamico per evitare problemi con web
      const { openAuthSessionAsync, dismissBrowser } = await import('expo-web-browser');

      // URL di redirect che punta al callback di Supabase
      const redirectUrl = 'https://mrtfjejvllqawhkyhfcm.supabase.co/auth/v1/callback';

      console.log('📱 Usando redirect URL:', redirectUrl);

      // Inizia il flusso OAuth con Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Errore Google Sign-In:', error.message);
        return { success: false, error: error.message };
      }

      if (!data?.url) {
        console.error('❌ Nessun URL OAuth ricevuto');
        return { success: false, error: 'URL OAuth non disponibile' };
      }

      console.log('🌐 Aprendo browser per OAuth...');
      console.log('🔗 URL OAuth:', data.url);

      // Apri il browser per l'autenticazione
      const result = await openAuthSessionAsync(data.url, redirectUrl);

      console.log('📱 Risultato OAuth tipo:', result.type);
      console.log('📱 Risultato completo:', JSON.stringify(result));

      if (result.type === 'success' && 'url' in result) {
        console.log('✅ OAuth completato, parsing URL...');
        console.log('🔗 URL ricevuto:', result.url);

        // Chiudi il browser
        await dismissBrowser();

        // Estrai i parametri dall'URL (possono essere in hash o query string)
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        try {
          const urlString = result.url;

          // Prova con hash fragment (#access_token=...)
          if (urlString.includes('#')) {
            const hashPart = urlString.split('#')[1];
            const hashParams = new URLSearchParams(hashPart);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
          }

          // Se non trovati, prova con query string (?access_token=...)
          if (!accessToken) {
            const url = new URL(urlString);
            accessToken = url.searchParams.get('access_token');
            refreshToken = url.searchParams.get('refresh_token');
          }

          console.log('🔑 Access token trovato:', !!accessToken);
          console.log('🔑 Refresh token trovato:', !!refreshToken);

          if (accessToken && refreshToken) {
            // Imposta la sessione con i token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('❌ Errore setSession:', sessionError.message);
              return { success: false, error: sessionError.message };
            }

            if (sessionData.user) {
              console.log('✅ Google Sign-In completato con successo!');
              const user: User = {
                id: sessionData.user.id,
                email: sessionData.user.email || '',
                isGuest: false,
              };
              return { success: true, user };
            }
          } else {
            console.error('❌ Token non trovati nell\'URL');
            console.log('💡 Provo a recuperare la sessione...');

            // Tentativo di recupero sessione come fallback
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
              console.log('✅ Sessione recuperata come fallback!');
              const user: User = {
                id: session.user.id,
                email: session.user.email || '',
                isGuest: false,
              };
              return { success: true, user };
            }
          }
        } catch (parseError) {
          console.error('❌ Errore parsing URL:', parseError);
        }

        return { success: false, error: 'Token non trovati nella risposta' };
      }

      if (result.type === 'cancel') {
        console.log('⚠️ Utente ha annullato il login');
        return { success: false, error: 'Login annullato' };
      }

      console.error('❌ OAuth flow non completato, tipo:', result.type);
      return { success: false, error: 'Autenticazione non completata' };
    } catch (error) {
      console.error('❌ Errore nel Google Sign-In:', error);
      return { success: false, error: 'Errore durante l\'autenticazione' };
    }
  }

  /**
   * Converti guest user in utente registrato
   */
  static async convertGuestToUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      console.log('🔄 Convertendo guest user in utente registrato...');
      
      // Prima registra il nuovo utente
      const signUpResult = await this.signUp(email, password);
      
      if (signUpResult.success && signUpResult.user) {
        // Rimuovi il guest user
        await AsyncStorage.removeItem('guest_user');
        console.log('✅ Guest user convertito con successo');
        return signUpResult;
      }
      
      return signUpResult;
    } catch (error) {
      console.error('❌ Errore nella conversione guest user:', error);
      return { success: false, error: 'Errore nella conversione account' };
    }
  }

  /**
   * Listener per cambi di stato auth
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // Controlla se c'è ancora un guest user
        const guestUser = await this.getCurrentUser();
        callback(guestUser);
      } else if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          isGuest: false,
        };
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}