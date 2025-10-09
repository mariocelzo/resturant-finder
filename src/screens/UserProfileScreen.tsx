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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useLocationSelection } from '../contexts/LocationContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserProfileService, UserProfile, UserLocation } from '../services/userProfileService';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase';
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
  const { setManualLocation } = useLocationSelection();
  const { theme, setThemeMode, themeMode } = useTheme();

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
        // Sincronizza subito mappa e lista con la posizione scelta
        setManualLocation(location.address, {
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.address,
        });
        
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
    try {
      // Aggiorna subito il tema nell'app
      setThemeMode(newTheme);

      // Salva anche nel profilo se l'utente è autenticato
      if (profile && !user?.isGuest) {
        const success = await UserProfileService.updateUserProfile({
          theme: newTheme
        });

        if (success) {
          setProfile(prev => prev ? { ...prev, theme: newTheme } : null);
        }
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
    <LinearGradient
      colors={theme.isDark
        ? [theme.surface, theme.background]
        : [theme.cardBackground, theme.surface]
      }
      style={[styles.header, { backgroundColor: theme.cardBackground }]}
    >
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          onPress={async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permesso negato', 'Consenti l\'accesso alle foto per caricare un avatar.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
              if (result.canceled || !result.assets?.length) return;
              const asset = result.assets[0];
              const resp = await fetch(asset.uri);
              const blob = await resp.blob();
              const fileExt = (asset.fileName || 'avatar.jpg').split('.').pop();
              const filePath = `avatars/${(user?.id || 'guest')}_${Date.now()}.${fileExt}`;
              const { error: uploadError } = await supabase.storage.from('public').upload(filePath, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
              if (uploadError) { Alert.alert('Errore', 'Upload avatar fallito'); return; }
              const { data } = supabase.storage.from('public').getPublicUrl(filePath);
              const url = data.publicUrl;
              const ok = await UserProfileService.updateUserProfile({ avatar_url: url });
              if (ok) {
                setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
              }
            } catch (e) {
              console.error('❌ Avatar upload error', e);
              Alert.alert('Errore', 'Impossibile caricare l\'avatar');
            }
          }}
        >
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden' }}>
                {/* Use Image without importing new to keep consistency */}
                {React.createElement(require('react-native').Image, { source: { uri: profile.avatar_url }, style: { width: '100%', height: '100%' } })}
              </View>
            ) : (
              <Text style={styles.avatarText}>
                {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '👤'}
              </Text>
            )}
            {/* Plus badge */}
            <View style={styles.plusBadge}><Text style={styles.plusText}>＋</Text></View>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.headerInfo}>
        <Text style={[styles.displayName, { color: theme.text }]}>
          {profile?.display_name || user?.email?.split('@')[0] || 'Utente'}
        </Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>

        {user?.isGuest ? (
          <View style={[styles.guestBadge, {
            backgroundColor: theme.isDark ? theme.primary + '20' : '#E8F4FD',
            borderColor: theme.primary,
          }]}>
            <Text style={[styles.guestBadgeText, { color: theme.primary }]}>👻 Modalità Ospite</Text>
          </View>
        ) : (
          <Text style={[styles.memberSince, { color: theme.textTertiary }]}>
            Membro da {formatMemberSince(profile?.member_since || '')}
          </Text>
        )}
      </View>
    </LinearGradient>
  );

  const renderStats = () => (
    <View style={[styles.statsContainer, {
      backgroundColor: theme.cardBackground,
      shadowColor: theme.shadowColor,
      borderBottomWidth: theme.isDark ? 1 : 0,
      borderBottomColor: theme.border,
    }]}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{favoritesCount}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Preferiti</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{profile?.total_reviews || 0}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Recensioni</Text>
      </View>
      <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme.primary }]}>{userLocations.length}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Posizioni</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={[styles.section, {
      backgroundColor: theme.cardBackground,
      shadowColor: theme.shadowColor,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.sectionTitle, {
        color: theme.text,
        borderBottomColor: theme.border
      }]}>⚡ Azioni Rapide</Text>

      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: theme.border }]}
        onPress={() => navigation.navigate('FavoritesList' as any)}
      >
        <Text style={styles.menuItemIcon}>❤️</Text>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: theme.text }]}>I Miei Preferiti</Text>
          <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>
            {favoritesCount} ristorante{favoritesCount !== 1 ? 'i' : ''} salvato{favoritesCount !== 1 ? 'i' : ''}
          </Text>
        </View>
        <Text style={[styles.menuItemArrow, { color: theme.textTertiary }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: theme.border }]}
        onPress={() => {
          Alert.alert('Info', 'Funzionalità in arrivo!');
        }}
      >
        <Text style={styles.menuItemIcon}>📊</Text>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: theme.text }]}>Le Mie Recensioni</Text>
          <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>Gestisci le tue recensioni</Text>
        </View>
        <Text style={[styles.menuItemArrow, { color: theme.textTertiary }]}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLocations = () => (
    <View style={[styles.section, {
      backgroundColor: theme.cardBackground,
      shadowColor: theme.shadowColor,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.sectionTitle, {
        color: theme.text,
        borderBottomColor: theme.border
      }]}>📍 Posizioni Salvate</Text>

      {userLocations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Nessuna posizione salvata</Text>
          <TouchableOpacity
            style={[styles.addLocationButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }]}
            onPress={() => navigation.navigate('ManageLocations' as any)}
          >
            <Text style={[styles.addLocationText, { color: theme.primary }]}>+ Aggiungi Posizione</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {userLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.locationItem,
                { borderBottomColor: theme.border },
                location.isDefault && {
                  backgroundColor: theme.isDark ? theme.primary + '15' : '#FFF8F0'
                }
              ]}
              onPress={() => handleSetDefaultLocation(location)}
            >
              <View style={[styles.locationIcon, { backgroundColor: theme.surface }]}>
                <Text style={styles.locationIconText}>
                  {location.type === 'home' ? '🏠' :
                   location.type === 'work' ? '🏢' :
                   location.isDefault ? '⭐' : '📍'}
                </Text>
              </View>

              <View style={styles.locationContent}>
                <Text style={[styles.locationName, { color: theme.text }]}>{location.name}</Text>
                <Text style={[styles.locationAddress, { color: theme.textSecondary }]}>{location.address}</Text>
              </View>

              {location.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addLocationButton, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }]}
            onPress={() => navigation.navigate('ManageLocations' as any)}
          >
            <Text style={[styles.addLocationText, { color: theme.primary }]}>+ Aggiungi Posizione</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={[styles.section, {
      backgroundColor: theme.cardBackground,
      shadowColor: theme.shadowColor,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
    }]}>
      <Text style={[styles.sectionTitle, {
        color: theme.text,
        borderBottomColor: theme.border
      }]}>⚙️ Impostazioni</Text>

      <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
        <Text style={styles.settingIcon}>🌙</Text>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>Tema</Text>
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {profile?.theme === 'light' ? 'Chiaro' :
             profile?.theme === 'dark' ? 'Scuro' : 'Automatico'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.themeButton, {
            backgroundColor: theme.surface,
          }]}
          onPress={() => {
            const themes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
            const currentIndex = themes.indexOf(profile?.theme || 'auto');
            const nextTheme = themes[(currentIndex + 1) % themes.length];
            handleThemeToggle(nextTheme);
          }}
        >
          <Text style={[styles.themeButtonText, { color: theme.text }]}>Cambia</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
        <Text style={styles.settingIcon}>🔔</Text>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>Notifiche</Text>
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>Ricevi notifiche push</Text>
        </View>
        <Switch
          value={profile?.notifications_enabled || false}
          onValueChange={handleNotificationsToggle}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#fff"
        />
      </View>

      <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
        <Text style={styles.settingIcon}>📍</Text>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>Raggio di Ricerca</Text>
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {((profile?.default_search_radius || 5000) / 1000).toFixed(1)} km
          </Text>
        </View>
        <TouchableOpacity style={[styles.settingButton, { backgroundColor: theme.surface }]}>
          <Text style={[styles.settingButtonText, { color: theme.text }]}>Modifica</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={[styles.section, {
      backgroundColor: theme.cardBackground,
      shadowColor: theme.shadowColor,
      borderWidth: theme.isDark ? 1 : 0,
      borderColor: theme.border,
    }]}>
      <TouchableOpacity style={[styles.logoutButton, {
        backgroundColor: theme.isDark ? theme.error + '20' : '#FFF3F3',
        borderColor: theme.isDark ? theme.error + '40' : '#FFE8E8',
      }]} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>👋</Text>
        <Text style={[styles.logoutText, { color: theme.error }]}>
          {user?.isGuest ? 'Esci da Modalità Ospite' : 'Disconnetti'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Caricando profilo...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadProfile(true)}
          tintColor={theme.primary}
          colors={[theme.primary]}
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
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>Restaurant Finder v1.0.0</Text>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
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
    position: 'relative',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: '#FF6B6B', fontWeight: '800', lineHeight: 20 },
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
