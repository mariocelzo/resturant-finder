import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { AuthService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { signIn, signUp, signInAsGuest } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    if (loading) return;

    // Validazione
    if (!email.trim()) {
      Alert.alert('Errore', 'Inserisci un indirizzo email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    if (!password) {
      Alert.alert('Errore', 'Inserisci una password');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert('Errore', 'Le password non corrispondono');
        return;
      }
    }

    try {
      setLoading(true);

      const ok = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (ok) {
        console.log('✅ Autenticazione riuscita');
        onAuthSuccess();
      } else {
        Alert.alert('Errore', 'Credenziali non valide o registrazione fallita', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Errore autenticazione:', error);
      Alert.alert(
        'Errore',
        'Si è verificato un errore imprevisto',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.log('👻 Login come ospite...');

      const ok = await signInAsGuest();
      if (ok) {
        console.log('✅ Login guest riuscito');
        onAuthSuccess();
      } else {
        Alert.alert('Errore', 'Impossibile creare account ospite', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Errore login guest:', error);
      Alert.alert(
        'Errore',
        'Si è verificato un errore imprevisto',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Reset Password',
        'Inserisci prima la tua email nel campo sopra, poi ripremi "Password dimenticata?"',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Errore', 'Inserisci un indirizzo email valido');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.resetPassword(email);
      
      if (result.success) {
        Alert.alert(
          'Email Inviata',
          'Controlla la tua casella email per le istruzioni di reset della password.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Errore',
          result.error || 'Impossibile inviare email di reset',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Errore reset password:', error);
      Alert.alert(
        'Errore',
        'Si è verificato un errore imprevisto',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image source={require('../../assets/NearBiteLogo.png')} style={styles.logoImg} />
          <Text style={styles.subtitle}>
            {isLogin ? 'Benvenuto!' : 'Crea il tuo account'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>📧 Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="nome@esempio.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>🔒 Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithToggle]}
                value={password}
                onChangeText={setPassword}
                placeholder="Almeno 6 caratteri"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.toggleSecure}
                onPress={() => setShowPassword((v) => !v)}
                disabled={loading}
              >
                <Text style={styles.toggleSecureText}>{showPassword ? 'Nascondi' : 'Mostra'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒 Conferma Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithToggle]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ripeti la password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.toggleSecure}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  disabled={loading}
                >
                  <Text style={styles.toggleSecureText}>{showConfirmPassword ? 'Nascondi' : 'Mostra'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? '🚀 Accedi' : '✨ Registrati'}
              </Text>
            )}
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Password dimenticata?</Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>oppure</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            onPress={handleGuestLogin}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>👻 Continua come ospite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setIsLogin(!isLogin)}
            disabled={loading}
          >
            <Text style={styles.switchModeText}>
              {isLogin 
                ? "Non hai un account? Registrati qui" 
                : "Hai già un account? Accedi qui"
              }
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? '🔐' : '🎉'} {isLogin 
              ? 'Accedi per salvare i tuoi ristoranti preferiti!'
              : 'Registrati per non perdere mai i tuoi preferiti!'
            }
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImg: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWithToggle: {
    paddingRight: 70,
  },
  toggleSecure: {
    position: 'absolute',
    right: 12,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  toggleSecureText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
