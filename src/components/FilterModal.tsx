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
  Animated,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { placesAutocomplete, getPlaceDetails, geocodeLocation } from '../services/googlePlaces';
import { UserProfileService, UserLocation } from '../services/userProfileService';
import { useLocationSelection } from '../contexts/LocationContext';
import SavedLocationChips from './SavedLocationChips';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing, BorderRadius, Typography, Shadows } from '../styles/designSystem';

type TabType = 'quick' | 'cuisine' | 'location';

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

// Preset intelligenti per filtri rapidi
const QUICK_PRESETS = [
  {
    id: 'top_rated',
    title: 'Top Rated',
    icon: '⭐',
    description: 'I migliori ristoranti',
    filters: { minRating: 4.5, sortBy: 'rating' as const },
  },
  {
    id: 'nearby',
    title: 'Vicino a me',
    icon: '📍',
    description: 'Entro 2km',
    filters: { maxDistance: 2000, sortBy: 'distance' as const },
  },
  {
    id: 'budget',
    title: 'Economici',
    icon: '💰',
    description: 'Fascia bassa',
    filters: { priceRange: [1, 2] as [number, number], sortBy: 'price' as const },
  },
  {
    id: 'open_now',
    title: 'Aperti ora',
    icon: '🟢',
    description: 'Solo aperti',
    filters: { showOnlyOpen: true, sortBy: 'distance' as const },
  },
  {
    id: 'premium',
    title: 'Premium',
    icon: '✨',
    description: 'Alta qualità',
    filters: { minRating: 4.0, priceRange: [3, 4] as [number, number], sortBy: 'rating' as const },
  },
];

// Cucine popolari raggruppate
const POPULAR_CUISINES = ['Tutti', 'Pizzeria', 'Sushi', 'Burger', 'Italiano', 'Trattoria'];
const INTERNATIONAL_CUISINES = ['Cinese', 'Giapponese', 'Indiano', 'Messicano', 'Mediterranea'];
const SPECIALTY_CUISINES = ['Seafood', 'Vegetariana', 'Vegano', 'BBQ', 'Steakhouse'];
const CASUAL_CUISINES = ['Fast Food', 'Panini', 'Kebab', 'Dessert', 'Caffè', 'Bar', 'Pasticceria'];

