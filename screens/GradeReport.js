import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { supabase } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';
import { calculateCourseAverage, getLetterGrade, getGradeColor } from '../utils/gradeUtils';

function GradeReport() {
  const { theme } = useTheme();
  const [courses, setCourses] = useState([]);
  const [averages, setAverages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, semester, exam_weight, written_work_weight, participation_weight, attendance_weight')
          .eq('user_id', user.id);
        
        if (coursesError) throw coursesError;

        // Get all assignments for these courses
        const courseIds = coursesData.map(c => c.id);
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, course_id, grade, weight, category')
          .in('course_id', courseIds);

        if (assignmentsError) throw assignmentsError;

        setCourses(coursesData || []);

        // Calculate averages for each course
        const newAverages = {};
        coursesData.forEach(course => {
          const courseAssignments = assignmentsData.filter(a => a.course_id === course.id);
          
          const gradingCriteria = [
            { category: 'exams', weight: course.exam_weight },
            { category: 'written_work', weight: course.written_work_weight },
            { category: 'class_participation', weight: course.participation_weight },
            { category: 'attendance', weight: course.attendance_weight }
          ];
          
          newAverages[course.id] = calculateCourseAverage(courseAssignments, gradingCriteria);
        });
        
        setAverages(newAverages);
      } catch (error) {
        console.error('Error:', error.message);
        Alert.alert('Error', 'Failed to load grade report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Grade Report</Text>
      
      {courses.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No courses found. Add courses to see your grade report.
        </Text>
      ) : (
        <FlatList
          data={courses}
          renderItem={({ item }) => {
            const average = averages[item.id];
            const letterGrade = average ? getLetterGrade(average) : 'N/A';
            const gradeColor = average ? getGradeColor(average) : theme.text;
            
            return (
              <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.courseName, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.text }}>Semester: {item.semester}</Text>
                
                {average !== undefined ? (
                  <>
                    <Text style={[styles.gradeText, { color: gradeColor }]}>
                      Current Average: {average?.toFixed(1)}% ({letterGrade})
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${average}%`,
                            backgroundColor: gradeColor
                          }
                        ]}
                      />
                    </View>
                  </>
                ) : (
                  <Text style={{ color: theme.text }}>No grades recorded yet</Text>
                )}
              </View>
            );
          }}
          keyExtractor={item => item.id.toString()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16
  },
  card: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  }
});

export default GradeReport;