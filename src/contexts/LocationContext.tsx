import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserProfileService } from '../services/userProfileService';

export interface Coordinates {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
}

interface LocationContextType {
  locationQuery: string;
  coordinates: Coordinates | null;
  setManualLocation: (query: string, coords: Coordinates | null) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const setManualLocation = (query: string, coords: Coordinates | null) => {
    setLocationQuery(query);
    setCoordinates(coords);
  };

  const clearLocation = () => {
    setLocationQuery('');
    setCoordinates(null);
  };

  // All'avvio, prova a caricare la posizione di default (persistita)
  useEffect(() => {
    (async () => {
      try {
        console.log('📍 LocationContext: Caricamento posizione di default...');
        const def = await UserProfileService.getDefaultSearchLocation();
        if (def) {
          console.log('✅ LocationContext: Posizione di default trovata:', def.name, def.address);
          setManualLocation(def.address, {
            latitude: def.latitude,
            longitude: def.longitude,
            formattedAddress: def.address,
          });
        } else {
          console.log('⚠️ LocationContext: Nessuna posizione di default salvata');
        }
      } catch (e) {
        console.warn('⚠️ LocationContext: Errore caricamento posizione default:', e);
      }
    })();
  }, []);

  return (
    <LocationContext.Provider value={{ locationQuery, coordinates, setManualLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationSelection(): LocationContextType {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationSelection must be used within LocationProvider');
  return ctx;
}
