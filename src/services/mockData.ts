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
    phone: '+39 081 553 9204',
    photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop'
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
    cuisine_type: 'Pizzeria',
    photoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&h=600&fit=crop'
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
    cuisine_type: 'Tradizionale',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop'
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
    cuisine_type: 'Trattoria',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
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
    cuisine_type: 'Fine Dining',
    photoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop'
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
    cuisine_type: 'Pizzeria',
    photoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop'
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
    cuisine_type: 'Tradizionale',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
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
    cuisine_type: 'Fine Dining',
    photoUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop'
  }
];

// Mock Reviews per ogni ristorante
export const mockReviews: { [restaurantId: string]: Array<{
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}> } = {
  '1': [
    {
      id: 'r1_1',
      authorName: 'Marco Rossi',
      rating: 5,
      text: 'Pizza straordinaria! Impasto perfetto e ingredienti freschi. Un must a Napoli!',
      relativeTime: '2 settimane fa'
    },
    {
      id: 'r1_2',
      authorName: 'Anna Bianchi',
      rating: 4,
      text: 'Ottima pizza napoletana. Code lunghe ma ne vale la pena.',
      relativeTime: '1 mese fa'
    },
    {
      id: 'r1_3',
      authorName: 'Giuseppe Verdi',
      rating: 5,
      text: 'La vera pizza napoletana! Locale storico, esperienza autentica.',
      relativeTime: '3 settimane fa'
    }
  ],
  '2': [
    {
      id: 'r2_1',
      authorName: 'Lucia Ferrari',
      rating: 5,
      text: 'Eccezionale! Pizza gourmet in un ambiente caratteristico.',
      relativeTime: '1 settimana fa'
    },
    {
      id: 'r2_2',
      authorName: 'Paolo Conti',
      rating: 5,
      text: 'Una delle migliori pizzerie di Napoli. Ingredienti di prima qualità.',
      relativeTime: '2 settimane fa'
    }
  ],
  '3': [
    {
      id: 'r3_1',
      authorName: 'Francesca Romano',
      rating: 5,
      text: 'Cucina tradizionale napoletana al suo meglio. Porzioni abbondanti!',
      relativeTime: '4 giorni fa'
    },
    {
      id: 'r3_2',
      authorName: 'Andrea Russo',
      rating: 4,
      text: 'Ottima osteria, piatti tipici ben preparati. Prezzi onesti.',
      relativeTime: '1 settimana fa'
    }
  ],
  '4': [
    {
      id: 'r4_1',
      authorName: 'Carla Marino',
      rating: 4,
      text: 'Trattoria autentica, atmosfera vivace. Cibo buono e prezzi bassi.',
      relativeTime: '5 giorni fa'
    },
    {
      id: 'r4_2',
      authorName: 'Michele Gallo',
      rating: 4,
      text: 'Esperienza molto napoletana! Servizio veloce e cordiale.',
      relativeTime: '2 settimane fa'
    }
  ],
  '5': [
    {
      id: 'r5_1',
      authorName: 'Valentina Costa',
      rating: 5,
      text: 'Fine dining eccellente. Piatti raffinati e servizio impeccabile.',
      relativeTime: '3 giorni fa'
    },
    {
      id: 'r5_2',
      authorName: 'Roberto Bruno',
      rating: 5,
      text: 'Stella Michelin meritatissima. Esperienza culinaria indimenticabile.',
      relativeTime: '1 settimana fa'
    },
    {
      id: 'r5_3',
      authorName: 'Elena Colombo',
      rating: 5,
      text: 'Sublime! Ogni piatto è una opera d\'arte. Consigliato per occasioni speciali.',
      relativeTime: '2 settimane fa'
    }
  ],
  '6': [
    {
      id: 'r6_1',
      authorName: 'Simone Ricci',
      rating: 4,
      text: 'Pizza buonissima, come da tradizione Sorbillo. Sempre affollato!',
      relativeTime: '6 giorni fa'
    },
    {
      id: 'r6_2',
      authorName: 'Chiara Moretti',
      rating: 5,
      text: 'La migliore pizza margherita che abbia mai mangiato!',
      relativeTime: '1 settimana fa'
    }
  ],
  '7': [
    {
      id: 'r7_1',
      authorName: 'Davide Fontana',
      rating: 4,
      text: 'Il ragù è spettacolare! Piccolo locale ma grande cucina.',
      relativeTime: '3 giorni fa'
    },
    {
      id: 'r7_2',
      authorName: 'Sara Barbieri',
      rating: 4,
      text: 'Specializzato in ragù, tutti ottimi. Prezzi contenuti.',
      relativeTime: '1 settimana fa'
    }
  ],
  '8': [
    {
      id: 'r8_1',
      authorName: 'Lorenzo Martini',
      rating: 5,
      text: 'Due stelle Michelin meritate. Vista mozzafiato e cucina stellare.',
      relativeTime: '2 giorni fa'
    },
    {
      id: 'r8_2',
      authorName: 'Giulia Ferrara',
      rating: 5,
      text: 'Esperienza gastronomica ai massimi livelli. Prezzo alto ma giusto.',
      relativeTime: '1 settimana fa'
    },
    {
      id: 'r8_3',
      authorName: 'Alessandro Rizzo',
      rating: 5,
      text: 'Il miglior ristorante di Napoli. Servizio impeccabile, piatti creativi.',
      relativeTime: '3 settimane fa'
    }
  ]
};

// Funzione per ottenere recensioni mock
export const getMockReviews = (restaurantId: string): Array<{
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime: string;
}> => {
  return mockReviews[restaurantId] || [];
};

// Funzione per simulare la ricerca con geolocalizzazione
export const searchNearbyRestaurants = async (
  latitude: number,
  longitude: number,
  radius: number = 2000
): Promise<Restaurant[]> => {
  console.log('🔍 MOCK: Cercando ristoranti per posizione:', { latitude, longitude, radius });

  // Simula un delay della API
  await new Promise(resolve => setTimeout(resolve, 500));

  // Se siamo molto lontani da Napoli (es. simulatore), usa tutti i ristoranti
  const distanceFromNaples = calculateDistance(latitude, longitude, 40.8522, 14.2681);
  console.log('📏 MOCK: Distanza da Napoli:', Math.round(distanceFromNaples/1000), 'km');

  // CORREZIONE: Se più di 5km da Napoli centro o se il radius è grande, mostra tutti i ristoranti
  // Ridotto da 10km a 5km per evitare di mostrare ristoranti troppo lontani
  // Questo è necessario perché i mock data sono concentrati a Napoli centro
  if (distanceFromNaples > 5000 || radius > 20000) {
    console.log('🌍 MOCK: Usando tutti i ristoranti mock (distanza >5km o radius largo)');
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

  // Se nessun ristorante trovato nel raggio, restituisci comunque i mock per testing
  if (nearbyRestaurants.length === 0) {
    console.log('⚠️ MOCK: Nessun ristorante nel raggio, restituisco tutti i mock per testing');
    return mockRestaurants.sort((a, b) => b.rating - a.rating);
  }

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
