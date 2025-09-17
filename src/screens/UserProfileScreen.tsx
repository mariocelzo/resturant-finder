import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService, UserProfile, UserLocation } from '../services/userProfileService';
import { useFavorites } from '../hooks/useFavorites';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function UserProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { user, signOut } = useAuth();
  const { favoritesCount, favorites } = useFavorites();

  // Ricarica quando la schermata ottiene focus
  useFocusEffect(
    useCallback(() => {
      console.log('👤 UserProfileScreen got focus, loading profile...');
      loadProfile();
    }, [])
  );

  useEffect(() => {
    console.log('🚀 UserProfileScreen mounted');
    loadProfile();
  }, []);

  const loadProfile = async (showRefreshLoader = false) => {
    try {
      console.log('👤 Caricando profilo utente...');
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      const [userProfile, locations] = await Promise.all([
        UserProfileService.getUserProfile(),
        UserProfileService.getUserLocations()
      ]);

      setProfile(userProfile);
      setUserLocations(locations);
      console.log('✅ Profilo caricato:', {
        hasProfile: !!userProfile,
        locationsCount: locations.length
      });
    } catch (error) {
      console.error('❌ Errore caricamento profilo:', error);
      Alert.alert('Errore', 'Impossibile caricare il profilo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Conferma Logout',
      user?.isGuest 
        ? 'Sei sicuro di voler uscire dalla modalità ospite?'
        : 'Sei sicuro di voler disconnetterti?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('👋 Logout richiesto');
            await signOut();
          }
        }
      ]
    );
  };

  const handleSetDefaultLocation = async (location: UserLocation) => {
    if (!location.id) return;

    try {
      console.log('🏠 Impostando posizione default:', location.name);
      const success = await UserProfileService.setDefaultLocation(location.id);
      
      if (success) {
        // Aggiorna lo stato locale
        setUserLocations(prev => prev.map(loc => ({
          ...loc,
          isDefault: loc.id === location.id
        })));
        
        Alert.alert('✅', `"${location.name}" impostata come posizione di default`);
      } else {
        Alert.alert('Errore', 'Impossibile impostare la posizione di default');
      }
    } catch (error) {
      console.error('❌ Errore impostazione default:', error);
      Alert.alert('Errore', 'Si è verificato un errore');
    }
  };

  const handleThemeToggle = async (newTheme: 'light' | 'dark' | 'auto') => {
    if (!profile) return;

    try {
      const success = await UserProfileService.updateUserProfile({ 
        theme: newTheme 
      });
      
      if (success) {
        setProfile(prev => prev ? { ...prev, theme: newTheme } : null);
      }
    } catch (error) {
      console.error('❌ Errore cambio tema:', error);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (!profile) return;

    try {
      const success = await UserProfileService.updateUserProfile({ 
        notifications_enabled: enabled 
      });
      
      if (success) {
        setProfile(prev => prev ? { ...prev, notifications_enabled: enabled } : null);
      }
    } catch (error) {
      console.error('❌ Errore toggle notifiche:', error);
    }
  };

  const formatMemberSince = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('it-IT', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data non disponibile';
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '👤'}
          </Text>
        </View>
      </View>
      
      <View style={styles.headerInfo}>
        <Text style={styles.displayName}>
          {profile?.display_name || user?.email?.split('@')[0] || 'Utente'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        {user?.isGuest ? (
          <View style={styles.guestBadge}>
            <Text style={styles.guestBadgeText}>👻 Modalità Ospite</Text>
          </View>
        ) : (
          <Text style={styles.memberSince}>
            Membro da {formatMemberSince(profile?.member_since || '')}
          </Text>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{favoritesCount}</Text>
        <Text style={styles.statLabel}>Preferiti</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{profile?.total_reviews || 0}</Text>
        <Text style={styles.statLabel}>Recensioni</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userLocations.length}</Text>
        <Text style={styles.statLabel}>Posizioni</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚡ Azioni Rapide</Text>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('FavoritesList' as any)}
      >
        <Text style={styles.menuItemIcon}>❤️</Text>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>I Miei Preferiti</Text>
          <Text style={styles.menuItemSubtitle}>
            {favoritesCount} ristorante{favoritesCount !== 1 ? 'i' : ''} salvato{favoritesCount !== 1 ? 'i' : ''}
          </Text>
        </View>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => {
          Alert.alert('Info', 'Funzionalità in arrivo!');
        }}
      >
        <Text style={styles.menuItemIcon}>📊</Text>
        <View style={styles.menuItemContent}>
          <Text style={styles.menuItemTitle}>Le Mie Recensioni</Text>
          <Text style={styles.menuItemSubtitle}>Gestisci le tue recensioni</Text>
        </View>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📍 Posizioni Salvate</Text>
      
      {userLocations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Nessuna posizione salvata</Text>
          <TouchableOpacity 
            style={styles.addLocationButton}
            onPress={() => {
              Alert.alert('Info', 'Funzionalità di aggiunta posizioni in arrivo!');
            }}
          >
            <Text style={styles.addLocationText}>+ Aggiungi Posizione</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {userLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                location.isDefault && styles.locationItemDefault
              ]}
              onPress={() => handleSetDefaultLocation(location)}
            >
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>
                  {location.type === 'home' ? '🏠' : 
                   location.type === 'work' ? '🏢' : 
                   location.isDefault ? '⭐' : '📍'}
                </Text>
              </View>
              
              <View style={styles.locationContent}>
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>{location.address}</Text>
              </View>
              
              {location.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity 
            style={styles.addLocationButton}
            onPress={() => {
              Alert.alert('Info', 'Funzionalità di aggiunta posizioni in arrivo!');
            }}
          >
            <Text style={styles.addLocationText}>+ Aggiungi Posizione</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Impostazioni</Text>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingIcon}>🌙</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Tema</Text>
          <Text style={styles.settingSubtitle}>
            {profile?.theme === 'light' ? 'Chiaro' : 
             profile?.theme === 'dark' ? 'Scuro' : 'Automatico'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.themeButton}
          onPress={() => {
            const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
            const currentIndex = themes.indexOf(profile?.theme || 'auto');
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            handleThemeToggle(nextTheme);
          }}
        >
          <Text style={styles.themeButtonText}>Cambia</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingIcon}>🔔</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Notifiche</Text>
          <Text style={styles.settingSubtitle}>Ricevi notifiche push</Text>
        </View>
        <Switch
          value={profile?.notifications_enabled || false}
          onValueChange={handleNotificationsToggle}
          trackColor={{ false: '#ddd', true: '#FF6B6B' }}
          thumbColor="#fff"
        />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingIcon}>📍</Text>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Raggio di Ricerca</Text>
          <Text style={styles.settingSubtitle}>
            {((profile?.default_search_radius || 5000) / 1000).toFixed(1)} km
          </Text>
        </View>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Modifica</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>👋</Text>
        <Text style={styles.logoutText}>
          {user?.isGuest ? 'Esci da Modalità Ospite' : 'Disconnetti'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Caricando profilo...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
          tintColor="#FF6B6B"
          colors={['#FF6B6B']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}
      {renderStats()}
      {renderQuickActions()}
      {renderLocations()}
      {renderSettings()}
      {renderActions()}
      
      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Restaurant Finder v1.0.0</Text>
        <Text style={styles.footerText}>
          {user?.isGuest 
            ? '👻 I dati ospite sono salvati solo su questo dispositivo'
            : '☁️ I tuoi dati sono sincronizzati nel cloud'
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  guestBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  guestBadgeText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
  },
  memberSince: {
    fontSize: 12,
    color: '#888',
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemIcon: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 15,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  addLocationButton: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addLocationText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    textAlign: 'center',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  locationItemDefault: {
    backgroundColor: '#FFF8F0',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconText: {
    fontSize: 16,
  },
  locationContent: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingIcon: {
    fontSize: 18,
    width: 30,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  themeButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  themeButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  settingButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  settingButtonText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginVertical: 15,
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});