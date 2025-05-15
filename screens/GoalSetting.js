import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList, // Import FlatList
  Platform, // Import Platform for OS-specific styling
  ImageBackground, 
  // ImageBackground, // Optional: Uncomment if you want to use an image background
} from 'react-native';
import { supabase } from '../services/supabaseService';

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e',
  cardBackground: '#393952',
  placeholderText: '#a0a0c0',
  inputBackground: '#252535', // Slightly different for input if needed
  success: '#2ecc71', // For positive feedback or highlights
};

// Simple Icon (Optional, for visual flair)
const Icon = ({ name, size = 20, color = gradeKoColors.texts, style }) => {
  let iconChar = '';
  switch (name) {
    case 'goal': iconChar = '🎯'; break;
    case 'course': iconChar = '📚'; break;
    case 'info': iconChar = 'ℹ️'; break;
    default: iconChar = '?';
  }
  return <Text style={[{ fontSize: size, color: color }, style]}>{iconChar}</Text>;
};


const GoalSetting = ({ navigation }) => { // Added navigation prop for header styling
  const [courses, setCourses] = useState([]);
  const [goals, setGoals] = useState({}); // { course_id: target_grade }
  const [loading, setLoading] = useState(true);
  const [savingGoalFor, setSavingGoalFor] = useState(null); // To show inline loader per item

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, semester, exam_weight, written_work_weight, participation_weight, attendance_weight')
        .eq('user_id', user.id)
        .order('name', { ascending: true }); // Order by name

      if (coursesError) throw coursesError;

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
      console.error('Error fetching data:', error);
      Alert.alert('Error', error.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Style the header
    navigation.setOptions({
        title: 'Set Grade Goals',
        headerStyle: {
          backgroundColor: gradeKoColors.background,
        },
        headerTintColor: gradeKoColors.texts,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      });
  }, [navigation]);

  const handleGoalChange = (courseId, textValue) => {
    // Allow empty string for clearing, or numbers up to 100
    if (textValue === '' || (/^\d{0,3}$/.test(textValue) && parseInt(textValue, 10) <= 100) || (textValue.length <=3 && textValue.endsWith('.'))) {
        // Store textValue directly to allow intermediate states like "9."
        setGoals(prev => ({ ...prev, [courseId]: textValue }));
    } else if (parseInt(textValue, 10) > 100) {
        setGoals(prev => ({ ...prev, [courseId]: '100' }));
    }
  };

  const saveGoal = async (courseId) => {
    const gradeString = goals[courseId]?.toString() || '';
    // Validate before saving
    if (gradeString === '') { // If user clears the input, maybe save as null or don't save
        // Decide if clearing means deleting the goal or setting target to null
        // For now, let's assume clearing means no specific goal to save yet for this interaction
        console.log(`Goal for course ${courseId} is empty, not saving.`);
        return;
    }

    const numGrade = parseFloat(gradeString);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      Alert.alert('Invalid Grade', 'Target grade must be between 0 and 100.');
      // Optionally revert to old value or clear
      // fetchData(); // Revert to last saved state
      return;
    }

    setSavingGoalFor(courseId); // Show inline loader
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');

      const { error } = await supabase
        .from('goals')
        .upsert(
          { course_id: courseId, target_grade: numGrade, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'course_id,user_id' }
        );

      if (error) throw error;
      // Update local state accurately after successful save (with the parsed number)
      setGoals(prev => ({ ...prev, [courseId]: numGrade }));
      // Alert.alert('Success', 'Goal saved!'); // Optional: feedback
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('Error', error.message || 'Failed to save goal');
      fetchData();
    } finally {
      setSavingGoalFor(null);
    }
  };

  const renderCourseGoalItem = ({ item: course }) => (
    <View style={styles.courseCard}>
      <View style={styles.courseInfoContainer}>
        <Icon name="course" size={22} color={gradeKoColors.grade} style={{ marginRight: 10, marginTop: 2 }} />
        <View style={{flex: 1}}>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseSemester}>
            {course.semester ? `Semester ${course.semester}` : 'Semester N/A'}
            </Text>
        </View>
      </View>

       <View style={styles.weightsSection}>
        <Text style={styles.weightsTitle}>Weights:</Text>
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
        <Icon name="goal" size={24} color={gradeKoColors.grade} style={{ marginRight: 10 }}/>
        <Text style={styles.goalLabel}>Target Grade:</Text>
        <TextInput
          value={goals[course.id]?.toString() || ''} // Ensure it's always a string for TextInput
          onChangeText={text => handleGoalChange(course.id, text)}
          onBlur={() => saveGoal(course.id)} // Save on blur
          keyboardType="numeric" // "decimal-pad" if you allow decimals
          style={styles.goalInput}
          placeholder="0-100"
          placeholderTextColor={gradeKoColors.placeholderText}
          maxLength={3} // Max 3 digits (e.g., 100)
          returnKeyType="done" // Changes keyboard 'return' to 'done'
          onSubmitEditing={() => saveGoal(course.id)} // Save on submit from keyboard
        />
        <Text style={styles.percentSymbol}>%</Text>
        {savingGoalFor === course.id && <ActivityIndicator size="small" color={gradeKoColors.grade} style={{marginLeft: 10}} />}
      </View>
    </View>
  );

  if (loading && courses.length === 0) {
      return (
        <ImageBackground
          source={require('../assets/bg.png')} // <-- BACKGROUND IMAGE HERE TOO
          style={styles.backgroundImageContainer}
          resizeMode="cover"
        >
          <View style={[styles.contentOverlayContainer, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={gradeKoColors.grade} />
            <Text style={{ color: gradeKoColors.texts, marginTop: 10 }}>Loading Courses...</Text>
          </View>
        </ImageBackground>
      );
    }
  
    

  return (
      <ImageBackground
        source={require('../assets/bg.png')} // <-- BACKGROUND IMAGE FOR THE MAIN VIEW
        style={styles.backgroundImageContainer}
        resizeMode="cover"
      >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Icon name="goal" size={28} color={gradeKoColors.grade} style={{marginRight: 10}} />
          <Text style={styles.header}>Set Your Grade Goals</Text>
        </View>
        <Text style={styles.subHeader}>Enter your desired final grade for each course below. This will help track your progress.</Text>
        
        <FlatList
          data={courses}
          renderItem={renderCourseGoalItem}
          keyExtractor={course => course.id.toString()}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                  <Icon name="info" size={40} color={gradeKoColors.placeholderText} style={{marginBottom:15}} />
                  <Text style={styles.emptyText}>No courses available.</Text>
                  <Text style={styles.emptySubText}>Please add courses in the 'My Courses' tab first to set goals.</Text>
              </View>
            )
          }
          contentContainerStyle={courses.length === 0 ? { flex: 1, justifyContent: 'center' } : {paddingBottom: 20}}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImageContainer: { flex: 1 }, // Uncomment if using ImageBackground
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: gradeKoColors.background, // Dark background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: gradeKoColors.background, // Match theme
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  header: {
    fontSize: 24, // Larger header
    fontWeight: 'bold',
    color: gradeKoColors.texts,
  },
  subHeader: {
    fontSize: 15,
    color: gradeKoColors.ko,
    marginBottom: 25, // More space after subheader
    lineHeight: 22,
  },
  courseCard: {
    backgroundColor: gradeKoColors.cardBackground,
    padding: 20, // More padding
    marginBottom: 18, // More space between cards
    borderRadius: 12, // More rounded
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  courseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 19, // Slightly larger course name
    fontWeight: 'bold', // Bold
    color: gradeKoColors.texts,
    marginBottom: 4,
  },
  courseSemester: {
    fontSize: 14,
    color: gradeKoColors.ko,
    fontStyle: 'italic',
  },
  // Optional Weights display styles
  weightsSection: {
      marginTop: 10,
      marginBottom: 5,
      borderTopWidth: 1,
      borderTopColor: gradeKoColors.background,
      paddingTop: 10,
  },
  weightsTitle: {
      fontSize: 13,
      color: gradeKoColors.ko,
      marginBottom: 5,
      fontWeight: '600'
  },
  weightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  weightText: {
    fontSize: 12,
    color: gradeKoColors.ko,
    width: '48%', // Ensure they fit
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // More space before goal input
    backgroundColor: gradeKoColors.inputBackground, // Background for the whole input row
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gradeKoColors.ko,
  },
  goalLabel: {
    fontSize: 16,
    color: gradeKoColors.texts,
    marginRight: 8,
    fontWeight: '600',
  },
  goalInput: {
    flex: 1,
    // backgroundColor: gradeKoColors.background, // Input field itself can have a bg
    color: gradeKoColors.texts,
    // borderWidth: 1, // Border can be on container or input
    // borderColor: gradeKoColors.ko,
    // borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6, // Adjust padding for OS
    fontSize: 16,
    textAlign: 'center',
  },
  percentSymbol: {
    fontSize: 16,
    color: gradeKoColors.texts,
    marginLeft: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: gradeKoColors.placeholderText,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: gradeKoColors.placeholderText,
    lineHeight: 20,
  }
});

export default GoalSetting;