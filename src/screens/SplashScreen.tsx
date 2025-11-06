import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const handleGetStarted = () => {
    navigation.navigate('Auth');
  };

  return (
    <View style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.decorativeContainer}>
        {/* Top left logo circle - will be replaced with NearBite logo */}
        <View style={styles.logoCircle}>
          <Image
            source={require('../../assets/NearBiteLogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Character 1 - Left side */}
        <Image
          source={{ uri: 'https://www.figma.com/api/mcp/asset/a84e6ff7-96c2-498c-bbc9-bf8f9c62a395' }}
          style={styles.character1}
          resizeMode="contain"
        />

        {/* Character 2 - Right side */}
        <Image
          source={{ uri: 'https://www.figma.com/api/mcp/asset/8512d38f-2bf4-40b7-9cf4-73adf0e31155' }}
          style={styles.character2}
          resizeMode="contain"
        />

        {/* Decorative colored shapes */}
        <View style={styles.colorBlock1} />
        <View style={styles.colorBlock2} />
        <View style={styles.colorBlock3} />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.title}>Food for{'\n'}Everyone</Text>
      </View>

      {/* Get Started Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleGetStarted}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4B3A',
    position: 'relative',
  },
  decorativeContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  logoCircle: {
    position: 'absolute',
    top: 56,
    left: 49,
    width: 73,
    height: 73,
    borderRadius: 36.5,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  character1: {
    position: 'absolute',
    width: 358,
    height: 434,
    top: height * 0.42,
    left: -82,
    transform: [{ rotate: '-3.1deg' }],
  },
  character2: {
    position: 'absolute',
    width: 225,
    height: 298,
    top: height * 0.53,
    right: width * 0.05,
    transform: [{ rotate: '8.57deg' }],
  },
  colorBlock1: {
    position: 'absolute',
    width: 394,
    height: 195,
    top: height * 0.76,
    left: -75,
    backgroundColor: '#FFB800',
    borderRadius: 20,
    transform: [{ rotate: '-3deg' }],
  },
  colorBlock2: {
    position: 'absolute',
    width: 272,
    height: 171,
    top: height * 0.78,
    right: width * 0.1,
    backgroundColor: '#47B65C',
    borderRadius: 20,
    transform: [{ rotate: '-2deg' }],
  },
  colorBlock3: {
    position: 'absolute',
    width: 357,
    height: 64,
    top: height * 0.94,
    right: -30,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    transform: [{ rotate: '-2deg' }],
  },
  content: {
    flex: 1,
    paddingTop: 160,
    paddingLeft: 51,
  },
  title: {
    fontSize: 65,
    fontWeight: '900',
    color: 'white',
    lineHeight: 56,
    letterSpacing: -1.95,
  },
  button: {
    position: 'absolute',
    bottom: height * 0.12,
    left: 51,
    right: 51,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF460A',
  },
});
