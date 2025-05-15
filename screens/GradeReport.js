import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  // ImageBackground, // Optional
} from 'react-native';
import { supabase } from '../services/supabaseService';
// import { useTheme } from '../contexts/ThemeContext'; // Pwede nating i-override o i-combine
import { calculateCourseAverage, getLetterGrade /*, getGradeColor */ } from '../utils/gradeUtils'; // I-a-adjust natin ang getGradeColor

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59', // Primary highlight
  ko: '#d0d0d0',     // Secondary text, borders
  texts: '#e7c0e4',   // Main text on dark
  background: '#2c2c3e',
  cardBackground: '#393952',
  placeholderText: '#a0a0c0',
  // Colors for grades (can be adjusted)
  gradeExcellent: '#2ecc71', // Green for A
  gradeGood: '#3498db',     // Blue for B
  gradeAverage: '#f1c40f',   // Yellow for C
  gradePoor: '#e67e22',      // Orange for D
  gradeFail: '#e74c3c',      // Red for F
  progressBarBackground: '#252535', // Darker background for progress bar track
};

// Custom getGradeColor function using gradeKoColors
const getCustomGradeColor = (average) => {
  if (average === null || average === undefined) return gradeKoColors.ko; // Default color for N/A
  if (average >= 90) return gradeKoColors.gradeExcellent;
  if (average >= 80) return gradeKoColors.gradeGood;
  if (average >= 70) return gradeKoColors.gradeAverage; // Or use gradeKoColors.grade for C to match theme
  if (average >= 60) return gradeKoColors.gradePoor;
  return gradeKoColors.gradeFail;
};

// Simple Icon (Optional, for visual flair)
const Icon = ({ name, size = 20, color = gradeKoColors.texts, style }) => {
  let iconChar = '';
  switch (name) {
    case 'report': iconChar = '📊'; break;
    case 'course': iconChar = '📚'; break;
    case 'info': iconChar = 'ℹ️'; break;
    default: iconChar = '?';
  }
  return <Text style={[{ fontSize: size, color: color }, style]}>{iconChar}</Text>;
};