export default function FilterModal({
  visible,
  onClose,
  onApplyFilters,
  currentFilters
}: FilterModalProps) {
  const { theme } = useTheme();
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [activeTab, setActiveTab] = useState<TabType>('quick');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const { setManualLocation, clearLocation, locationQuery } = useLocationSelection();
  const [queryInput, setQueryInput] = useState<string>(currentFilters.locationQuery || '');
  const [suggestions, setSuggestions] = useState<{ description: string; placeId: string }[]>([]);
  const [typingTimer, setTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [savedLocations, setSavedLocations] = useState<UserLocation[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const { getCurrentLocation } = useCurrentLocation();
  const tabIndicatorAnim = React.useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const tabIndex = activeTab === 'quick' ? 0 : activeTab === 'cuisine' ? 1 : 2;
    Animated.spring(tabIndicatorAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [activeTab]);

  const applyPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setFilters(prev => ({ ...prev, ...preset.filters }));
      setSelectedPreset(presetId);
    }
  };

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.cancelButton, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Filtri {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
          </Text>
          <TouchableOpacity onPress={handleReset} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.resetButton, { color: theme.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('quick')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === 'quick' ? theme.primary : theme.textSecondary }]}>
                ⚡ Rapidi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('cuisine')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === 'cuisine' ? theme.primary : theme.textSecondary }]}>
                🍽️ Cucina
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('location')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: activeTab === 'location' ? theme.primary : theme.textSecondary }]}>
                📍 Luogo
              </Text>
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[
              styles.tabIndicator,
              { backgroundColor: theme.primary },
              {
                transform: [{
                  translateX: tabIndicatorAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, Dimensions.get('window').width / 3, (Dimensions.get('window').width / 3) * 2]
                  })
                }]
              }
            ]}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* TAB: QUICK FILTERS */}
          {activeTab === 'quick' && (
            <>
              {/* Preset Rapidi */}
              <View style={styles.presetsContainer}>
                {QUICK_PRESETS.map(preset => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      { backgroundColor: theme.cardBackground, borderColor: theme.border },
                      selectedPreset === preset.id && { borderColor: theme.primary, borderWidth: 2 },
                    ]}
                    onPress={() => applyPreset(preset.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetHeader}>
                      <Text style={styles.presetIcon}>{preset.icon}</Text>
                      <View style={styles.presetTexts}>
                        <Text style={[styles.presetTitle, { color: theme.text }]}>{preset.title}</Text>
                        <Text style={[styles.presetDescription, { color: theme.textSecondary }]}>
                          {preset.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Controlli Avanzati */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🎚️ Personalizza</Text>

                {/* Fascia di Prezzo */}
                <View style={styles.controlGroup}>
                  <Text style={[styles.controlLabel, { color: theme.text }]}>💰 Prezzo</Text>
                  <Text style={[styles.controlValue, { color: theme.primary }]}>
                    {getPriceText(filters.priceRange)}
                  </Text>
                  <View style={styles.sliderContainer}>
                    <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>€</Text>
                    <View style={styles.doubleSlider}>
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
                        minimumTrackTintColor={theme.primary}
                        maximumTrackTintColor={theme.border}
                        thumbTintColor={theme.primary}
                      />
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
                        minimumTrackTintColor={theme.primary}
                        maximumTrackTintColor={theme.border}
                        thumbTintColor={theme.primary}
                      />
                    </View>
                    <Text style={[styles.sliderLabel, { color: theme.textSecondary }]}>€€€€</Text>
                  </View>
                </View>

                {/* Rating Minimo */}
                <View style={[styles.controlGroup, { marginTop: Spacing.lg }]}>
                  <Text style={[styles.controlLabel, { color: theme.text }]}>⭐ Rating</Text>
                  <Text style={[styles.controlValue, { color: theme.primary }]}>
                    {filters.minRating > 0 ? `${filters.minRating}+` : 'Qualsiasi'}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={5}
                    step={0.5}
                    value={filters.minRating}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.primary}
                  />
                </View>

                {/* Distanza Massima */}
                <View style={[styles.controlGroup, { marginTop: Spacing.lg }]}>
                  <Text style={[styles.controlLabel, { color: theme.text }]}>📍 Distanza</Text>
                  <Text style={[styles.controlValue, { color: theme.primary }]}>
                    {getDistanceText(filters.maxDistance)}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={500}
                    maximumValue={200000}
                    step={1000}
                    value={filters.maxDistance}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, maxDistance: value }))}
                    minimumTrackTintColor={theme.primary}
                    maximumTrackTintColor={theme.border}
                    thumbTintColor={theme.primary}
                  />
                </View>

                {/* Switch Solo Aperti */}
                <View style={[styles.switchRow, { marginTop: Spacing.lg }]}>
                  <Text style={[styles.controlLabel, { color: theme.text }]}>🟢 Solo aperti</Text>
                  <Switch
                    value={filters.showOnlyOpen}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, showOnlyOpen: value }))}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Ordinamento */}
                <View style={{ marginTop: Spacing.lg }}>
                  <Text style={[styles.controlLabel, { color: theme.text, marginBottom: Spacing.sm }]}>
                    🔢 Ordina per
                  </Text>
                  <View style={styles.sortOptions}>
                    {SORT_OPTIONS.map(option => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.sortOption,
                          { backgroundColor: theme.surface, borderColor: theme.border },
                          filters.sortBy === option.value && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value as FilterOptions['sortBy'] }))}
                      >
                        <Text style={styles.sortIcon}>{option.icon}</Text>
                        <Text style={[
                          styles.sortText,
                          { color: theme.textSecondary },
                          filters.sortBy === option.value && styles.sortTextActive
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </>
          )}

          {/* TAB: CUISINE */}
          {activeTab === 'cuisine' && (
            <>
              {/* Popolari */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>⭐ Popolari</Text>
                <View style={styles.cuisineGrid}>
                  {POPULAR_CUISINES.map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        filters.cuisineTypes.includes(cuisine) && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text style={styles.cuisineIcon}>{getCuisineIcon(cuisine)}</Text>
                      <Text style={[
                        styles.cuisineText,
                        { color: theme.textSecondary },
                        filters.cuisineTypes.includes(cuisine) && styles.cuisineTextActive
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Internazionali */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🌍 Internazionali</Text>
                <View style={styles.cuisineGrid}>
                  {INTERNATIONAL_CUISINES.map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        filters.cuisineTypes.includes(cuisine) && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text style={styles.cuisineIcon}>{getCuisineIcon(cuisine)}</Text>
                      <Text style={[
                        styles.cuisineText,
                        { color: theme.textSecondary },
                        filters.cuisineTypes.includes(cuisine) && styles.cuisineTextActive
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Specialità */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>✨ Specialità</Text>
                <View style={styles.cuisineGrid}>
                  {SPECIALTY_CUISINES.map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        filters.cuisineTypes.includes(cuisine) && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text style={styles.cuisineIcon}>{getCuisineIcon(cuisine)}</Text>
                      <Text style={[
                        styles.cuisineText,
                        { color: theme.textSecondary },
                        filters.cuisineTypes.includes(cuisine) && styles.cuisineTextActive
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Casual */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>🍔 Casual</Text>
                <View style={styles.cuisineGrid}>
                  {CASUAL_CUISINES.map(cuisine => (
                    <TouchableOpacity
                      key={cuisine}
                      style={[
                        styles.cuisineChip,
                        { backgroundColor: theme.surface, borderColor: theme.border },
                        filters.cuisineTypes.includes(cuisine) && { backgroundColor: theme.primary, borderColor: theme.primary }
                      ]}
                      onPress={() => toggleCuisine(cuisine)}
                    >
                      <Text style={styles.cuisineIcon}>{getCuisineIcon(cuisine)}</Text>
                      <Text style={[
                        styles.cuisineText,
                        { color: theme.textSecondary },
                        filters.cuisineTypes.includes(cuisine) && styles.cuisineTextActive
                      ]}>
                        {cuisine}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* TAB: LOCATION */}
          {activeTab === 'location' && (
            <>
              {/* Posizioni Salvate */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>⭐ Posizioni Salvate</Text>
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

              {/* Ricerca Località */}
              <View style={[styles.section, { backgroundColor: theme.cardBackground, shadowColor: theme.shadowColor }]}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>📍 Cerca Località</Text>
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  Inserisci città/indirizzo oppure lascia vuoto per usare la tua posizione
                </Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="Es. Napoli, Italia"
                  value={queryInput}
                  onChangeText={(text) => {
                    setQueryInput(text);
                    setSelectedSavedId(null);
                    setFilters(prev => ({ ...prev, locationQuery: text }));
                  }}
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholderTextColor={theme.textSecondary}
                />
                {suggestions.length > 0 && (
                  <View style={[styles.suggestionsBox, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                    {suggestions.map(s => (
                      <TouchableOpacity
                        key={s.placeId}
                        style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
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
                        <Text style={[styles.suggestionText, { color: theme.text }]}>{s.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {!!filters.locationQuery && (
                  <TouchableOpacity
                    onPress={() => {
                      setFilters(prev => ({ ...prev, locationQuery: '' }));
                      setQueryInput('');
                      setSuggestions([]);
                      setSelectedSavedId(null);
                      clearLocation();
                    }}
                    style={styles.clearLocBtn}
                  >
                    <Text style={[styles.clearLocText, { color: theme.primary }]}>Usa posizione attuale</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

        </ScrollView>

        {/* Footer con pulsanti */}
        <View style={[styles.footer, { backgroundColor: theme.cardBackground, borderTopColor: theme.border }]}>
          <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.primary }]} onPress={handleApply}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  cancelButton: {
    fontSize: Typography.fontSize.base,
  },
  resetButton: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cuisineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  cuisineIcon: {
    fontSize: Typography.fontSize.base,
    marginRight: Spacing.xs + 2,
  },
  cuisineText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  cuisineTextActive: {
    color: '#fff',
    fontWeight: Typography.fontWeight.semibold,
  },
  rangeValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  helperText: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.fontSize.base,
  },
  clearLocBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.sm,
  },
  clearLocText: {
    fontWeight: Typography.fontWeight.semibold,
  },
  suggestionsBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.xs + 2,
  },
  suggestionItem: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: Typography.fontSize.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
  },
  doubleSlider: {
    flex: 1,
  },
  sliderSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs + 1,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs + 1,
  },
  sliderLabel: {
    fontSize: Typography.fontSize.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.xs,
  },
  sortOptions: {
    gap: Spacing.sm + 2,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  sortIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm + 2,
  },
  sortText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  sortTextActive: {
    color: '#fff',
    fontWeight: Typography.fontWeight.semibold,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderTopWidth: 1,
  },
  applyButton: {
    paddingVertical: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  // Tab Bar Styles
  tabBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    position: 'relative',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  tabText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    width: '33.33%',
    borderRadius: BorderRadius.xs,
  },
  // Preset Cards
  presetsContainer: {
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  presetCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIcon: {
    fontSize: 32,
    marginRight: Spacing.base,
  },
  presetTexts: {
    flex: 1,
  },
  presetTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs / 2,
  },
  presetDescription: {
    fontSize: Typography.fontSize.sm,
  },
  // Control Group
  controlGroup: {
    marginBottom: Spacing.base,
  },
  controlLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  controlValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
});
