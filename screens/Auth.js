import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
} from 'react-native';
import { supabase } from '../services/supabaseService';

const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  inputBackground: 'rgba(255, 255, 255, 0.2)',
  inputPlaceholder: '#e7c0e4aa',
  inputBorder: '#d0d0d0',
  buttonBackground: '#ffbd59',
  buttonText: '#FFFFFF',
};

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6;

  const handleAuth = async () => {
    // ... (existing handleAuth logic, no changes here)
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp && password !== passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ email, password });
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
      }

      if (response.error) throw response.error;

      if (isSignUp) {
        Alert.alert('Success', 'Account created successfully!');
        setIsSignUp(false);
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/bg.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.innerContainer}>
          {/* Container for App Name Text and Logo (side-by-side) */}
          <View style={styles.logoHeaderContainer}>
            {/* App Name Text MAUUNA NA NGAYON */}
            <View style={styles.appNameTextContainer}>
              <Text style={[styles.appNameText, { color: gradeKoColors.grade }]}>Grade</Text>
              <Text style={[styles.appNameText, { color: gradeKoColors.ko }]}>Ko</Text>
            </View>
            {/* Logo Graphic KASUNOD NG TEXT */}
            <Image
              source={require('../assets/logo.png')} // Assuming logo.png is your graphic element
              style={styles.logoGraphic}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: gradeKoColors.texts }]}>
            {isSignUp ? 'Create Account' : 'Welcome Back!'}
          </Text>

          {/* Input fields and buttons remain the same */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: gradeKoColors.inputBackground,
                color: gradeKoColors.texts,
                borderColor: gradeKoColors.inputBorder,
              },
            ]}
            placeholder="Email Address"
            placeholderTextColor={gradeKoColors.inputPlaceholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: gradeKoColors.inputBackground,
                color: gradeKoColors.texts,
                borderColor: gradeKoColors.inputBorder,
              },
            ]}
            placeholder="Password"
            placeholderTextColor={gradeKoColors.inputPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {isSignUp && (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: gradeKoColors.inputBackground,
                  color: gradeKoColors.texts,
                  borderColor: gradeKoColors.inputBorder,
                },
              ]}
              placeholder="Confirm Password"
              placeholderTextColor={gradeKoColors.inputPlaceholder}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
            />
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: gradeKoColors.buttonBackground }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={gradeKoColors.buttonText} />
            ) : (
              <Text style={[styles.buttonText, { color: gradeKoColors.buttonText }]}>
                {isSignUp ? 'Sign Up' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.linkButton}>
            <Text style={[styles.linkButtonText, { color: gradeKoColors.texts }]}>
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 70,
    marginTop: 0,
    marginLeft: 25, // <--- NAGLAGAY AKO NG MARGIN DITO para may space bago yung logo graphic
    // justifyContent: 'center', // Pwede mong i-uncomment to kung gusto mo i-center yung buong "GradeKo [logo]"
  },
  appNameTextContainer: {
    flexDirection: 'row',
    marginRight: -10, // <--- NAGLAGAY AKO NG MARGIN DITO para may space bago yung logo graphic
  },
  appNameText: {
    fontSize: 50,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  logoGraphic: {
    width: 90, // Adjust size as needed, baka mas maliit na ngayon
    height: 90, // Adjust size as needed
    // Tinanggal ko yung marginRight dito since yung text container na ang may right margin
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderRadius: 25,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 25,
  },
  linkButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Auth;