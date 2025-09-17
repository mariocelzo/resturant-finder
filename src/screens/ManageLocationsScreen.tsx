import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { UserProfileService, UserLocation } from '../services/userProfileService';
import { useLocationSelection } from '../contexts/LocationContext';
import LocationForm from '../components/LocationForm';

export default function ManageLocationsScreen() {
  const { setManualLocation } = useLocationSelection();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setLoading(true);
    const data = await UserProfileService.getUserLocations();
    setLocations(data);
    setLoading(false);
  };

  const handleSetDefault = async (loc: UserLocation) => {
    if (!loc.id) return;
    const ok = await UserProfileService.setDefaultLocation(loc.id);
    if (ok) {
      // Sincronizza subito mappa e lista con la posizione scelta
      setManualLocation(loc.address, {
        latitude: loc.latitude,
        longitude: loc.longitude,
        formattedAddress: loc.address,
      });
      await loadLocations();
    } else {
      Alert.alert('Errore', 'Impossibile impostare come default');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>➕ Aggiungi Posizione</Text>
        <LocationForm
          onSubmit={async ({ name, type, address, coords, isDefault }) => {
            const ok = await UserProfileService.addUserLocation({
              name,
              address,
              latitude: coords.latitude,
              longitude: coords.longitude,
              isDefault,
              type,
            });
            if (ok) {
              Alert.alert('✅ Salvata', 'Posizione aggiunta con successo');
              if (isDefault) {
                setManualLocation(address, {
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  formattedAddress: address,
                });
              }
              await loadLocations();
            } else {
              Alert.alert('Errore', 'Impossibile salvare la posizione');
            }
            return ok;
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Posizioni Salvate</Text>
        {locations.length === 0 ? (
          <Text style={styles.emptyText}>Nessuna posizione salvata</Text>
        ) : (
          <View>
            {locations.map((loc) => (
              <View key={loc.id} style={[styles.locationItem, loc.isDefault && styles.locationItemDefault]}>
                <View style={styles.locationIcon}><Text>{loc.type === 'home' ? '🏠' : loc.type === 'work' ? '🏢' : '📍'}</Text></View>
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>{loc.name}</Text>
                  <Text style={styles.locationAddress}>{loc.address}</Text>
                </View>
                <TouchableOpacity style={styles.defaultBtn} onPress={() => handleSetDefault(loc)}>
                  <Text style={styles.defaultBtnText}>{loc.isDefault ? 'Default' : 'Imposta'}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: { color: '#666', fontSize: 14 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  locationItemDefault: { backgroundColor: '#FFF8F0' },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationContent: { flex: 1 },
  locationName: { fontSize: 14, fontWeight: '600', color: '#333' },
  locationAddress: { fontSize: 12, color: '#666', marginTop: 2 },
  defaultBtn: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  defaultBtnText: { fontSize: 12, color: '#333', fontWeight: '600' },
});
