import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserLocation } from '../services/userProfileService';

interface Props {
  savedLocations: UserLocation[];
  selectedId: string | null;
  onSelectCurrent: () => void;
  onSelectSaved: (loc: UserLocation) => void;
}

export default function SavedLocationChips({ savedLocations, selectedId, onSelectCurrent, onSelectSaved }: Props) {
  if (!savedLocations || savedLocations.length === 0) {
    return <Text style={styles.helperText}>Nessuna posizione salvata. Aggiungila dalla tua area profilo.</Text>;
  }
  return (
    <View style={styles.savedList}>
      <TouchableOpacity
        key={'current-location'}
        style={[styles.savedChip, selectedId === 'current' && styles.savedChipActive]}
        onPress={onSelectCurrent}
      >
        <Text style={[styles.savedChipText, selectedId === 'current' && styles.savedChipTextActive]}>📱 Posizione attuale</Text>
      </TouchableOpacity>
      {savedLocations.map((loc) => (
        <TouchableOpacity
          key={loc.id}
          style={[styles.savedChip, selectedId === loc.id && styles.savedChipActive]}
          onPress={() => onSelectSaved(loc)}
        >
          <Text style={[styles.savedChipText, selectedId === loc.id && styles.savedChipTextActive]}>
            {loc.type === 'home' ? '🏠' : loc.type === 'work' ? '🏢' : '📍'} {loc.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  savedList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  savedChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savedChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  savedChipText: {
    color: '#333',
    fontWeight: '600',
  },
  savedChipTextActive: {
    color: '#fff',
  },
});

