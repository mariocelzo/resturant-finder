# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NearBite is a React Native restaurant discovery app built with Expo. Users can search for nearby restaurants using Google Places API, save favorites, write reviews, and manage search locations. The app supports both authenticated users (via Supabase) and guest users (with local AsyncStorage persistence).

## Development Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm start`
- **Run on specific platform**:
  - iOS: `npm run ios`
  - Android: `npm run android`
  - Web: `npm run web`

## Architecture Overview

### Navigation Structure

The app uses React Navigation with a dual-layer architecture:
- **RootNavigator** (Stack): Handles authentication gating and screen navigation
- **MainTabs** (Bottom Tabs): Three main tabs - Home, Search, Profile
- Stack screens include: RestaurantDetail, FavoritesList, ManageLocations, AddReview

Navigation types are defined in App.tsx:20-33 with `RootStackParamList` and `TabParamList`.

### Context Providers

Two main context providers wrap the entire app:
1. **AuthContext** (src/contexts/AuthContext.tsx): Manages authentication state, user sessions, and auth operations (sign in/up, guest mode, sign out)
2. **LocationContext** (src/contexts/LocationContext.tsx): Manages user's selected search location, loads default location from user profile on startup

### Service Layer Architecture

Services follow a static class pattern with no instantiation required:

- **supabase.ts**: Supabase client initialization with AsyncStorage for session persistence
- **authService.ts**: Authentication operations, guest user management
- **googlePlaces.ts**: Google Places API integration with caching (2-minute TTL), fallback to mock data when API key missing
- **favoriteService.ts**: Dual-mode favorites - Supabase for authenticated users, AsyncStorage for guests
- **reviewsService.ts**: User-generated reviews stored in Supabase
- **userProfileService.ts**: User profiles, saved locations, and default search settings

### Data Flow Patterns

**Guest vs Authenticated Users**:
- Guest users: Data stored in AsyncStorage with keys like `guest_favorites_${guestId}`
- Authenticated users: Data persisted in Supabase tables (favorites, user_reviews, user_profiles, saved_locations)
- Services check `user.isGuest` flag to determine storage strategy

**Google Places Integration**:
- Implements request deduplication and caching to avoid redundant API calls
- Uses inflight request tracking (src/services/googlePlaces.ts:3,99)
- Automatically classifies cuisine types from place names and types (src/services/googlePlaces.ts:30-84)
- Supports pagination for fetching more results (up to 3 pages, max 60 results)

### Key Screens

- **HomeScreen**: Displays featured restaurants based on current/default location
- **SearchScreen**: Advanced search with filters (cuisine, price, rating, distance)
- **ResturantDetailScreen**: Restaurant details with reviews (Google + user reviews), favorite button, map preview
- **UserProfileScreen**: User profile management, favorites access, saved locations, sign out
- **ManageLocationsScreen**: CRUD for saved search locations with default location setting
- **AddReviewScreen**: Form for adding user reviews (rating + text)

### Components

Key reusable components in src/components/:
- **FilterModal**: Advanced filtering UI for restaurant search
- **FavoriteButton**: Heart icon toggle for favorites with real-time state
- **LocationForm**: Form for adding/editing saved locations with Google autocomplete
- **SavedLocationChips**: Horizontal scrollable chips for quick location selection
- **MapPreviewCard**: Small map preview for restaurant locations

## Environment Variables

Required environment variables (defined in .env):
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`: Google Places API key (optional, falls back to mock data)

## Code Conventions

**TypeScript**:
- Strict mode enabled (tsconfig.json:4)
- Explicit typing preferred, avoid `any`
- Interface definitions co-located with services

**Styling**:
- 2-space indentation
- Single quotes for strings
- Semicolons required
- PascalCase for components, camelCase for functions/variables

**Import Order**:
1. External packages (React, React Native, etc.)
2. Navigation imports
3. Context imports
4. Internal components/services
5. Type definitions

**Naming Conventions**:
- Components: PascalCase (e.g., `UserProfileScreen.tsx`)
- Services: camelCase (e.g., `googlePlaces.ts`)
- Interfaces/Types: PascalCase (e.g., `Restaurant`, `AuthContextType`)

## Database Schema Notes

Supabase tables referenced in code:
- `favorites`: User favorites with full restaurant data denormalized
- `user_reviews`: User-generated reviews linked to Google place_id
- `user_profiles`: User profile data including avatar_url
- `saved_locations`: User's saved search locations with default flag

## Important Implementation Details

**Authentication Flow**:
- On app start, AuthContext initializes and checks for existing session (src/contexts/AuthContext.tsx:44-63)
- Auth state listener updates user state on session changes (src/contexts/AuthContext.tsx:30-42)
- Guest users get a unique ID stored in AsyncStorage
- Unauthenticated state shows AuthScreen; authenticated state shows MainTabs

**Location Selection**:
- LocationContext loads default search location on mount (src/contexts/LocationContext.tsx:34-49)
- Location can be set manually or from saved locations
- Used throughout app for restaurant search queries

**Favorites System**:
- FavoritesService handles dual storage (Supabase vs AsyncStorage) transparently
- UI components use `useFavorites` hook for state management (src/hooks/useFavorites.ts)
- Favorite status checked with `isFavorite()` method

**Review System**:
- Restaurant detail screen shows both Google reviews and user reviews
- User reviews stored in Supabase linked by place_id
- Review submission requires authentication (guests upgrade prompt)

## Existing Documentation

See AGENTS.md for additional conventions and guidelines that were established for AI agents working on this codebase. Key points from AGENTS.md include commit message conventions (Conventional Commits), security notes about API keys, and structural organization.
