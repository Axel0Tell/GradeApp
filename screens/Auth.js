import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

function Auth({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ email, password });
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
      }
  
      console.log("Full Supabase Auth Response:", JSON.stringify(response, null, 2)); //  <--  VERY IMPORTANT
  
      if (response.error) {
        console.error("Authentication Error:", response.error);
        Alert.alert('Authentication Failed', response.error.message);
      } else if (response.data) {
        const session = response.data.session;
  
        if (session && session.access_token) {
          await AsyncStorage.setItem('userToken', session.access_token);
          navigation.replace('CourseList');
        } else {
          console.error("No access_token found in session:", response.data);
          Alert.alert('Authentication Error', 'Could not retrieve session. Please try again.');
        }
      } else {
        console.error("Unexpected authentication response:", response);
        Alert.alert('Authentication Error', 'An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error("Authentication Catch Error:", error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
      <TextInput
        style={{ width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={{ width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isSignUp ? 'Sign Up' : 'Login'} onPress={handleAuth} />
      <Button
        title={isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
        onPress={() => setIsSignUp(!isSignUp)}
      />
    </View>
  );
}

export default Auth;