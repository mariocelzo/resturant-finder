import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface CurrentLocationResult {
  latitude: number;
  longitude: number;
}

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<CurrentLocationResult | null> => {
    try {
      setLoading(true);
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permesso negato');
        return null;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { latitude: current.coords.latitude, longitude: current.coords.longitude };
    } catch (e: any) {
      setError(e?.message || 'Errore lettura posizione');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, getCurrentLocation };
}

