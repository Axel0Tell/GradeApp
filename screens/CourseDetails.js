import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import AssignmentForm from '../components/AssignmentForm';

const CourseDetails = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Get assignments for this course
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
      Alert.alert('Error', 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const handleSaveAssignment = async (assignment) => {
    try {
      if (editingAssignment) {
        // Update existing assignment
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
        // Create new assignment
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
    }
  };

  const deleteAssignment = async (assignmentId) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      Alert.alert('Error', 'Failed to delete assignment');
    }
  };

  if (loading || !course) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.courseHeader}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseTerm}>{course.term}</Text>
        
        <View style={styles.weightsContainer}>
          <Text style={styles.weightText}>Exams: {course.exam_weight}%</Text>
          <Text style={styles.weightText}>Written Work: {course.written_work_weight}%</Text>
          <Text style={styles.weightText}>Participation: {course.participation_weight}%</Text>
          <Text style={styles.weightText}>Attendance: {course.attendance_weight}%</Text>
        </View>
      </View>

      <Button
        title="Add Assignment"
        onPress={() => {
          setEditingAssignment(null);
          setShowForm(true);
        }}
        style={styles.addButton}
      />

      {showForm && (
        <AssignmentForm
          assignment={editingAssignment}
          onSave={handleSaveAssignment}
          onCancel={() => {
            setShowForm(false);
            setEditingAssignment(null);
          }}
        />
      )}

      <FlatList
        data={assignments}
        renderItem={({ item }) => (
          <View style={styles.assignmentItem}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.assignmentTitle}>{item.title}</Text>
              <Text style={styles.assignmentCategory}>{item.category}</Text>
            </View>
            
            <View style={styles.assignmentDetails}>
              <Text>Grade: {item.grade || '--'}%</Text>
              <Text>Weight: {item.weight}%</Text>
              <Text>Due: {item.due_date || '--'}</Text>
            </View>
            
            <View style={styles.assignmentActions}>
              <Button
                title="Edit"
                onPress={() => {
                  setEditingAssignment(item);
                  setShowForm(true);
                }}
                color="#007AFF"
              />
              <Button
                title="Delete"
                onPress={() => deleteAssignment(item.id)}
                color="#FF3B30"
              />
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assignments yet. Add your first assignment!</Text>
        }
      />
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
  courseHeader: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  courseName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4
  },
  courseTerm: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12
  },
  weightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  weightText: {
    fontSize: 14,
    color: '#444',
    width: '48%',
    marginBottom: 4
  },
  addButton: {
    marginBottom: 16
  },
  assignmentItem: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  assignmentCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize'
  },
  assignmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  assignmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  }
});

export default CourseDetails;