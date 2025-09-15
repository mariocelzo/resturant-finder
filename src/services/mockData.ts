export interface Restaurant {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    priceLevel?: number;
    photoUrl?: string;
    isOpen?: boolean;
    cuisine_type?: string;
    phone?: string;
  }
  
  export const mockRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Pizzeria Da Michele',
      address: 'Via Cesare Sersale, 1, Napoli',
      latitude: 40.8518,
      longitude: 14.2681,
      rating: 4.5,
      priceLevel: 2,
      isOpen: true,
      cuisine_type: 'Pizzeria',
      phone: '+39 081 553 9204'
    },
    {
      id: '2',
      name: "L'Antica Pizzeria da Concettina ai Tre Santi",
      address: 'Via Arena della Sanità, 7, Napoli',
      latitude: 40.8606,
      longitude: 14.2564,
      rating: 4.7,
      priceLevel: 2,
      isOpen: true,
      cuisine_type: 'Pizzeria'
    },
    {
      id: '3',
      name: 'Osteria da Carmela',
      address: 'Via Conte di Ruvo, 11, Napoli',
      latitude: 40.8467,
      longitude: 14.2574,
      rating: 4.6,
      priceLevel: 3,
      isOpen: true,
      cuisine_type: 'Tradizionale'
    },
    {
      id: '4',
      name: 'Trattoria Nennella',
      address: 'Via Lungo Teatro Nuovo, 103, Napoli',
      latitude: 40.8398,
      longitude: 14.2494,
      rating: 4.3,
      priceLevel: 2,
      isOpen: false,
      cuisine_type: 'Trattoria'
    },
    {
      id: '5',
      name: 'Palazzo Petrucci',
      address: 'Piazza San Domenico Maggiore, 4, Napoli',
      latitude: 40.8476,
      longitude: 14.2551,
      rating: 4.8,
      priceLevel: 4,
      isOpen: true,
      cuisine_type: 'Fine Dining'
    },
    {
      id: '6',
      name: 'Pizzeria Gino Sorbillo',
      address: 'Via dei Tribunali, 32, Napoli',
      latitude: 40.8506,
      longitude: 14.2588,
      rating: 4.4,
      priceLevel: 2,
      isOpen: true,
      cuisine_type: 'Pizzeria'
    },
    {
      id: '7',
      name: 'Tandem Ragù',
      address: 'Via Giovanni Paladino, 51, Napoli',
      latitude: 40.8511,
      longitude: 14.2612,
      rating: 4.2,
      priceLevel: 2,
      isOpen: true,
      cuisine_type: 'Tradizionale'
    },
    {
      id: '8',
      name: 'Il Comandante',
      address: 'Via Cristoforo Colombo, 45, Napoli',
      latitude: 40.8280,
      longitude: 14.2084,
      rating: 4.9,
      priceLevel: 4,
      isOpen: true,
      cuisine_type: 'Fine Dining'
    }
  ];
  
  // Funzione per simulare la ricerca con geolocalizzazione
  export const searchNearbyRestaurants = async (
    latitude: number,
    longitude: number,
    radius: number = 2000
  ): Promise<Restaurant[]> => {
    console.log('🔍 MOCK: Cercando ristoranti per posizione:', { latitude, longitude, radius });
    
    // Simula un delay della API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Se siamo molto lontani da Napoli (es. simulatore), usa tutti i ristoranti
    const distanceFromNaples = calculateDistance(latitude, longitude, 40.8522, 14.2681);
    console.log('📏 MOCK: Distanza da Napoli:', Math.round(distanceFromNaples/1000), 'km');
    
    if (distanceFromNaples > 100000) { // Se più di 100km da Napoli
      console.log('🌍 MOCK: Posizione troppo lontana da Napoli, mostrando tutti i ristoranti mock');
      console.log('🍽️ MOCK: Restituendo', mockRestaurants.length, 'ristoranti');
      return mockRestaurants.sort((a, b) => b.rating - a.rating);
    }
    
    // Altrimenti usa la logica normale di distanza
    const nearbyRestaurants = mockRestaurants.filter(restaurant => {
      const distance = calculateDistance(
        latitude, longitude,
        restaurant.latitude, restaurant.longitude
      );
      console.log(`📍 MOCK: ${restaurant.name}: ${Math.round(distance)}m di distanza`);
      return distance <= radius;
    });
    
    console.log('✅ MOCK: Ristoranti filtrati:', nearbyRestaurants.length);
    
    // Ordina per rating decrescente
    return nearbyRestaurants.sort((a, b) => b.rating - a.rating);
  };
  
  // Funzione helper per calcolare distanza
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raggio della Terra in metri
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }