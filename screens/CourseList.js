import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  ImageBackground, // <-- IMPORT IMAGEBACKGROUND
} from 'react-native';
import { supabase } from '../services/supabaseService';
import CourseForm from '../components/CourseForm';

// GradeKo Colors (same as before)
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e', // We'll use ImageBackground now
  cardBackground: '#393952', // Keep card background for contrast
  danger: '#e74c3c',
  success: '#2ecc71',
  placeholderText: '#a0a0c0',
  overlay: 'rgba(44, 44, 62, 0.7)', // Optional overlay for better text readability on bg image
};

// Simple Icon component (reuse or use vector icons)
const Icon = ({ name, size = 20, color = gradeKoColors.texts, style }) => {
  let iconChar = '';
  switch (name) {
    case 'add': iconChar = '+'; break;
    case 'edit': iconChar = '✏️'; break;
    case 'delete': iconChar = '🗑️'; break;
    case 'details': iconChar = 'ℹ️'; break;
    case 'close': iconChar = '✕'; break;
    case 'course': iconChar = '📚'; break;
    default: iconChar = '?';
  }
  return <Text style={[{ fontSize: size, color: color, marginRight: 5 }, style]}>{iconChar}</Text>;
};

const CourseList = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const fetchCourses = async () => {
    // ... (fetchCourses logic remains the same)
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Authentication Error", "User not found. Please log in again.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();

    navigation.setOptions({
      title: 'My Courses',
      headerStyle: {
        backgroundColor: gradeKoColors.cardBackground, // Or a solid dark color if bg image is too busy for header
      },
      headerTintColor: gradeKoColors.grade,
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 20,
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            setEditingCourse(null);
            setShowForm(true);
          }}
          style={{ marginRight: 15, padding: 5 }}
        >
          <Icon name="add" size={28} color={gradeKoColors.grade} />
        </TouchableOpacity>
      ),
      // Optional: Make header transparent to show background image behind it
      // headerTransparent: true,
      // headerBackground: () => (
      //   <View style={{ flex: 1, backgroundColor: 'rgba(44, 44, 62, 0.8)' }} /> // Semi-transparent header bg
      // ),
    });
  }, [navigation]);

  const handleSaveSuccess = () => {
    // ... (handleSaveSuccess logic remains the same)
    setShowForm(false);
    setEditingCourse(null);
    fetchCourses();
  };

  const confirmDeleteCourse = (courseId, courseName) => {
    // ... (confirmDeleteCourse logic remains the same)
     Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the course "${courseName}" and all its assignments? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteCourse(courseId) }
      ]
    );
  };

  const deleteCourse = async (courseId) => {
    // ... (deleteCourse logic remains the same)
    try {
      setLoading(true);
      const { error: assignmentsError } = await supabase
        .from('assignments')
        .delete()
        .eq('course_id', courseId);

      if (assignmentsError) {
        console.warn('Could not delete assignments for course, proceeding with course deletion:', assignmentsError.message);
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      Alert.alert('Success', 'Course deleted successfully.');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      Alert.alert('Error', error.message || 'Failed to delete course.');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.courseItem}
      onPress={() => navigation.navigate('CourseDetailsScreen', { courseId: item.id })}
    >
      <View style={styles.courseItemHeader}>
        <Icon name="course" size={24} color={gradeKoColors.grade} style={{marginRight: 10}}/>
        <View style={{flex: 1}}>
          <Text style={styles.courseName}>{item.name}</Text>
          <Text style={styles.courseTerm}>
            {item.term || (item.semester ? `Semester ${item.semester}` : 'No term/semester')}
          </Text>
        </View>
      </View>

      {/* --- AYUSIN NATIN ITONG BUTTON GROUP --- */}
      <View style={styles.buttonGroup}>
        {/* DETAILS BUTTON */}
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => navigation.navigate('CourseDetailsScreen', { courseId: item.id })}
        >
          <Icon name="details" size={16} color={gradeKoColors.buttonTextDark} /> 
          {/* Pinalitan ko color para contrast sa success background */}
          <Text style={[styles.actionButtonText, {color: gradeKoColors.buttonTextDark}]}>Details</Text>
        </TouchableOpacity>

        {/* EDIT BUTTON - IBALIK NATIN */}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card press from firing
            setEditingCourse(item);
            setShowForm(true);
          }}
        >
          <Icon name="edit" size={16} color={gradeKoColors.buttonTextDark} /> 
          {/* Pinalitan ko color para contrast sa grade background */}
          <Text style={[styles.actionButtonText, {color: gradeKoColors.buttonTextDark}]}>Edit</Text>
        </TouchableOpacity>

        {/* DELETE BUTTON - IBALIK NATIN NG TAMA */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card press from firing
            confirmDeleteCourse(item.id, item.name);
          }}
        >
          <Icon name="delete" size={16} color={gradeKoColors.buttonTextLight} /> 
          {/* White text for danger background */}
          <Text style={[styles.actionButtonText, {color: gradeKoColors.buttonTextLight}]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
      <View style={styles.contentOverlayContainer}> {/* This View can have a semi-transparent overlay if needed */}
        {loading && courses.length > 0 && <ActivityIndicator style={styles.inlineLoader} size="small" color={gradeKoColors.grade} />}

        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={item => item.id.toString()}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyContainer}>
                <Icon name="course" size={60} color={gradeKoColors.placeholderText} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyText}>No courses here yet!</Text>
                <Text style={styles.emptySubText}>Tap the '+' icon in the header to add your first course.</Text>
              </View>
            )
          }
          contentContainerStyle={courses.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
          refreshing={loading}
          onRefresh={fetchCourses}
          // Add some padding to the top if header is not transparent, to avoid content starting under header
          // For example, if using non-transparent header:
          // ListHeaderComponent={<View style={{height: 10}} />} // Small space at the top
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={showForm}
          onRequestClose={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => { setShowForm(false); setEditingCourse(null); }}>
                <Icon name="close" size={24} color={gradeKoColors.texts} />
              </TouchableOpacity>
              <CourseForm
                course={editingCourse}
                onSave={handleSaveSuccess}
                onCancel={() => {
                  setShowForm(false);
                  setEditingCourse(null);
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImageContainer: { // Style for the ImageBackground component
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentOverlayContainer: { // This will hold the actual content on top of the image
    flex: 1,
    // Optional: Add a semi-transparent overlay to improve text readability over the image
    // backgroundColor: gradeKoColors.overlay, // Example: 'rgba(44, 44, 62, 0.7)'
    // Padding should be here if the overlay is used, or directly on FlatList/components
    // paddingTop: 10, // Example if header is transparent or for general spacing
  },
  loadingContainer: { // This style is now applied to a View INSIDE ImageBackground
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is removed, it will be on top of the ImageBackground
    // flex:1 is important if this is the only child of contentOverlayContainer
  },
  inlineLoader: {
    position: 'absolute',
    top: 10, // Adjust if you have a transparent header
    alignSelf: 'center',
    zIndex: 10,
  },
  // Modal styles remain the same as they float on top
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: gradeKoColors.cardBackground,
    padding: 20,
    paddingTop: 40,
    borderRadius: 15,
    width: '90%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 1,
  },
  courseItem: {
    backgroundColor: gradeKoColors.cardBackground, // Cards should still have their distinct background
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: gradeKoColors.grade,
  },
  courseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: gradeKoColors.texts,
    flexShrink: 1,
  },
  courseTerm: {
    fontSize: 14,
    color: gradeKoColors.ko,
    marginTop: 2,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)', // Lighter separator for dark cards
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: gradeKoColors.success,
  },
  editButton: { // Button text color should contrast with button background
    backgroundColor: gradeKoColors.grade,
  },
  deleteButton: {
    backgroundColor: gradeKoColors.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // No background color here, will show the ImageBackground or overlay
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    color: gradeKoColors.texts, // Make empty text more visible on image/overlay
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: gradeKoColors.ko, // Lighter text for subtext
  },
});

export default CourseList;