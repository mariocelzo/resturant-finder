import React, { createContext, useContext, useState, ReactNode } from 'react';

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

