import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity, // Import TouchableOpacity
  Modal,            // Import Modal
} from 'react-native';
import { supabase } from '../services/supabaseService';
import AssignmentForm from '../components/AssignmentForm'; // Assuming you have this component

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59', // Orange/Yellow for highlights, primary actions
  ko: '#d0d0d0',     // Light gray for secondary text, borders
  texts: '#e7c0e4',   // Pinkish for primary text on dark backgrounds
  background: '#2c2c3e', // Dark background for contrast
  cardBackground: '#393952', // Slightly lighter for cards
  danger: '#e74c3c', // For delete actions
  placeholderText: '#a0a0c0', // Lighter text for placeholders or muted info
};

// Simple Icon component (for demonstration, use vector icons for real app)
const Icon = ({ name, size = 20, color = gradeKoColors.texts }) => {
  let iconChar = '';
  switch (name) {
    case 'add': iconChar = '+'; break;
    case 'edit': iconChar = '✎'; break; // Pencil icon
    case 'delete': iconChar = '🗑️'; break; // Trash can icon
    case 'close': iconChar = '✕'; break;
    default: iconChar = '?';
  }
  return <Text style={{ fontSize: size, color: color, marginRight: 5 }}>{iconChar}</Text>;
};


const CourseDetails = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // ... (your existing fetchData, no changes needed here, just ensure it handles errors)
    try {
      setLoading(true);
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (courseError) throw courseError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });
      if (assignmentsError) throw assignmentsError;

      setCourse(courseData);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set navigation options for header (optional, if you want to style the header)
    navigation.setOptions({
      title: course ? course.name : 'Course Details',
      headerStyle: {
        backgroundColor: gradeKoColors.background,
      },
      headerTintColor: gradeKoColors.texts,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [courseId, course]); // Add course to dependency array for title update


  const handleSaveAssignment = async (assignment) => {
    // ... (your existing handleSaveAssignment)
     try {
      setLoading(true); // Show loading indicator during save
      if (editingAssignment) {
        const { error } = await supabase
          .from('assignments')
          .update({
            title: assignment.title,
            grade: assignment.grade,
            weight: assignment.weight,
            due_date: assignment.dueDate,
            category: assignment.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAssignment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('assignments')
          .insert({
            title: assignment.title,
            grade: assignment.grade,
            weight: assignment.weight,
            due_date: assignment.dueDate,
            category: assignment.category,
            course_id: courseId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      await fetchData();
      setShowForm(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error saving assignment:', error);
      Alert.alert('Error', error.message || 'Failed to save assignment');
    } finally {
        setLoading(false);
    }
  };

  const confirmDeleteAssignment = (assignmentId, assignmentTitle) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${assignmentTitle}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAssignment(assignmentId) }
      ]
    );
  };

  const deleteAssignment = async (assignmentId) => {
    // ... (your existing deleteAssignment)
    try {
      setLoading(true);
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      Alert.alert('Error', 'Failed to delete assignment');
    } finally {
        setLoading(false);
    }
  };

  if (loading && !course) { // Only show full screen loader on initial load
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={gradeKoColors.grade} />
        <Text style={{color: gradeKoColors.texts, marginTop: 10}}>Loading Details...</Text>
      </View>
    );
  }
  if (!course) {
    return (
        <View style={[styles.container, styles.loadingContainer]}>
            <Text style={{color: gradeKoColors.texts}}>Could not load course data.</Text>
            <TouchableOpacity onPress={fetchData} style={[styles.button, styles.retryButton, {marginTop: 20}]}>
                <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
  }


  const renderAssignmentItem = ({ item }) => (
    <View style={styles.assignmentItem}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{item.title}</Text>
        <Text style={[styles.assignmentCategory, { color: categoryColor(item.category) }]}>
          {item.category || 'Uncategorized'}
        </Text>
      </View>

      <View style={styles.assignmentDetailsRow}>
        <Text style={styles.assignmentDetailText}>Grade: <Text style={{fontWeight: 'bold', color: gradeKoColors.grade}}>{item.grade !== null ? `${item.grade}%` : '--'}</Text></Text>
        <Text style={styles.assignmentDetailText}>Weight: <Text style={{fontWeight: 'bold'}}>{item.weight}%</Text></Text>
      </View>
      <Text style={[styles.assignmentDetailText, {marginBottom: 10}]}>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : '--'}</Text>


      <View style={styles.assignmentActions}>
        <TouchableOpacity
          style={[styles.iconButton, styles.editButton]}
          onPress={() => {
            setEditingAssignment(item);
            setShowForm(true);
          }}>
          <Icon name="edit" color="white" />
          <Text style={styles.iconButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteButton]}
          onPress={() => confirmDeleteAssignment(item.id, item.title)}>
          <Icon name="delete" color="white" />
          <Text style={styles.iconButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helper function to give categories distinct colors (optional)
  const categoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'exam': return '#3498db';
      case 'written work': return '#2ecc71';
      case 'quiz': return '#f1c40f';
      case 'project': return '#e67e22';
      default: return gradeKoColors.ko;
    }
  };


  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator style={styles.inlineLoader} size="small" color={gradeKoColors.grade} />}
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseTerm}>{course.term}</Text>

        <Text style={styles.sectionTitle}>Weight Distribution:</Text>
        <View style={styles.weightsContainer}>
          {course.exam_weight > 0 && <Text style={styles.weightText}>Exams: {course.exam_weight}%</Text>}
          {course.written_work_weight > 0 && <Text style={styles.weightText}>Written Work: {course.written_work_weight}%</Text>}
          {course.participation_weight > 0 && <Text style={styles.weightText}>Participation: {course.participation_weight}%</Text>}
          {course.attendance_weight > 0 && <Text style={styles.weightText}>Attendance: {course.attendance_weight}%</Text>}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.addAssignmentButton]}
        onPress={() => {
          setEditingAssignment(null);
          setShowForm(true);
        }}>
        <Icon name="add" color="black"/>
        <Text style={[styles.buttonText, {color: 'black'}]}>Add New Assignment</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showForm}
        onRequestClose={() => {
          setShowForm(false);
          setEditingAssignment(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => { setShowForm(false); setEditingAssignment(null); }}>
                <Icon name="close" size={24} color={gradeKoColors.texts} />
            </TouchableOpacity>
            {/* Make sure AssignmentForm is styled to fit this modal and uses GradeKo colors */}
            <AssignmentForm
              assignment={editingAssignment}
              onSave={handleSaveAssignment}
              onCancel={() => {
                setShowForm(false);
                setEditingAssignment(null);
              }}
              // Pass colors to AssignmentForm if it needs them
              // themeColors={gradeKoColors}
            />
          </View>
        </View>
      </Modal>

      <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10}]}>Assignments</Text>
      <FlatList
        data={assignments}
        renderItem={renderAssignmentItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📝</Text>
            <Text style={styles.emptyText}>No assignments yet.</Text>
            <Text style={styles.emptySubText}>Tap "Add New Assignment" to get started!</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: gradeKoColors.background, // Dark background
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineLoader: {
    position: 'absolute',
    top: 80, // Adjust as needed
    left: '50%',
    marginLeft: -12.5, // Half of its size
    zIndex: 10,
  },
  courseHeader: {
    backgroundColor: gradeKoColors.cardBackground, // Card background
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  courseName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: gradeKoColors.texts, // Text color
    marginBottom: 5,
  },
  courseTerm: {
    fontSize: 18,
    color: gradeKoColors.ko, // Secondary text color
    marginBottom: 15,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: gradeKoColors.texts,
    marginBottom: 8,
  },
  weightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weightText: {
    fontSize: 15,
    color: gradeKoColors.ko,
    width: '48%', // Two items per row
    marginBottom: 8,
    backgroundColor: gradeKoColors.background, // Slightly darker pill
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 15,
    textAlign: 'center'
  },
  button: { // General button style
    flexDirection: 'row',
    backgroundColor: gradeKoColors.grade, // Primary action color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25, // More rounded
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  addAssignmentButton: {
    // Specific styles if needed, inherits from 'button'
  },
  retryButton: {
    backgroundColor: gradeKoColors.grade,
  },
  buttonText: {
    color: gradeKoColors.background, // Text on button (dark for contrast with yellow)
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5, // If there's an icon
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: gradeKoColors.cardBackground,
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
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
    padding: 5,
    zIndex: 1,
  },
  assignmentItem: {
    backgroundColor: gradeKoColors.cardBackground,
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 5, // Accent border
    borderLeftColor: gradeKoColors.grade, // Use primary color for accent
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: gradeKoColors.texts,
    flex: 1, // Allow title to take space and wrap
    marginRight: 8,
  },
  assignmentCategory: {
    fontSize: 13,
    fontWeight: '600',
    // color: gradeKoColors.ko, // Set by categoryColor function
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: gradeKoColors.background, // Pill background
  },
  assignmentDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  assignmentDetailText: {
    fontSize: 15,
    color: gradeKoColors.ko,
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: gradeKoColors.background,
    paddingTop: 12,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  iconButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold'
  },
  editButton: {
    backgroundColor: gradeKoColors.grade, // Use a different color or same as primary
  },
  deleteButton: {
    backgroundColor: gradeKoColors.danger, // Specific danger color
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18, // Larger for emoji/main text
    color: gradeKoColors.placeholderText,
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: gradeKoColors.placeholderText,
  }
});

export default CourseDetails;