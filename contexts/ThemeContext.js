import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';

const lightTheme = {
  // Basic colors
  background: '#FFFFFF',
  text: '#000000',
  primary: '#FFB347', // Orange
  secondary: '#4ECDC4', // Teal
  accent: '#FF6B6B', // Coral
  
  // UI elements
  headerBackground: '#FFFFFF',
  headerTint: '#000000',
  tabBarBackground: '#FFFFFF',
  tabBarActiveTint: '#FFB347',
  tabBarInactiveTint: '#808080',
  
  // Inputs
  inputBackground: '#F5F5F5',
  inputText: '#000000',
  inputBorder: '#E0E0E0',
  inputPlaceholder: '#9E9E9E',
  
  // Cards
  cardBackground: '#FFFFFF',
  cardBorder: '#E0E0E0',
  cardShadow: '#000000',
  
  // Buttons
  buttonText: '#000000',
  buttonDisabled: '#BDBDBD',
  
  // Status
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  info: '#2196F3',
  
  // Other
  divider: '#E0E0E0',
  icon: '#616161',
};

const darkTheme = {
  // Basic colors
  background: '#121212',
  text: '#FFFFFF',
  primary: '#FFB347', // Orange
  secondary: '#4ECDC4', // Teal
  accent: '#FF6B6B', // Coral
  
  // UI elements
  headerBackground: '#1E1E1E',
  headerTint: '#FFFFFF',
  tabBarBackground: '#1E1E1E',
  tabBarActiveTint: '#FFB347',
  tabBarInactiveTint: '#808080',
  
  // Inputs
  inputBackground: '#2D2D2D',
  inputText: '#FFFFFF',
  inputBorder: '#333333',
  inputPlaceholder: '#757575',
  
  // Cards
  cardBackground: '#1E1E1E',
  cardBorder: '#333333',
  cardShadow: '#000000',
  
  // Buttons
  buttonText: '#FFFFFF',
  buttonDisabled: '#424242',
  
  // Status
  success: '#388E3C',
  warning: '#FFA000',
  danger: '#D32F2F',
  info: '#1976D2',
  
  // Other
  divider: '#333333',
  icon: '#9E9E9E',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
