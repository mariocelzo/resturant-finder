import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import MapScreen from './src/screens/MapScreen';
import RestaurantListScreen from './src/screens/ResturantListScreen'; // FIXED: Corretto import
import RestaurantDetailScreen from './src/screens/ResturantDetailScreen'; // FIXED: Corretto import
import { Restaurant } from './src/services/googlePlaces';
import AuthScreen from './src/screens/authScreen';
import FavoritesListScreen from './src/screens/FavoritesListScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ManageLocationsScreen from './src/screens/ManageLocationsScreen';

// Definiamo i tipi per la navigazione
export type RootStackParamList = {
  MainTabs: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  FavoritesList: undefined;
  Auth: undefined;
  ManageLocations: undefined;
};

export type TabParamList = {
  Mappa: undefined;
  Lista: undefined;
  Profilo: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Componente per i tabs principali
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Mappa" 
        component={MapScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tab.Screen 
        name="Lista" 
        component={RestaurantListScreen}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tab.Screen 
        name="Profilo" 
        component={UserProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Text style={{ fontSize: focused ? 22 : 20, color }}>{focused ? '👤' : '👥'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth">
          {() => <AuthScreen onAuthSuccess={() => { /* Gestito dal listener nel context */ }} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="RestaurantDetail" 
        component={RestaurantDetailScreen}
        options={({ route }) => ({
          title: route.params.restaurant.name,
          headerStyle: {
            backgroundColor: '#FF6B6B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      />
      <Stack.Screen 
        name="FavoritesList" 
        component={FavoritesListScreen}
        options={{
          title: 'I Miei Preferiti',
          headerStyle: { backgroundColor: '#FF6B6B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen 
        name="ManageLocations" 
        component={ManageLocationsScreen}
        options={{
          title: 'Posizioni Salvate',
          headerStyle: { backgroundColor: '#FF6B6B' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack.Navigator>
  );
}

// App principale con Stack Navigator e gating per autenticazione
export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </LocationProvider>
    </AuthProvider>
  );
}
