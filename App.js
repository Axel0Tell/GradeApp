import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
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

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e',
  cardBackground: '#393952',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainAppTabs() {
  const tabBarBackgroundColor = gradeKoColors.background;
  const activeTintColor = gradeKoColors.grade;
  const inactiveTintColor = gradeKoColors.ko;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Header styling for screens within Tabs
        headerStyle: { backgroundColor: gradeKoColors.background },
        headerTintColor: gradeKoColors.texts,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerBackTitleVisible: false, // If these screens can navigate further back

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'CoursesTab') iconName = focused ? 'book' : 'book-outline';
          else if (route.name === 'GoalsTab') iconName = focused ? 'flag' : 'flag-outline';
          else if (route.name === 'ReportTab') iconName = focused ? 'analytics' : 'analytics-outline';
          else if (route.name === 'ProfileTab') iconName = focused ? 'person-circle' : 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor: tabBarBackgroundColor,
          borderTopColor: gradeKoColors.cardBackground,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="CoursesTab" component={CourseList} options={{ title: 'My Courses' }} />
      <Tab.Screen name="GoalsTab" component={GoalSetting} options={{ title: 'Goals' }} />
      <Tab.Screen name="ReportTab" component={GradeReport} options={{ title: 'Report' }} />
      <Tab.Screen name="ProfileTab" component={Profile} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator
        // TINANGGAL ANG DEFAULT screenOptions DITO
        // screenOptions={{
        //   headerStyle: { backgroundColor: gradeKoColors.background },
        //   headerTintColor: gradeKoColors.texts,
        //   headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        //   headerBackTitleVisible: false,
        // }}
        >
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
                options={{ headerShown: false }} // Itago ang header ng Stack para sa MainAppTabs container
                                                 // Ang header ay per tab na ngayon (defined in Tab.Navigator screenOptions)
              />
              <Stack.Screen
                name="CourseDetailsScreen"
                component={CourseDetails}
                options={({ route }) => ({
                  title: route.params?.courseName || 'Course Details',
                  // Kung gusto mong i-apply ang GradeKo header style DITO LANG:
                  headerStyle: { backgroundColor: gradeKoColors.background },
                  headerTintColor: gradeKoColors.texts,
                  headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
                  headerBackTitleVisible: false,
                })}
              />
              {/* Kung may iba ka pang Stack screens, dito mo rin ilalagay ang specific header options nila kung kailangan */}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}