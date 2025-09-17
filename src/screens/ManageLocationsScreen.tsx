import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { placesAutocomplete, getPlaceDetails } from '../services/googlePlaces';
import { UserProfileService, UserLocation } from '../services/userProfileService';
import { useLocationSelection } from '../contexts/LocationContext';

type LocationType = 'home' | 'work' | 'custom';

export default function ManageLocationsScreen() {
  const { setManualLocation } = useLocationSelection();
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<LocationType>('custom');
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (!addressQuery || addressQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      const s = await placesAutocomplete(addressQuery);
      setSuggestions(s);
    }, 250);
    return () => clearTimeout(t);
  }, [addressQuery]);

  useEffect(() => {
    // Prefill label when choosing known type
    if (type === 'home' && (!name || name === '')) setName('Casa');
    if (type === 'work' && (!name || name === '')) setName('Lavoro');
  }, [type]);

  const loadLocations = async () => {
    setLoading(true);
    const data = await UserProfileService.getUserLocations();
    setLocations(data);
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setType('custom');
    setAddressQuery('');
    setAddress('');
    setCoords(null);
    setIsDefault(false);
    setSuggestions([]);
  };

  const canSave = useMemo(() => {
    return !!name.trim() && !!coords && !!address.trim();
  }, [name, coords, address]);

  const handleSave = async () => {
    if (!canSave || !coords) return;
    const ok = await UserProfileService.addUserLocation({
      name: name.trim(),
      address: address,
      latitude: coords.latitude,
      longitude: coords.longitude,
      isDefault,
      type,
    });
    if (ok) {
      Alert.alert('✅ Salvata', 'Posizione aggiunta con successo');
      if (isDefault) {
        // Sincronizza subito mappa e lista
        setManualLocation(address, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          formattedAddress: address,
        });
      }
      resetForm();
      await loadLocations();
    } else {
      Alert.alert('Errore', 'Impossibile salvare la posizione');
    }
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
        <View style={styles.row}>
          <Text style={styles.label}>Etichetta</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Es. Casa, Lavoro, Palestra"
            placeholderTextColor="#999"
          />
        </View>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.typeRow}>
          {([
            { key: 'home', label: 'Casa', icon: '🏠' },
            { key: 'work', label: 'Lavoro', icon: '🏢' },
            { key: 'custom', label: 'Altro', icon: '📍' },
          ] as { key: LocationType; label: string; icon: string }[]).map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeChip, type === t.key && styles.typeChipActive]}
              onPress={() => setType(t.key)}
            >
              <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextActive]}>
                {t.icon} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.label, { marginTop: 8 }]}>Indirizzo</Text>
        <TextInput
          style={styles.input}
          value={addressQuery}
          onChangeText={(v) => {
            setAddressQuery(v);
            setCoords(null);
            setAddress('');
          }}
          placeholder="Cerca indirizzo..."
          placeholderTextColor="#999"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((s) => (
              <TouchableOpacity
                key={s.placeId}
                style={styles.suggestionItem}
                onPress={async () => {
                  const details = await getPlaceDetails(s.placeId);
                  if (!details) return;
                  setCoords({ latitude: details.latitude, longitude: details.longitude });
                  setAddress(details.formattedAddress);
                  setAddressQuery(details.formattedAddress);
                  setSuggestions([]);
                }}
              >
                <Text style={styles.suggestionText}>{s.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.defaultRow}>
          <Text style={styles.defaultLabel}>Imposta come predefinita</Text>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ false: '#ddd', true: '#FF6B6B' }} thumbColor="#fff" />
        </View>
        <TouchableOpacity style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} disabled={!canSave} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Salva Posizione</Text>
        </TouchableOpacity>
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
  row: { marginBottom: 12 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  typeChipActive: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  typeChipText: { color: '#333', fontWeight: '600' },
  typeChipTextActive: { color: '#fff' },
  suggestionsBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginTop: 6,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  suggestionText: { color: '#333', fontSize: 14 },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  defaultLabel: { color: '#333', fontWeight: '600' },
  saveBtn: {
    marginTop: 14,
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
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
