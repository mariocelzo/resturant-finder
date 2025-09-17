import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch } from 'react-native';
import { placesAutocomplete, getPlaceDetails } from '../services/googlePlaces';

type LocationType = 'home' | 'work' | 'custom';

interface SubmitPayload {
  name: string;
  type: LocationType;
  address: string;
  coords: { latitude: number; longitude: number };
  isDefault: boolean;
}

interface Props {
  onSubmit: (payload: SubmitPayload) => Promise<boolean> | boolean;
}

export default function LocationForm({ onSubmit }: Props) {
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<LocationType>('custom');
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    if (type === 'home' && (!name || name === '')) setName('Casa');
    if (type === 'work' && (!name || name === '')) setName('Lavoro');
  }, [type]);

  const canSave = useMemo(() => !!name.trim() && !!coords && !!address.trim(), [name, coords, address]);

  const resetForm = () => {
    setName('');
    setType('custom');
    setAddressQuery('');
    setAddress('');
    setCoords(null);
    setIsDefault(false);
    setSuggestions([]);
  };

  const handleSubmit = async () => {
    if (!canSave || !coords) return;
    setSubmitting(true);
    try {
      const ok = await onSubmit({
        name: name.trim(),
        type,
        address,
        coords,
        isDefault,
      });
      if (ok) resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
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
      <TouchableOpacity style={[styles.saveBtn, (!canSave || submitting) && styles.saveBtnDisabled]} disabled={!canSave || submitting} onPress={handleSubmit}>
        <Text style={styles.saveBtnText}>{submitting ? 'Salvataggio…' : 'Salva Posizione'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

