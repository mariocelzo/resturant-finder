import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, Image, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { LocationProvider } from './src/contexts/LocationContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
// Removed separate Map and List, replaced by SearchScreen
import RestaurantDetailScreen from './src/screens/ResturantDetailScreen'; // FIXED: Corretto import
import { Restaurant } from './src/services/googlePlaces';
import AuthScreen from './src/screens/authScreen';
import FavoritesListScreen from './src/screens/FavoritesListScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ManageLocationsScreen from './src/screens/ManageLocationsScreen';
import HomeScreen from './src/screens/HomeScreen';
import AddReviewScreen from './src/screens/AddReviewScreen';
import SearchScreen from './src/screens/SearchScreen';

// Definiamo i tipi per la navigazione
export type RootStackParamList = {
  MainTabs: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  FavoritesList: undefined;
  Auth: undefined;
  ManageLocations: undefined;
  AddReview: { placeId: string; restaurantName: string };
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Profilo: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Componente per i tabs principali
function MainTabs() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.tabBarTint,
        tabBarInactiveTintColor: theme.textTertiary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 16,
          right: 16,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 65,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 85 : 95}
            tint={isDark ? 'dark' : 'light'}
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 28,
              overflow: 'hidden',
              backgroundColor: isDark
                ? 'rgba(30, 30, 30, 0.85)'
                : 'rgba(255, 255, 255, 0.85)',
              borderWidth: isDark ? 0.5 : 0.5,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(0, 0, 0, 0.06)',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: isDark ? 0.3 : 0.15,
                  shadowRadius: 16,
                },
                android: {
                  elevation: 12,
                },
              }),
            }}
          />
        ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
          letterSpacing: 0.2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: focused
                ? (isDark ? theme.primary + '30' : theme.primary + '20')
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: focused ? 1.05 : 1 }],
            }}>
              <Text style={{ fontSize: focused ? 22 : 20 }}>🏠</Text>
            </View>
          ),
          title: 'Home'
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: focused
                ? (isDark ? theme.primary + '30' : theme.primary + '20')
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: focused ? 1.05 : 1 }],
            }}>
              <Text style={{ fontSize: focused ? 22 : 20 }}>🔎</Text>
            </View>
          ),
          title: 'Cerca'
        }}
      />
      <Tab.Screen
        name="Profilo"
        component={UserProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => {
            // Avatar nel tab se disponibile
            const Any = require('./src/services/userProfileService');
            const useAvatar = () => {
              const React2 = require('react');
              const [url, setUrl] = React2.useState(null as string | null);
              React2.useEffect(() => {
                (async () => {
                  try {
                    const svc = Any.UserProfileService;
                    const prof = await svc.getUserProfile();
                    setUrl(prof?.avatar_url || null);
                  } catch {}
                })();
              }, []);
              return url;
            };
            const AvatarIcon: React.FC = () => {
              const url = useAvatar();
              const size = focused ? 30 : 26;
              return (
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: focused
                    ? (isDark ? theme.primary + '30' : theme.primary + '20')
                    : 'transparent',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ scale: focused ? 1.05 : 1 }],
                }}>
                  {url ? (
                    <Image
                      source={{ uri: url }}
                      style={{
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: focused ? 2 : 0,
                        borderColor: theme.primary,
                      }}
                    />
                  ) : (
                    <Text style={{ fontSize: focused ? 22 : 20 }}>👤</Text>
                  )}
                </View>
              );
            };
            return <AvatarIcon />;
          },
          title: 'Profilo'
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
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
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        cardStyle: { backgroundColor: theme.background },
      }}
    >
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
            backgroundColor: theme.primary,
            borderBottomWidth: 0,
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
          headerStyle: {
            backgroundColor: theme.primary,
            borderBottomWidth: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="ManageLocations"
        component={ManageLocationsScreen}
        options={{
          title: 'Posizioni Salvate',
          headerStyle: {
            backgroundColor: theme.primary,
            borderBottomWidth: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="AddReview"
        component={AddReviewScreen}
        options={{
          title: 'Aggiungi Recensione',
          headerStyle: {
            backgroundColor: theme.primary,
            borderBottomWidth: 0,
          },
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
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
