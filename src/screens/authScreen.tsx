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
  Dimensions,
} from 'react-native';
import { AuthService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const { width } = Dimensions.get('window');

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { signIn, signUp, signInAsGuest, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Error', 'Enter an email address');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Enter a password');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    try {
      setLoading(true);

      const ok = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (ok) {
        console.log('✅ Authentication successful');
        onAuthSuccess();
      } else {
        Alert.alert('Error', 'Invalid credentials or registration failed', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.log('🔐 Google Sign-In...');

      const ok = await signInWithGoogle();
      if (ok) {
        console.log('✅ Google Sign-In successful');
        onAuthSuccess();
      } else {
        Alert.alert('Error', 'Google Sign-In failed', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred with Google Sign-In',
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
      console.log('👻 Guest login...');

      const ok = await signInAsGuest();
      if (ok) {
        console.log('✅ Guest login successful');
        onAuthSuccess();
      } else {
        Alert.alert('Error', 'Unable to create guest account', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Guest login error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred',
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
        'Please enter your email address first, then press "Forgot passcode?" again',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const result = await AuthService.resetPassword(email);

      if (result.success) {
        Alert.alert(
          'Email Sent',
          'Check your email for password reset instructions.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'Unable to send reset email',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred',
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header with logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/NearBiteLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* White card container */}
        <View style={styles.card}>
          {/* Tab buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setIsLogin(true)}
              disabled={loading}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setIsLogin(false)}
              disabled={loading}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Sign-up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active tab indicator */}
          <View style={styles.tabIndicatorContainer}>
            <View
              style={[
                styles.tabIndicator,
                !isLogin && styles.tabIndicatorRight
              ]}
            />
          </View>

          {/* Form inputs */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="yourname@gmail.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <View style={styles.inputUnderline} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="* * * * * * * *"
                placeholderTextColor="#999"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <View style={styles.inputUnderline} />
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="* * * * * * * *"
                  placeholderTextColor="#999"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <View style={styles.inputUnderline} />
              </View>
            )}

            {isLogin && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                disabled={loading}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotText}>Forgot passcode?</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Login/Sign-up button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isLogin ? 'Login' : 'Sign up'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In button - Temporaneamente disabilitato */}
        {/*
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <View style={styles.googleButtonContent}>
            <Image
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </View>
        </TouchableOpacity>
        */}

        {/* Guest login */}
        <TouchableOpacity
          style={[styles.guestButton, loading && styles.buttonDisabled]}
          onPress={handleGuestLogin}
          disabled={loading}
        >
          <Text style={styles.guestButtonText}>👻 Continue as guest</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 132,
    height: 162,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    paddingHorizontal: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 5,
    minHeight: 400,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    opacity: 0.4,
  },
  tabTextActive: {
    opacity: 1,
  },
  tabIndicatorContainer: {
    width: '100%',
    height: 3,
    marginBottom: 30,
  },
  tabIndicator: {
    width: width * 0.32,
    height: 3,
    backgroundColor: '#FA4A0C',
    borderRadius: 40,
    shadowColor: '#C33F15',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIndicatorRight: {
    marginLeft: width * 0.37,
  },
  form: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    opacity: 0.4,
    marginBottom: 8,
  },
  input: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 8,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  forgotButton: {
    marginTop: 10,
  },
  forgotText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FA4A0C',
  },
  primaryButton: {
    backgroundColor: '#FA4A0C',
    marginHorizontal: 50,
    marginTop: 40,
    height: 70,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#F6F6F9',
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 50,
    marginTop: 30,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    marginHorizontal: 50,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FA4A0C',
    marginHorizontal: 50,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#FA4A0C',
    fontSize: 16,
    fontWeight: '600',
  },
});
