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
import SplashScreen from './src/screens/SplashScreen';

// Definiamo i tipi per la navigazione
export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  RestaurantDetail: { restaurant: Restaurant };
  FavoritesList: undefined;
  Auth: undefined;
  ManageLocations: undefined;
  AddReview: { placeId: string; restaurantName: string; cuisineType?: string; priceLevel?: number };
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
          bottom: 20,
          left: 12,
          right: 12,
          elevation: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 0,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 90 : 100}
            tint={isDark ? 'dark' : 'light'}
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 32,
              overflow: 'hidden',
              backgroundColor: isDark
                ? 'rgba(28, 28, 30, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
              borderWidth: isDark ? 1 : 1,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.08)',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: isDark ? 0.4 : 0.18,
                  shadowRadius: 20,
                },
                android: {
                  elevation: 16,
                },
              }),
            }}
          />
        ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 8,
          marginTop: -2,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: focused
                ? (isDark ? theme.primary + '25' : theme.primary + '18')
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: focused ? 1.08 : 1 }],
            }}>
              <Text style={{ fontSize: focused ? 24 : 22 }}>🏠</Text>
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
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: focused
                ? (isDark ? theme.primary + '25' : theme.primary + '18')
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: focused ? 1.08 : 1 }],
            }}>
              <Text style={{ fontSize: focused ? 24 : 22 }}>🔎</Text>
            </View>
          ),
          title: 'Cerca'
        }}
      />
      <Tab.Screen
        name="Profilo"
        component={UserProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: focused
                ? (isDark ? theme.primary + '25' : theme.primary + '18')
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale: focused ? 1.08 : 1 }],
            }}>
              <Text style={{ fontSize: focused ? 24 : 22 }}>👤</Text>
            </View>
          ),
          title: 'Profilo'
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);
  const navigationRef = React.useRef(null);

  // Reset dello splash quando l'utente si autentica o si disconnette
  React.useEffect(() => {
    if (isAuthenticated) {
      setShowSplash(false);
    } else {
      // Quando l'utente fa logout, torna direttamente alla schermata Auth (non Splash)
      setShowSplash(false);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={showSplash ? "Splash" : "Auth"}
      >
        {showSplash && (
          <Stack.Screen name="Splash">
            {(props) => <SplashScreen {...props} />}
          </Stack.Screen>
        )}
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
