import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, Modal, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

function CourseList({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseTerm, setCourseTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          navigation.replace('Auth'); // Redirect to Auth if no token
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

  const openModal = (course) => {
    setModalVisible(true);
    if (course) {
      setSelectedCourseId(course.id);
      setCourseName(course.name);
      setCourseTerm(course.term);
    } else {
      setSelectedCourseId(null);
      setCourseName('');
      setCourseTerm('');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const saveCourse = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'User not authenticated.');
        return;
      }

      if (selectedCourseId) {
        const { error } = await supabase
          .from('Courses')
          .update({ name: courseName, term: courseTerm })
          .eq('id', selectedCourseId);

        if (error) {
          Alert.alert('Error updating course', error.message);
        } else {
          setCourses(courses.map(c => c.id === selectedCourseId ? { ...c, name: courseName, term: courseTerm } : c));
          closeModal();
        }
      } else {
        const { data, error } = await supabase
          .from('Courses')
          .insert([{ user_id: userId, name: courseName, term: courseTerm }]);

        if (error) {
          Alert.alert('Error adding course', error.message);
        } else if (data) {
          setCourses([...courses, data[0]]);
          closeModal();
        }
      }
    } catch (error) {
      Alert.alert('Error saving course', error.message);
    }
  };

  const deleteCourse = async (id) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('Courses')
                .delete()
                .eq('id', id);

              if (error) {
                Alert.alert('Error deleting course', error.message);
              } else {
                setCourses(courses.filter(course => course.id !== id));
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Courses</Text>
      <FlatList
        data={courses}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text onPress={() => navigation.navigate('CourseDetails', { courseId: item.id, courseName: item.name })}>{item.name} ({item.term})</Text>
            <View style={{ flexDirection: 'row' }}>
              <Button title="Edit" onPress={() => openModal(item)} />
              <Button title="Delete" onPress={() => deleteCourse(item.id)} />
            </View>
          </View>
        )}
      />
      <Button title="Add Course" onPress={() => openModal(null)} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{selectedCourseId ? 'Edit Course' : 'Add Course'}</Text>
            <TextInput
              placeholder="Course Name"
              value={courseName}
              onChangeText={setCourseName}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
            />
            <TextInput
              placeholder="Term"
              value={courseTerm}
              onChangeText={setCourseTerm}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Button title="Cancel" onPress={closeModal} />
              <Button title="Save" onPress={saveCourse} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default CourseList;