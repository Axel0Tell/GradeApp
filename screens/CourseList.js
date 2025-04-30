import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import CourseForm from '../components/CourseForm';

const CourseList = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSaveSuccess = () => {
    setShowForm(false);
    setEditingCourse(null);
    fetchCourses();
  };

  const deleteCourse = async (courseId) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      Alert.alert('Error', 'Failed to delete course');
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
      {!showForm ? (
        <>
          <Button 
            title="Add Course" 
            onPress={() => {
              setEditingCourse(null);
              setShowForm(true);
            }}
          />

          <FlatList
            data={courses}
            renderItem={({ item }) => (
              <View style={styles.courseItem}>
                <Text style={styles.courseName}>{item.name}</Text>
                <Text style={styles.courseTerm}>Semester {item.semester}</Text>

                <View style={styles.buttonGroup}>
                  <Button
                    title="Edit"
                    onPress={() => {
                      setEditingCourse(item);
                      setShowForm(true);
                    }}
                  />
                  <Button
                    title="Details"
                    onPress={() => navigation.navigate('CourseDetailsScreen', { courseId: item.id })}
                  />
                  <Button
                    title="Delete"
                    onPress={() => deleteCourse(item.id)}
                  />
                </View>
              </View>
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              !showForm && (
                <Text style={styles.emptyText}>
                  No courses found. Add your first course!
                </Text>
              )
            }
          />
        </>
      ) : (
        <CourseForm
          course={editingCourse}
          onSave={handleSaveSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  courseTerm: {
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default CourseList;
