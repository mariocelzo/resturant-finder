import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { ReviewsService } from '../services/reviewsService';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type AddReviewRoute = RouteProp<RootStackParamList, 'AddReview'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function AddReviewScreen() {
  const route = useRoute<AddReviewRoute>();
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { placeId, restaurantName, cuisineType, priceLevel } = route.params;

  const [rating, setRating] = useState<number>(0);
  const [text, setText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [scaleAnims] = useState([1, 2, 3, 4, 5].map(() => new Animated.Value(1)));

  const animateStar = (index: number) => {
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRatingPress = (n: number) => {
    setRating(n);
    animateStar(n - 1);
  };

  const submit = async () => {
    try {
      if (!rating || rating < 1 || rating > 5) {
        Alert.alert('Errore', 'Seleziona un rating da 1 a 5 stelle');
        return;
      }
      if (!text.trim()) {
        Alert.alert('Errore', 'Scrivi qualcosa sulla tua esperienza');
        return;
      }
      setSaving(true);
      const ok = await ReviewsService.addReview({
        placeId,
        restaurantName,
        rating,
        text: text.trim(),
        cuisineType,
        priceLevel,
      });
      if (ok) {
        Alert.alert('Grazie!', 'La tua recensione è stata pubblicata con successo.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Errore', 'Impossibile inviare la recensione. Riprova più tardi.');
      }
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore imprevisto.');
    } finally {
      setSaving(false);
    }
  };

  const getRatingText = () => {
    switch (rating) {
      case 1: return 'Pessimo';
      case 2: return 'Scarso';
      case 3: return 'Discreto';
      case 4: return 'Buono';
      case 5: return 'Eccellente';
      default: return 'Seleziona un voto';
    }
  };

  const getRatingColor = () => {
    if (rating === 0) return theme.textSecondary;
    if (rating <= 2) return theme.error;
    if (rating === 3) return '#FFA726';
    return theme.success;
  };

  const charCount = text.length;
  const maxChars = 2000;
  const isCharLimitNear = charCount > maxChars * 0.9;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <LinearGradient
          colors={theme.isDark
            ? [theme.primary + '40', theme.primary + '20']
            : [theme.primary + '20', theme.primary + '10']
          }
          style={styles.headerCard}
        >
          <Text style={[styles.headerEmoji]}>✍️</Text>
          <Text style={[styles.title, { color: theme.text }]}>Scrivi una recensione</Text>
          <Text style={[styles.restaurantName, { color: theme.primary }]}>{restaurantName}</Text>
        </LinearGradient>

        {/* Rating Section */}
        <View style={[styles.section, {
          backgroundColor: theme.cardBackground,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Come valuteresti la tua esperienza?</Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => handleRatingPress(n)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Animated.Text
                  style={[
                    styles.star,
                    {
                      opacity: n <= rating ? 1 : 0.25,
                      transform: [{ scale: scaleAnims[n - 1] }]
                    }
                  ]}
                >
                  ⭐
                </Animated.Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.ratingLabelContainer, {
            backgroundColor: getRatingColor() + '20',
          }]}>
            <Text style={[styles.ratingLabel, { color: getRatingColor() }]}>
              {getRatingText()}
            </Text>
          </View>
        </View>

        {/* Review Text Section */}
        <View style={[styles.section, {
          backgroundColor: theme.cardBackground,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.border,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Racconta la tua esperienza</Text>

          <View style={[styles.inputContainer, {
            backgroundColor: theme.surface,
            borderColor: text.length > 0 ? theme.primary + '40' : theme.border,
          }]}>
            <TextInput
              style={[styles.input, {
                color: theme.text,
              }]}
              multiline
              numberOfLines={8}
              placeholder="Cosa ti è piaciuto? Cosa potrebbe essere migliorato? Condividi i dettagli della tua esperienza..."
              value={text}
              onChangeText={setText}
              maxLength={maxChars}
              placeholderTextColor={theme.textSecondary}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.charCountContainer}>
            <Text style={[styles.charCount, {
              color: isCharLimitNear ? theme.error : theme.textSecondary
            }]}>
              {charCount} / {maxChars} caratteri
            </Text>
          </View>
        </View>

        {/* Tips Section */}
        <View style={[styles.tipsContainer, {
          backgroundColor: theme.isDark ? theme.primary + '15' : theme.primary + '10',
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.primary + '30',
        }]}>
          <Text style={[styles.tipsTitle, { color: theme.primary }]}>💡 Suggerimenti</Text>
          <Text style={[styles.tipsText, { color: theme.textSecondary }]}>
            • Sii specifico e onesto{'\n'}
            • Descrivi il cibo, il servizio e l'atmosfera{'\n'}
            • Menziona eventuali piatti particolari
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: theme.primary },
            (saving || rating === 0 || !text.trim()) && styles.submitButtonDisabled
          ]}
          onPress={submit}
          disabled={saving || rating === 0 || !text.trim()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              (saving || rating === 0 || !text.trim())
                ? [theme.textSecondary, theme.textSecondary]
                : [theme.primary, theme.primary + 'DD']
            }
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.submitText}>
              {saving ? '⏳ Invio in corso...' : '📤 Pubblica Recensione'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  starBtn: {
    padding: 8,
  },
  star: {
    fontSize: 44,
  },
  ratingLabelContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'center',
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 16,
    minHeight: 160,
    lineHeight: 24,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  charCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  tipsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
});
