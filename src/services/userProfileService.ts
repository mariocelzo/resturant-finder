import { supabase } from './supabase';
import { AuthService } from './authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  type: 'home' | 'work' | 'favorite' | 'custom';
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  
  // Preferenze
  preferred_location?: UserLocation;
  default_search_radius: number;
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  location_sharing: boolean;
  
  // Statistiche
  total_favorites: number;
  total_reviews: number;
  member_since: string;
  last_active: string;
  
  // Metadata
  is_guest: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecentLocation {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export class UserProfileService {
  
  /**
   * Ottiene il profilo utente completo
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      console.log('👤 Caricando profilo utente...');
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        console.log('🔓 Utente non autenticato');
        return null;
      }

      // Se è guest user, crea profilo da AsyncStorage
      if (currentUser.isGuest) {
        return await this.getGuestProfile(currentUser);
      }

      // Altrimenti carica da Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          preferred_location:user_locations!preferred_location_id(*)
        `)
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Errore caricamento profilo:', error);
        return null;
      }

      if (!data) {
        // Crea profilo di default se non esiste
        console.log('➕ Creando profilo di default...');
        return await this.createDefaultProfile(currentUser);
      }

      console.log('✅ Profilo caricato');
      return this.mapDatabaseToProfile(data);
    } catch (error) {
      console.error('❌ Errore nel servizio profilo:', error);
      return null;
    }
  }

  /**
   * Aggiorna il profilo utente
   */
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      console.log('💫 Aggiornando profilo utente...');
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return false;

      // Se è guest user, salva in AsyncStorage
      if (currentUser.isGuest) {
        return await this.updateGuestProfile(currentUser.id, updates);
      }

      // Altrimenti aggiorna Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: updates.display_name,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
          bio: updates.bio,
          default_search_radius: updates.default_search_radius,
          theme: updates.theme,
          notifications_enabled: updates.notifications_enabled,
          location_sharing: updates.location_sharing,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Errore aggiornamento profilo:', error);
        return false;
      }

      console.log('✅ Profilo aggiornato');
      return true;
    } catch (error) {
      console.error('❌ Errore nel servizio profilo:', error);
      return false;
    }
  }

  /**
   * Gestisce le posizioni salvate dell'utente
   */
  static async getUserLocations(): Promise<UserLocation[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return [];

      // Se è guest user, carica da AsyncStorage
      if (currentUser.isGuest) {
        return await this.getGuestLocations(currentUser.id);
      }

      // Altrimenti carica da Supabase
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Errore caricamento posizioni:', error);
        return [];
      }

      return (data || []).map(this.mapDatabaseToLocation);
    } catch (error) {
      console.error('❌ Errore nel servizio posizioni:', error);
      return [];
    }
  }

  /**
   * Aggiunge una nuova posizione salvata
   */
  static async addUserLocation(location: Omit<UserLocation, 'id' | 'created_at'>): Promise<boolean> {
    try {
      console.log('📍 Aggiungendo posizione:', location.name);
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return false;

      // Se è guest user, salva in AsyncStorage
      if (currentUser.isGuest) {
        return await this.addGuestLocation(currentUser.id, location);
      }

      // Se è default, rimuovi default dalle altre
      if (location.isDefault) {
        await supabase
          .from('user_locations')
          .update({ is_default: false })
          .eq('user_id', currentUser.id);
      }

      // Aggiungi nuova posizione
      const { error } = await supabase
        .from('user_locations')
        .insert([{
          user_id: currentUser.id,
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          is_default: location.isDefault,
          location_type: location.type,
        }]);

      if (error) {
        console.error('❌ Errore aggiunta posizione:', error);
        return false;
      }

      console.log('✅ Posizione aggiunta');
      return true;
    } catch (error) {
      console.error('❌ Errore nel servizio posizioni:', error);
      return false;
    }
  }

  /**
   * Imposta una posizione come default
   */
  static async setDefaultLocation(locationId: string): Promise<boolean> {
    try {
      console.log('🏠 Impostando posizione default:', locationId);
      
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return false;

      // Se è guest user, gestisci AsyncStorage
      if (currentUser.isGuest) {
        return await this.setGuestDefaultLocation(currentUser.id, locationId);
      }

      // Prima rimuovi default da tutte le posizioni
      await supabase
        .from('user_locations')
        .update({ is_default: false })
        .eq('user_id', currentUser.id);

      // Poi imposta la nuova default
      const { error } = await supabase
        .from('user_locations')
        .update({ is_default: true })
        .eq('id', locationId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('❌ Errore impostazione default:', error);
        return false;
      }

      console.log('✅ Posizione default impostata');
      return true;
    } catch (error) {
      console.error('❌ Errore nel servizio posizioni:', error);
      return false;
    }
  }

  /**
   * Ottiene la posizione di default per le ricerche
   */
  static async getDefaultSearchLocation(): Promise<{ latitude: number; longitude: number; address: string } | null> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return null;

      // Se è guest user, controlla AsyncStorage
      if (currentUser.isGuest) {
        const guestLocations = await this.getGuestLocations(currentUser.id);
        const defaultLocation = guestLocations.find(loc => loc.isDefault);
        
        if (defaultLocation) {
          return {
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
            address: defaultLocation.address
          };
        }
        return null;
      }

      // Altrimenti cerca in Supabase
      const { data, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude, address')
        .eq('user_id', currentUser.id)
        .eq('is_default', true)
        .single();

      if (error || !data) {
        console.log('📍 Nessuna posizione default trovata');
        return null;
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address
      };
    } catch (error) {
      console.error('❌ Errore caricamento posizione default:', error);
      return null;
    }
  }

  /**
   * Aggiunge una posizione alle recenti
   */
  static async addRecentLocation(location: Omit<RecentLocation, 'timestamp'>): Promise<void> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return;

      const key = `recent_locations_${currentUser.id}`;
      const existingJson = await AsyncStorage.getItem(key);
      let recentLocations: RecentLocation[] = existingJson ? JSON.parse(existingJson) : [];

      // Rimuovi duplicati (stesso indirizzo)
      recentLocations = recentLocations.filter(loc => loc.address !== location.address);

      // Aggiungi la nuova in testa
      const newLocation: RecentLocation = {
        ...location,
        timestamp: new Date().toISOString()
      };
      
      recentLocations.unshift(newLocation);

      // Mantieni solo le ultime 10
      if (recentLocations.length > 10) {
        recentLocations = recentLocations.slice(0, 10);
      }

      await AsyncStorage.setItem(key, JSON.stringify(recentLocations));
      console.log('📍 Posizione aggiunta alle recenti');
    } catch (error) {
      console.error('❌ Errore aggiunta posizione recente:', error);
    }
  }

  /**
   * Ottiene le posizioni recenti
   */
  static async getRecentLocations(): Promise<RecentLocation[]> {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) return [];

      const key = `recent_locations_${currentUser.id}`;
      const recentJson = await AsyncStorage.getItem(key);
      
      if (recentJson) {
        return JSON.parse(recentJson) as RecentLocation[];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Errore caricamento posizioni recenti:', error);
      return [];
    }
  }

  // Metodi helper privati
  private static async getGuestProfile(user: any): Promise<UserProfile> {
    try {
      const key = `guest_profile_${user.id}`;
      const profileJson = await AsyncStorage.getItem(key);
      
      if (profileJson) {
        return JSON.parse(profileJson) as UserProfile;
      }

      // Crea profilo guest di default
      const defaultProfile: UserProfile = {
        id: user.id,
        email: user.email,
        display_name: 'Utente Ospite',
        default_search_radius: 5000,
        theme: 'auto',
        notifications_enabled: true,
        location_sharing: false,
        total_favorites: 0,
        total_reviews: 0,
        member_since: user.created_at || new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_guest: true,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(defaultProfile));
      return defaultProfile;
    } catch (error) {
      console.error('❌ Errore caricamento profilo guest:', error);
      throw error;
    }
  }

  private static async updateGuestProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const key = `guest_profile_${userId}`;
      const existing = await this.getGuestProfile({ id: userId, email: 'guest', isGuest: true });
      
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await AsyncStorage.setItem(key, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('❌ Errore aggiornamento profilo guest:', error);
      return false;
    }
  }

  private static async getGuestLocations(userId: string): Promise<UserLocation[]> {
    try {
      const key = `guest_locations_${userId}`;
      const locationsJson = await AsyncStorage.getItem(key);
      
      if (locationsJson) {
        return JSON.parse(locationsJson) as UserLocation[];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Errore caricamento posizioni guest:', error);
      return [];
    }
  }

  private static async addGuestLocation(userId: string, location: Omit<UserLocation, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const existingLocations = await this.getGuestLocations(userId);
      
      // Se è default, rimuovi default dalle altre
      if (location.isDefault) {
        existingLocations.forEach(loc => loc.isDefault = false);
      }

      const newLocation: UserLocation = {
        ...location,
        id: `guest_loc_${Date.now()}`,
        created_at: new Date().toISOString()
      };

      const updatedLocations = [newLocation, ...existingLocations];
      
      const key = `guest_locations_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedLocations));
      
      return true;
    } catch (error) {
      console.error('❌ Errore aggiunta posizione guest:', error);
      return false;
    }
  }

  private static async setGuestDefaultLocation(userId: string, locationId: string): Promise<boolean> {
    try {
      const existingLocations = await this.getGuestLocations(userId);
      
      // Rimuovi default da tutte e imposta sulla selezionata
      existingLocations.forEach(loc => {
        loc.isDefault = loc.id === locationId;
      });

      const key = `guest_locations_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(existingLocations));
      
      return true;
    } catch (error) {
      console.error('❌ Errore impostazione default guest:', error);
      return false;
    }
  }

  private static async createDefaultProfile(user: any): Promise<UserProfile> {
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      display_name: user.email.split('@')[0],
      default_search_radius: 5000,
      theme: 'auto',
      notifications_enabled: true,
      location_sharing: true,
      total_favorites: 0,
      total_reviews: 0,
      member_since: user.created_at || new Date().toISOString(),
      last_active: new Date().toISOString(),
      is_guest: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Salva in database
    await supabase.from('user_profiles').insert([{
      user_id: user.id,
      email: user.email,
      display_name: profile.display_name,
      default_search_radius: profile.default_search_radius,
      theme: profile.theme,
      notifications_enabled: profile.notifications_enabled,
      location_sharing: profile.location_sharing,
    }]);

    return profile;
  }

  private static mapDatabaseToProfile(data: any): UserProfile {
    return {
      id: data.user_id,
      email: data.email,
      display_name: data.display_name,
      avatar_url: data.avatar_url,
      phone: data.phone,
      bio: data.bio,
      preferred_location: data.preferred_location ? this.mapDatabaseToLocation(data.preferred_location) : undefined,
      default_search_radius: data.default_search_radius,
      theme: data.theme || 'auto',
      notifications_enabled: data.notifications_enabled,
      location_sharing: data.location_sharing,
      total_favorites: data.total_favorites || 0,
      total_reviews: data.total_reviews || 0,
      member_since: data.created_at,
      last_active: data.updated_at,
      is_guest: false,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  private static mapDatabaseToLocation(data: any): UserLocation {
    return {
      id: data.id,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault: data.is_default,
      type: data.location_type,
      created_at: data.created_at,
    };
  }
}