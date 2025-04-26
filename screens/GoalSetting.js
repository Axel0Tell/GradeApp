import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

function GoalSetting() {
  const [courses, setCourses] = useState([]);
  const [goals, setGoals] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchCoursesAndGoals = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          //  Redirect to Auth if no token
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);

          const { data: coursesData, error: coursesError } = await supabase
            .from('Courses')
            .select('*')
            .eq('user_id', user.id);

          if (coursesError) {
            Alert.alert('Error fetching courses', coursesError.message);
          } else if (coursesData) {
            setCourses(coursesData);

            // Fetch goals for these courses
            const { data: goalsData, error: goalsError } = await supabase
              .from('Goals')
              .select('*')
              .in('course_id', coursesData.map(c => c.id));

            if (goalsError) {
              Alert.alert('Error fetching goals', goalsError.message);
            } else if (goalsData) {
              // Organize goals into a map for easier access
              const goalsMap = {};
              goalsData.forEach(goal => {
                goalsMap[goal.course_id] = goal.target_grade;
              });
              setGoals(goalsMap);
            }
          }
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    fetchCoursesAndGoals();
  }, []);

  const saveGoal = async (courseId, targetGrade) => {
    try {
      const { data, error } = await supabase
        .from('Goals')
        .upsert(
          [{ course_id: courseId, target_grade: parseFloat(targetGrade) }],
          { onConflict: ['course_id'] } //  Update if exists, insert if not
        );

      if (error) {
        Alert.alert('Error saving goal', error.message);
      } else if (data) {
        setGoals({ ...goals, [courseId]: parseFloat(targetGrade) });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Goal Setting</Text>
      <FlatList
        data={courses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text>Target Grade:</Text>
              <TextInput
                style={{ height: 40, width: 60, borderColor: 'gray', borderWidth: 1, marginRight: 8, paddingHorizontal: 8 }}
                value={goals[item.id] ? goals[item.id].toString() : ''}
                onChangeText={(text) => saveGoal(item.id, text)}
                keyboardType="numeric"
              />
              {/* Visual indicators (simplified) */}
              {goals[item.id] && <Text>{goals[item.id] > 90 ? '🎉' : ''}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

export default GoalSetting;