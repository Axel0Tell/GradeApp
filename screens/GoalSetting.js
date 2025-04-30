import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';

const GoalSetting = () => {
  const [courses, setCourses] = useState([]);
  const [goals, setGoals] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');

      // Get current user's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, semester, exam_weight, written_work_weight, participation_weight, attendance_weight')
        .eq('user_id', user.id);

      if (coursesError) throw coursesError;

      // Get existing goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('course_id, target_grade')
        .eq('user_id', user.id);

      if (goalsError) throw goalsError;

      setCourses(coursesData || []);

      const goalsMap = {};
      goalsData?.forEach(g => goalsMap[g.course_id] = g.target_grade);
      setGoals(goalsMap);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', error.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveGoal = async (courseId, grade) => {
    const numGrade = parseFloat(grade);
    if (isNaN(numGrade)) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');

      const { error } = await supabase
        .from('goals')
        .upsert(
          {
            course_id: courseId,
            target_grade: numGrade,
            user_id: user.id,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'course_id,user_id' }
        );

      if (error) throw error;
      
      setGoals(prev => ({ ...prev, [courseId]: numGrade }));
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', error.message || 'Failed to save goal');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Set Grade Goals</Text>
      <Text style={styles.subHeader}>Enter your target grade for each course</Text>
      
      {courses.map(course => (
        <View key={course.id} style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseSemester}>Semester {course.semester}</Text>
            <View style={styles.weightsRow}>
              <Text style={styles.weightText}>Exams: {course.exam_weight}%</Text>
              <Text style={styles.weightText}>Written: {course.written_work_weight}%</Text>
            </View>
            <View style={styles.weightsRow}>
              <Text style={styles.weightText}>Participation: {course.participation_weight}%</Text>
              <Text style={styles.weightText}>Attendance: {course.attendance_weight}%</Text>
            </View>
          </View>
          
          <View style={styles.goalInputContainer}>
            <Text style={styles.goalLabel}>Target Grade:</Text>
            <TextInput
              value={goals[course.id]?.toString() || ''}
              onChangeText={text => {
                const num = parseFloat(text) || 0;
                setGoals({ ...goals, [course.id]: num });
              }}
              onBlur={() => saveGoal(course.id, goals[course.id])}
              keyboardType="numeric"
              style={styles.goalInput}
              placeholder="Enter target %"
              maxLength={3}
            />
            <Text style={styles.percentSymbol}>%</Text>
          </View>
        </View>
      ))}
      
      {courses.length === 0 && (
        <Text style={styles.emptyText}>No courses found. Add courses first.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  subHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  courseCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  courseHeader: {
    marginBottom: 12
  },
  courseName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  courseSemester: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  weightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  weightText: {
    fontSize: 12,
    color: '#666'
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  goalLabel: {
    fontSize: 16,
    marginRight: 8
  },
  goalInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 4
  },
  percentSymbol: {
    fontSize: 16
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  }
});

export default GoalSetting;