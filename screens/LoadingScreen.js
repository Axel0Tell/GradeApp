import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const LoadingScreen = () => {
  // Provide default theme values in case ThemeProvider isn't available
  const defaultTheme = {
    background: '#FFFFFF',
    text: '#000000',
    primary: '#FFB347'
  };
  
  let theme;
  try {
    theme = useTheme()?.theme || defaultTheme;
  } catch (e) {
    theme = defaultTheme;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={[styles.text, { color: theme.text }]}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default LoadingScreen;
