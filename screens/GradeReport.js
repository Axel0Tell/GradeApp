import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateGPA } from '../utils/gradeUtils';

function GradeReport() {
  const [courses, setCourses] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          //  Redirect to Auth if no token
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from('Courses')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            Alert.alert('Error fetching courses', error.message);
          } else if (data) {
            setCourses(data);
          }
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      }
    };

    fetchCourses();
  }, []);

  const fetchAssignmentsForCourse = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('Assignments')
        .select('*')
        .eq('course_id', courseId);

      if (error) {
        Alert.alert('Error fetching assignments', error.message);
        return [];
      } else if (data) {
        return data;
      }
    } catch (error) {
      Alert.alert('Error', error.message);
      return [];
    }
  };

  const fetchGradingCriteriaForCourse = async (courseId) => {
    //  Simplified:  Assuming you store grading criteria per course
    //  For now, return defaults
    return [
      { category: 'Exam', weight: 40 },
      { category: 'Written Work', weight: 40 },
      { category: 'Attendance', weight: 20 },
    ];
  };


  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Grade Report</Text>
      <FlatList
        data={courses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => {
          return (
            <CourseGradeSummary
              course={item}
              fetchAssignments={fetchAssignmentsForCourse}
              fetchGradingCriteria={fetchGradingCriteriaForCourse}
            />
          );
        }}
      />
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>
        Cumulative GPA: {calculateGPA(courses, fetchAssignmentsForCourse, fetchGradingCriteriaForCourse) || "N/A"}
      </Text>
    </View>
  );
}

const CourseGradeSummary = ({ course, fetchAssignments, fetchGradingCriteria }) => {
  const [average, setAverage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const assignments = await fetchAssignments(course.id);
      const criteria = await fetchGradingCriteria(course.id);
      const courseAverage = calculateCourseAverage(assignments, criteria);
      setAverage(courseAverage);
    };

    loadData();
  }, [course]);

  return (
    <View style={{ marginBottom: 16, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{course.name}</Text>
      <Text>Term: {course.term}</Text>
      <Text>Average Grade: {average !== null ? average.toFixed(2) : 'N/A'}</Text>
    </View>
  );
};

export default GradeReport;