function GradeReport({ navigation }) { // Added navigation for header styling
  // const { theme } = useTheme(); // We'll primarily use gradeKoColors
  const [courses, setCourses] = useState([]);
  const [averages, setAverages] = useState({}); // { course_id: average }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // ... (fetchData logic from your code, no major changes needed here)
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // Or throw error

        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, semester, exam_weight, written_work_weight, participation_weight, attendance_weight')
          .eq('user_id', user.id)
          .order('name', { ascending: true });
        
        if (coursesError) throw coursesError;

        const courseIds = coursesData.map(c => c.id);
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select('id, course_id, grade, weight, category')
          .in('course_id', courseIds);

        if (assignmentsError) throw assignmentsError;

        setCourses(coursesData || []);

        const newAverages = {};
        coursesData.forEach(course => {
          const courseAssignments = assignmentsData.filter(a => a.course_id === course.id);
          const gradingCriteria = [ // Ensure these categories match your assignment categories
            { category: 'exams', weight: course.exam_weight },
            { category: 'written_work', weight: course.written_work_weight },
            { category: 'class_participation', weight: course.participation_weight },
            { category: 'attendance', weight: course.attendance_weight },
            // Add 'quiz', 'project' if they are part of grading criteria from courses table
            // or adjust calculateCourseAverage to handle any category present in assignments
          ];
          newAverages[course.id] = calculateCourseAverage(courseAssignments, gradingCriteria);
        });
        setAverages(newAverages);
      } catch (error) {
        console.error('Error fetching grade report:', error.message);
        Alert.alert('Error', 'Failed to load grade report. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Optional: Style the header
    navigation.setOptions({
        title: 'Grade Report',
        headerStyle: {
          backgroundColor: gradeKoColors.background,
        },
        headerTintColor: gradeKoColors.texts,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      });

  }, [navigation]);

  const renderCourseReportCard = ({ item: course }) => {
    const average = averages[course.id];
    const letterGrade = (average !== null && average !== undefined) ? getLetterGrade(average) : 'N/A';
    const gradeColor = getCustomGradeColor(average); // Use our custom color function

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Icon name="course" size={22} color={gradeKoColors.grade} style={{marginRight: 10}}/>
            <View style={{flex:1}}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseSemester}>
                    {course.semester ? `Semester ${course.semester}` : 'Semester N/A'}
                </Text>
            </View>
        </View>

        {average !== null && average !== undefined ? (
          <>
            <Text style={[styles.averageLabel, { color: gradeKoColors.ko }]}>Current Average:</Text>
            <View style={styles.averageValueContainer}>
                <Text style={[styles.averageGradeText, { color: gradeColor }]}>
                {average.toFixed(1)}%
                </Text>
                <Text style={[styles.letterGradeText, { backgroundColor: gradeColor, color: gradeColor === gradeKoColors.gradeAverage ? gradeKoColors.background : 'white' }]}>
                {letterGrade}
                </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(Math.max(average, 0), 100)}%`, // Clamp between 0 and 100
                      backgroundColor: gradeColor,
                    },
                  ]}
                />
              </View>
            </View>
          </>
        ) : (
          <Text style={[styles.noGradesText, { color: gradeKoColors.placeholderText }]}>
            <Icon name="info" size={16} color={gradeKoColors.placeholderText} style={{marginRight: 5}}/>
            No grades recorded yet for this course.
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={gradeKoColors.grade} />
        <Text style={{color: gradeKoColors.texts, marginTop: 10}}>Generating Report...</Text>
      </View>
    );
  }

  return (
    // <ImageBackground source={require('../assets/bg.png')} style={styles.backgroundImageContainer} resizeMode="cover">
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Icon name="report" size={28} color={gradeKoColors.grade} style={{marginRight:10}}/>
        <Text style={styles.title}>Your Grade Report</Text>
      </View>
      <Text style={styles.subTitle}>Overview of your academic performance per course.</Text>

      {courses.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
            <Icon name="info" size={40} color={gradeKoColors.placeholderText} style={{marginBottom:15}}/>
            <Text style={styles.emptyText}>No Courses Found</Text>
            <Text style={styles.emptySubText}>Add courses and record grades to see your report.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseReportCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
    // </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // backgroundImageContainer: { flex: 1 }, // Uncomment if using ImageBackground
  container: {
    flex: 1,
    paddingHorizontal: 16, // Horizontal padding only
    paddingTop: 20, // Add top padding
    backgroundColor: gradeKoColors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: gradeKoColors.background, // Ensure loading bg matches
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 5, // Align with card content
  },
  title: {
    fontSize: 26, // Larger title
    fontWeight: 'bold',
    color: gradeKoColors.texts,
  },
  subTitle: {
      fontSize: 15,
      color: gradeKoColors.ko,
      marginBottom: 25,
      paddingHorizontal: 5,
      lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: gradeKoColors.placeholderText,
    marginBottom: 10,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: gradeKoColors.placeholderText,
    lineHeight: 20,
  },
  card: {
    backgroundColor: gradeKoColors.cardBackground,
    padding: 20,
    marginBottom: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start if text wraps
    marginBottom: 12,
  },
  courseName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: gradeKoColors.texts,
    marginBottom: 3,
    flexShrink: 1, // Allow name to wrap
  },
  courseSemester: {
    fontSize: 14,
    color: gradeKoColors.ko,
    fontStyle: 'italic',
  },
  averageLabel: {
    fontSize: 14,
    color: gradeKoColors.ko,
    marginBottom: 4,
  },
  averageValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline', // Align based on text baseline
    marginBottom: 10,
  },
  averageGradeText: {
    fontSize: 28, // Make average grade prominent
    fontWeight: 'bold',
    // color is set dynamically
  },
  letterGradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 15, // Pill shape
    marginLeft: 10,
    color: 'white', // Default text color for letter grade pill
    overflow: 'hidden', // Ensure borderRadius is respected
    textAlign: 'center',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10, // Slightly thicker progress bar
    backgroundColor: gradeKoColors.progressBarBackground, // Darker track
    borderRadius: 5,
    overflow: 'hidden', // Important for borderRadius on the fill
  },
  progressFill: {
    height: '100%',
    borderRadius: 5, // Match parent
    // backgroundColor is set dynamically
  },
  noGradesText: {
    fontSize: 15,
    color: gradeKoColors.placeholderText,
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  }
});

export default GradeReport;