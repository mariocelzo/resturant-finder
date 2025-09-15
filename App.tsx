import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import MapScreen from './src/screens/MapScreen';
import RestaurantListScreen from './src/screens/ResturantListScreen'; // FIXED: Corretto import
import RestaurantDetailScreen from './src/screens/ResturantDetailScreen'; // FIXED: Corretto import
import { Restaurant } from './src/services/googlePlaces';

// Definiamo i tipi per la navigazione
export type RootStackParamList = {
  MainTabs: undefined;
  RestaurantDetail: { restaurant: Restaurant };
};

export type TabParamList = {
  Mappa: undefined;
  Lista: undefined;
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
    </Tab.Navigator>
  );
}

// App principale con Stack Navigator
export default function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}