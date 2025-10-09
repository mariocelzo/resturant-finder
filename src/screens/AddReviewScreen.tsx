import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { ReviewsService } from '../services/reviewsService';

type AddReviewRoute = RouteProp<RootStackParamList, 'AddReview'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function AddReviewScreen() {
  const route = useRoute<AddReviewRoute>();
  const navigation = useNavigation<Nav>();
  const { placeId, restaurantName } = route.params;
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const submit = async () => {
    try {
      if (!rating || rating < 1 || rating > 5) {
        Alert.alert('Errore', 'Inserisci un rating da 1 a 5');
        return;
      }
      setSaving(true);
      const ok = await ReviewsService.addReview({ placeId, restaurantName, rating, text });
      if (ok) {
        Alert.alert('Grazie!', 'La tua recensione è stata inviata.');
        navigation.goBack();
      } else {
        Alert.alert('Errore', 'Impossibile inviare la recensione');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingWidget>
      <View style={styles.container}>
        <Text style={styles.title}>Recensisci {restaurantName}</Text>
        <View style={styles.ratingRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn}>
              <Text style={[styles.star, { opacity: n <= rating ? 1 : 0.3 }]}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={6}
          placeholder="Scrivi la tua esperienza..."
          value={text}
          onChangeText={setText}
          maxLength={2000}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={[styles.submit, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
          <Text style={styles.submitText}>{saving ? 'Invio...' : 'Invia Recensione'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingWidget>
  );
}

const KeyboardAvoidingWidget: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
    {children}
  </KeyboardAvoidingView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 12 },
  ratingRow: { flexDirection: 'row', marginBottom: 12 },
  starBtn: { padding: 4 },
  star: { fontSize: 28 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 12, minHeight: 140, textAlignVertical: 'top', borderWidth: 1, borderColor: '#eee' },
  submit: { marginTop: 16, backgroundColor: '#FF6B6B', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});



