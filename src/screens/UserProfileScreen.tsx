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
  Image,
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

  // Ricarica quando la schermata ottiene focus (ma non al primo mount)
  useFocusEffect(
    useCallback(() => {
      console.log('👤 UserProfileScreen got focus, loading profile...');
      loadProfile();
    }, [])
  );

  const loadProfile = async (showRefreshLoader = false) => {
    try {
      // Evita doppio caricamento se già caricato
      if (!showRefreshLoader && profile && userLocations.length > 0) {
        console.log('👤 Profilo già caricato, skip');
        setLoading(false);
        return;
      }

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
      // Non mostrare alert a ogni caricamento fallito, solo logga
      console.warn('Profilo non caricabile, utente potrebbe essere guest');
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
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [1, 1],
              });
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
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                resizeMode="cover"
              />
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
        onPress={() => navigation.navigate('MyReviews' as any)}
      >
        <Text style={styles.menuItemIcon}>📊</Text>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: theme.text }]}>Le Mie Recensioni</Text>
          <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>
            {profile?.total_reviews || 0} recensione{profile?.total_reviews !== 1 ? 'i' : ''}
          </Text>
        </View>
        <Text style={[styles.menuItemArrow, { color: theme.textTertiary }]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.menuItem, { borderBottomColor: theme.border }]}
        onPress={() => navigation.navigate('Notifications' as any)}
      >
        <Text style={styles.menuItemIcon}>🔔</Text>
        <View style={styles.menuItemContent}>
          <Text style={[styles.menuItemTitle, { color: theme.text }]}>Notifiche</Text>
          <Text style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>Resta aggiornato sulle novità</Text>
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
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 18,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  plusText: { 
    color: '#FF6B6B', 
    fontWeight: '800', 
    fontSize: 16,
    lineHeight: 20 
  },
  headerInfo: {
    alignItems: 'center',
  },
  displayName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginBottom: 10,
  },
  guestBadge: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0066CC',
  },
  guestBadgeText: {
    fontSize: 13,
    color: '#0066CC',
    fontWeight: '700',
  },
  memberSince: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  statsContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FF6B6B',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1.5,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderRadius: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    letterSpacing: 0.3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    backgroundColor: 'transparent',
  },
  menuItemIcon: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#d0d0d0',
    fontWeight: '300',
  },
  emptyState: {
    padding: 28,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#888',
    marginBottom: 18,
    fontWeight: '500',
  },
  addLocationButton: {
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  addLocationText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  locationItemDefault: {
    backgroundColor: '#FFF8F0',
  },
  locationIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
  },
  locationIconText: {
    fontSize: 20,
  },
  locationContent: {
    flex: 1,
    marginLeft: 14,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  locationAddress: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  settingIcon: {
    fontSize: 22,
    width: 36,
    textAlign: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  themeButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  themeButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  settingButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  settingButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFD5D5',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
  },
});
