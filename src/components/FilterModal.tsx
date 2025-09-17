import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { placesAutocomplete, getPlaceDetails, geocodeLocation } from '../services/googlePlaces';
import { UserProfileService, UserLocation } from '../services/userProfileService';
import { useLocationSelection } from '../contexts/LocationContext';
import SavedLocationChips from './SavedLocationChips';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

export interface FilterOptions {
  cuisineTypes: string[];
  priceRange: [number, number];
  minRating: number;
  maxDistance: number;
  showOnlyOpen: boolean;
  sortBy: 'rating' | 'distance' | 'price';
  locationQuery?: string; // opzionale: usa geocoding quando presente
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const CUISINE_OPTIONS = [
  'Tutti',
  'Pizzeria',
  'Panini',
  'Burger',
  'Sushi',
  'Kebab',
  'Italiano',
  'Trattoria',
  'Seafood',
  'Vegetariana',
  'Vegano',
  'Cinese',
  'Giapponese',
  'Indiano',
  'Messicano',
  'Mediterranea',
  'BBQ',
  'Steakhouse',
  'Fast Food',
  'Dessert',
  'Caffè',
  'Bar',
  'Pasticceria',
];

const SORT_OPTIONS = [
  { value: 'rating', label: '⭐ Per Rating', icon: '⭐' },
  { value: 'price', label: '💰 Per Prezzo', icon: '💰' },
];

export default function FilterModal({ 
  visible, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const { setManualLocation, clearLocation, locationQuery } = useLocationSelection();
  const [queryInput, setQueryInput] = useState<string>(currentFilters.locationQuery || '');
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [savedLocations, setSavedLocations] = useState<UserLocation[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const { getCurrentLocation } = useCurrentLocation();

  useEffect(() => {
    setQueryInput(currentFilters.locationQuery || locationQuery || '');
  }, [currentFilters.locationQuery, locationQuery]);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const locs = await UserProfileService.getUserLocations();
      setSavedLocations(locs);
      // Preseleziona la default se nulla selezionato
      if (!selectedSavedId) {
        const def = locs.find(l => l.isDefault);
        if (def) setSelectedSavedId(def.id || null);
      }
    })();
  }, [visible]);

  const chooseCurrentLocation = async () => {
    const cur = await getCurrentLocation();
    if (!cur) return;
    setSelectedSavedId('current');
    setManualLocation('Posizione attuale', {
      latitude: cur.latitude,
      longitude: cur.longitude,
      formattedAddress: 'Posizione attuale',
    });
    setQueryInput('Posizione attuale');
    setFilters(prev => ({ ...prev, locationQuery: 'Posizione attuale' }));
    setSuggestions([]);
  };

  useEffect(() => {
    if (!queryInput || queryInput.length < 2) {
      setSuggestions([]);
      return;
    }
    if (typingTimer) clearTimeout(typingTimer);
    const t = setTimeout(async () => {
      const s = await placesAutocomplete(queryInput);
      setSuggestions(s);
    }, 250);
    setTypingTimer(t);
  }, [queryInput]);

  const handleApply = async () => {
    console.log('🔍 Applicando filtri:', filters);
    // Sincronizza LocationContext per coerenza mappa/lista
    const q = (filters.locationQuery || '').trim();
    if (selectedSavedId) {
      // Già impostata con setManualLocation alla selezione
    } else if (q) {
      const geo = await geocodeLocation(q);
      if (geo) setManualLocation(q, { latitude: geo.latitude, longitude: geo.longitude, formattedAddress: geo.formattedAddress });
    } else {
      clearLocation();
    }
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      cuisineTypes: ['Tutti'],
      priceRange: [1, 4],
      minRating: 0,
      maxDistance: 5000,
      showOnlyOpen: false,
      sortBy: 'distance',
      locationQuery: '',
    };
    setFilters(resetFilters);
  };

  const toggleCuisine = (cuisine: string) => {
    if (cuisine === 'Tutti') {
      setFilters(prev => ({ ...prev, cuisineTypes: ['Tutti'] }));
    } else {
      setFilters(prev => {
        let newCuisines = prev.cuisineTypes.filter(c => c !== 'Tutti');
        
        if (newCuisines.includes(cuisine)) {
          newCuisines = newCuisines.filter(c => c !== cuisine);
        } else {
          newCuisines = [...newCuisines, cuisine];
        }
        
        if (newCuisines.length === 0) {
          newCuisines = ['Tutti'];
        }
        
        return { ...prev, cuisineTypes: newCuisines };
      });
    }
  };

  const getPriceText = (range: [number, number]) => {
    return `${'€'.repeat(range[0])} - ${'€'.repeat(range[1])}`;
  };

  const getDistanceText = (distance: number) => {
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getCuisineIcon = (cuisine: string) => {
    const icons: { [key: string]: string } = {
      'Tutti': '🍽️',
      'Pizzeria': '🍕',
      'Panini': '🥪',
      'Burger': '🍔',
      'Sushi': '🍣',
      'Kebab': '🥙',
      'Italiano': '🇮🇹',
      'Trattoria': '🍝',
      'Seafood': '🐟',
      'Vegetariana': '🥗',
      'Vegano': '🌱',
      'Cinese': '🥡',
      'Giapponese': '🗾',
      'Indiano': '🍛',
      'Messicano': '🌮',
      'Mediterranea': '🌊',
      'BBQ': '🍖',
      'Steakhouse': '🥩',
      'Fast Food': '🍟',
      'Dessert': '🍰',
      'Caffè': '☕',
      'Bar': '🍹',
      'Pasticceria': '🥐',
      'Asiatica': '🍜',
    };
    return icons[cuisine] || '🍽️';
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.cuisineTypes.length > 1 || !filters.cuisineTypes.includes('Tutti')) count++;
    if (filters.priceRange[0] > 1 || filters.priceRange[1] < 4) count++;
    if (filters.minRating > 0) count++;
    if (filters.maxDistance < 5000) count++;
    if (filters.showOnlyOpen) count++;
    if (filters.sortBy && filters.sortBy !== 'distance') count++;
    return count;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Annulla</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            🔍 Filtri {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Tipo di Cucina */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Tipo di Cucina</Text>
            <View style={styles.cuisineGrid}>
              {CUISINE_OPTIONS.map(cuisine => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.cuisineChip,
                    filters.cuisineTypes.includes(cuisine) && styles.cuisineChipActive
                  ]}
                  onPress={() => toggleCuisine(cuisine)}
                >
                  <Text style={styles.cuisineIcon}>{getCuisineIcon(cuisine)}</Text>
                  <Text style={[
                    styles.cuisineText,
                    filters.cuisineTypes.includes(cuisine) && styles.cuisineTextActive
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Fascia di Prezzo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Fascia di Prezzo</Text>
            <Text style={styles.rangeValue}>{getPriceText(filters.priceRange)}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>€</Text>
              <View style={styles.doubleSlider}>
                <Text style={styles.sliderSubtitle}>Min: €{filters.priceRange[0]}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={4}
                  step={1}
                  value={filters.priceRange[0]}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [value, Math.max(value, prev.priceRange[1])]
                    }))
                  }
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#FF6B6B"
                />
                <Text style={styles.sliderSubtitle}>Max: €{filters.priceRange[1]}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={4}
                  step={1}
                  value={filters.priceRange[1]}
                  onValueChange={(value) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      priceRange: [Math.min(value, prev.priceRange[0]), value]
                    }))
                  }
                  minimumTrackTintColor="#FF6B6B"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#FF6B6B"
                />
              </View>
              <Text style={styles.sliderLabel}>€€€€</Text>
            </View>
          </View>

          {/* Rating Minimo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Rating Minimo</Text>
            <Text style={styles.rangeValue}>
              {filters.minRating > 0 ? `${filters.minRating}+ stelle` : 'Qualsiasi rating'}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.5}
              value={filters.minRating}
              onValueChange={(value) => 
                setFilters(prev => ({ ...prev, minRating: value }))
              }
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#FF6B6B"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0⭐</Text>
              <Text style={styles.sliderLabel}>5⭐</Text>
            </View>
          </View>

          {/* Località manuale */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ Posizioni Salvate</Text>
            <SavedLocationChips
              savedLocations={savedLocations}
              selectedId={selectedSavedId}
              onSelectCurrent={chooseCurrentLocation}
              onSelectSaved={(loc) => {
                setSelectedSavedId(loc.id || null);
                setManualLocation(loc.name, { latitude: loc.latitude, longitude: loc.longitude, formattedAddress: loc.address });
                setQueryInput(loc.address);
                setFilters(prev => ({ ...prev, locationQuery: loc.address }));
              }}
            />
          </View>

          {/* Località manuale */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Località</Text>
            <Text style={styles.helperText}>Inserisci città/indirizzo oppure lascia vuoto per usare la tua posizione</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Es. Napoli, Italia"
              value={queryInput}
              onChangeText={(text) => {
                setQueryInput(text);
                setSelectedSavedId(null);
                setFilters(prev => ({ ...prev, locationQuery: text }));
              }}
              autoCorrect={false}
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map(s => (
                  <TouchableOpacity
                    key={s.placeId}
                    style={styles.suggestionItem}
                  onPress={async () => {
                    const details = await getPlaceDetails(s.placeId);
                    if (details) {
                      setSelectedSavedId(null);
                      setManualLocation(s.description, {
                        latitude: details.latitude,
                        longitude: details.longitude,
                        formattedAddress: details.formattedAddress,
                      });
                        setQueryInput(s.description);
                        setFilters(prev => ({ ...prev, locationQuery: s.description }));
                        setSuggestions([]);
                      }
                    }}
                  >
                    <Text style={styles.suggestionText}>{s.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {!!filters.locationQuery && (
              <TouchableOpacity onPress={() => { setFilters(prev => ({ ...prev, locationQuery: '' })); setQueryInput(''); setSuggestions([]); setSelectedSavedId(null); clearLocation(); }} style={styles.clearLocBtn}>
                <Text style={styles.clearLocText}>Usa posizione attuale</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Distanza Massima */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Distanza Massima</Text>
            <Text style={styles.rangeValue}>{getDistanceText(filters.maxDistance)}</Text>
            <Slider
              style={styles.slider}
              minimumValue={500}
              maximumValue={200000}
              step={1000}
              value={filters.maxDistance}
              onValueChange={(value) => 
                setFilters(prev => ({ ...prev, maxDistance: value }))
              }
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#FF6B6B"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>500m</Text>
              <Text style={styles.sliderLabel}>200km</Text>
            </View>
          </View>

          {/* Solo Aperti */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.sectionTitle}>🟢 Solo Ristoranti Aperti</Text>
                <Text style={styles.switchSubtitle}>
                  Mostra solo i ristoranti attualmente aperti
                </Text>
              </View>
              <Switch
                value={filters.showOnlyOpen}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, showOnlyOpen: value }))
                }
                trackColor={{ false: '#ddd', true: '#FF6B6B' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Ordinamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔢 Ordina per</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    filters.sortBy === option.value && styles.sortOptionActive
                  ]}
                  onPress={() =>
                    setFilters(prev => ({ ...prev, sortBy: option.value as FilterOptions['sortBy'] }))
                  }
                >
                  <Text style={styles.sortIcon}>{option.icon}</Text>
                  <Text style={[
                    styles.sortText,
                    filters.sortBy === option.value && styles.sortTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Footer con pulsanti */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              ✅ Applica Filtri {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  resetButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cuisineChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  cuisineIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cuisineText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cuisineTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  rangeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  clearLocBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  clearLocText: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
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
  suggestionText: {
    color: '#333',
    fontSize: 14,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doubleSlider: {
    flex: 1,
  },
  sliderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sortOptions: {
    gap: 10,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortOptionActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  sortIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
