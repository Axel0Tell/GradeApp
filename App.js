import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Auth from './screens/Auth';
import CourseList from './screens/CourseList';
import CourseDetails from './screens/CourseDetails';
import GoalSetting from './screens/GoalSetting';
import GradeReport from './screens/GradeReport';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Auth');

  useEffect(() => {
    // Check if user is logged in (simplified - replace with proper Supabase auth check)
    const checkAuth = async () => {
      const userToken = await AsyncStorage.getItem('userToken'); //  Replace with actual token check
      if (userToken) {
        setInitialRoute('CourseList');
      }
    };

    checkAuth();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen name="Auth" component={Auth} options={{ title: 'Authentication' }} />
        <Stack.Screen name="CourseList" component={CourseList} options={{ title: 'Courses' }} />
        <Stack.Screen name="CourseDetails" component={CourseDetails} options={{ title: 'Course Details' }} />
         <Stack.Screen name="GoalSetting" component={GoalSetting} options={{ title: 'Set Goals' }} />
        <Stack.Screen name="GradeReport" component={GradeReport} options={{ title: 'Grade Report' }} />

      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}