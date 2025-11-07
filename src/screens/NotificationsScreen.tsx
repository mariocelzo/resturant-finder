import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationService, Notification } from '../services/notificationService';
import { RootStackParamList } from '../../App';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { theme } = useTheme();

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);

      const userNotifications = await NotificationService.getUserNotifications(user?.id || '');
      setNotifications(userNotifications);
    } catch (error) {
      console.error('❌ Errore caricamento notifiche:', error);
      Alert.alert('Errore', 'Impossibile caricare le notifiche');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error('❌ Errore mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await NotificationService.markAllAsRead(user?.id || '');
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        Alert.alert('✅', 'Tutte le notifiche sono state contrassegnate come lette');
      }
    } catch (error) {
      console.error('❌ Errore mark all as read:', error);
      Alert.alert('Errore', 'Impossibile aggiornare le notifiche');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare questa notifica?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await NotificationService.deleteNotification(notificationId);
              if (success) {
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
              } else {
                Alert.alert('Errore', 'Impossibile eliminare la notifica');
              }
            } catch (error) {
              console.error('❌ Errore eliminazione notifica:', error);
              Alert.alert('Errore', 'Si è verificato un errore');
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Segna come letta
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }

    // Gestisci navigazione in base al tipo
    switch (notification.type) {
      case 'review_reply':
        if (notification.data?.placeId) {
          navigation.navigate('RestaurantDetail' as any, {
            placeId: notification.data.placeId,
          });
        }
        break;
      case 'favorite_update':
        navigation.navigate('FavoritesList' as any);
        break;
      case 'recommendation':
        navigation.navigate('Search' as any);
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'review_reply':
        return '💬';
      case 'favorite_update':
        return '❤️';
      case 'recommendation':
        return '🎯';
      case 'system':
        return '🔔';
      default:
        return '📢';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Adesso';
      if (diffMins < 60) return `${diffMins}m fa`;
      if (diffHours < 24) return `${diffHours}h fa`;
      if (diffDays < 7) return `${diffDays}g fa`;
      
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return 'Data non disponibile';
    }
  };

  const renderNotificationCard = (notification: Notification) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        {
          backgroundColor: notification.read
            ? theme.cardBackground
            : theme.isDark
            ? theme.primary + '15'
            : '#FFF8F0',
          borderColor: theme.border,
          shadowColor: theme.shadowColor,
        }
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(notification.type)}
          </Text>
          <View style={styles.notificationContent}>
            <Text style={[styles.notificationTitle, { color: theme.text }]}>
              {notification.title}
            </Text>
            <Text style={[styles.notificationMessage, { color: theme.textSecondary }]}>
              {notification.message}
            </Text>
            <Text style={[styles.notificationTime, { color: theme.textTertiary }]}>
              {formatDate(notification.createdAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteNotification(notification.id)}
          style={styles.deleteButton}
        >
          <Text style={[styles.deleteIcon, { color: theme.textTertiary }]}>×</Text>
        </TouchableOpacity>
      </View>
      
      {!notification.read && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Nessuna notifica
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Quando avrai nuove notifiche, appariranno qui
      </Text>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Caricando notifiche...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifiche</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={[
              styles.markAllButton,
              {
                backgroundColor: theme.isDark ? theme.primary + '15' : '#FFF8F8',
                borderColor: theme.isDark ? theme.primary + '40' : '#FFE0E0',
              }
            ]}
          >
            <Text style={[styles.markAllText, { color: theme.primary }]}>
              Segna tutte
            </Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={styles.headerRight} />}
      </View>

      {notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {unreadCount > 0 && (
            <View style={styles.statsBar}>
              <Text style={[styles.statsText, { color: theme.textSecondary }]}>
                Hai <Text style={[styles.statsNumber, { color: theme.primary }]}>{unreadCount}</Text> notifica{unreadCount !== 1 ? 'e' : ''} non letta{unreadCount !== 1 ? 'e' : ''}
              </Text>
            </View>
          )}

          {notifications.map(renderNotificationCard)}

          <View style={styles.footerPadding} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    paddingTop: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  backIcon: {
    fontSize: 30,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  markAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
  },
  statsBar: {
    backgroundColor: 'transparent',
    padding: 14,
    marginBottom: 18,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsNumber: {
    fontWeight: '800',
    fontSize: 18,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  notificationIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
    fontWeight: '400',
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 26,
    fontWeight: '300',
  },
  unreadDot: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 44,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '500',
    lineHeight: 22,
  },
  footerPadding: {
    height: 24,
  },
});
