import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Image } from 'react-native';

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e',
};

const LoadingScreen = () => {
  return (
    <View style={[styles.container, { backgroundColor: gradeKoColors.background }]}>
      {/* --- APP LOGO AND NAME --- */}
      <Image
        // PALITAN MO ITO NG TAMANG PATH KUNG IBA SA PROJECT MO
        // Halimbawa, kung nasa root ang assets at nasa src/screens ang LoadingScreen.js:
        // source={require('../../assets/logo.png')}
        source={require('../assets/logo.png')} // Assuming 'assets' is a sibling of 'screens'
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.appNameContainer}>
          <Text style={[styles.appNameText, { color: gradeKoColors.grade }]}>Grade</Text>
          <Text style={[styles.appNameText, { color: gradeKoColors.ko }]}>Ko</Text>
      </View>
      {/* --- END OF APP LOGO AND NAME --- */}

      <ActivityIndicator size="large" color={gradeKoColors.grade} />
      <Text style={[styles.text, { color: gradeKoColors.texts }]}>Loading, please wait...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100, // Pwede mong i-adjust ang laki
    height: 100, // Pwede mong i-adjust ang laki
    marginBottom: 15, // Espasyo sa pagitan ng logo at "GradeKo" text
  },
  appNameContainer: {
    flexDirection: 'row',
    marginBottom: 30, // Espasyo sa pagitan ng "GradeKo" text at ActivityIndicator
  },
  appNameText: {
    fontSize: 32, // Pwede mong i-adjust ang laki
    fontWeight: 'bold',
    // Pwede kang magdagdag ng text shadow kung gusto mo
    // textShadowColor: 'rgba(0, 0, 0, 0.2)',
    // textShadowOffset: { width: 1, height: 1 },
    // textShadowRadius: 2,
  },
  text: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoadingScreen;