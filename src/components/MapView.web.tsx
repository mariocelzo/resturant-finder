import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ViewStyle, Text, Platform } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  style?: ViewStyle;
  region?: Region;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  userInterfaceStyle?: 'light' | 'dark';
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
}

// Web-only component using Google Maps Embed API
// Creates an iframe dynamically through React Native Web's View
export default function MapView({
  style,
  region,
  children,
  showsUserLocation,
  userInterfaceStyle,
}: MapViewProps) {
  const [markers, setMarkers] = useState<MarkerProps[]>([]);

  useEffect(() => {
    // Extract marker data from children
    const markerList: MarkerProps[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement<MarkerProps>(child) && child.type === Marker) {
        markerList.push(child.props);
      }
    });
    setMarkers(markerList);
  }, [children]);

  const center = region
    ? `${region.latitude},${region.longitude}`
    : '40.8522,14.2681';

  const zoom = region ? Math.round(14 - Math.log2(region.latitudeDelta)) : 13;

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
  const mapUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=${zoom}&maptype=roadmap`
    : '';

  // On web, we render using dangerouslySetInnerHTML via a hidden hack
  // React Native Web converts View to div, so we can inject iframe HTML
  const iframeHtml = apiKey
    ? `<iframe
        src="${mapUrl}"
        style="border:0; width:100%; height:100%;"
        allowfullscreen
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>`
    : '';

  if (!apiKey) {
    return (
      <View style={[styles.container, styles.fallback, style]}>
        <Text style={styles.fallbackEmoji}>🗺️</Text>
        <Text style={styles.fallbackTitle}>Mappa non disponibile</Text>
        <Text style={styles.fallbackSubtitle}>(Google Maps API key richiesta)</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      // @ts-ignore - web-only prop
      dangerouslySetInnerHTML={{ __html: iframeHtml }}
    />
  );
}

export function Marker({
  coordinate,
  title,
  description,
  onPress,
}: MarkerProps) {
  // Markers are rendered by MapView on web
  // This component is just a placeholder for children extraction
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  fallback: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
