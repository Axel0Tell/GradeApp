import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Auth from './screens/Auth';
import CourseList from './screens/CourseList';
import CourseDetails from './screens/CourseDetails';
import GoalSetting from './screens/GoalSetting';
import GradeReport from './screens/GradeReport';
import Profile from './screens/Profile';
import LoadingScreen from './screens/LoadingScreen';
import { supabase } from './services/supabaseService';
import { ThemeProvider } from './contexts/ThemeContext';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'CoursesTab') iconName = focused ? 'book' : 'book-outline';
          if (route.name === 'GoalsTab') iconName = focused ? 'flag' : 'flag-outline';
          if (route.name === 'ReportTab') iconName = focused ? 'analytics' : 'analytics-outline';
          if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="CoursesTab" 
        component={CourseList} 
        options={{ title: 'Courses' }}
      />
      <Tab.Screen 
        name="GoalsTab" 
        component={GoalSetting} 
        options={{ title: 'Goals' }}
      />
      <Tab.Screen 
        name="ReportTab" 
        component={GradeReport} 
        options={{ title: 'Report' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={Profile} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider>
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {!session ? (
            <Stack.Screen 
              name="AuthScreen" 
              component={Auth} 
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen 
                name="MainApp" 
                component={MainAppTabs} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="CourseDetailsScreen" 
                component={CourseDetails}
                options={{ title: 'Course Details' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}