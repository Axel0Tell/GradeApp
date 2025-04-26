import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, TextInput, Modal, Picker, Alert } from 'react-native';
import { supabase } from '../services/supabaseService';
import { calculateCourseAverage } from '../utils/gradeUtils';

function CourseDetails({ route }) {
  const { courseId, courseName } = route.params;
  const [assignments, setAssignments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentGrade, setAssignmentGrade] = useState('');
  const [assignmentWeight, setAssignmentWeight] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [gradingCriteria, setGradingCriteria] = useState([]); // Array of { category, weight }
  const [newCategory, setNewCategory] = useState('');
  const [newWeight, setNewWeight] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchGradingCriteria();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('Assignments')
        .select('*')
        .eq('course_id', courseId);

      if (error) {
        Alert.alert('Error fetching assignments', error.message);
      } else if (data) {
        setAssignments(data);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const fetchGradingCriteria = async () => {
    //  Simplified:  Assuming you store grading criteria per course (you might need a GradingCriteria table)
    //  For now, let's initialize with defaults
    setGradingCriteria([
      { category: 'Exam', weight: 40 },
      { category: 'Written Work', weight: 40 },
      { category: 'Attendance', weight: 20 },
    ]);
  };

  const openModal = (assignment) => {
    setModalVisible(true);
    if (assignment) {
      setSelectedAssignmentId(assignment.id);
      setAssignmentTitle(assignment.title);
      setAssignmentGrade(assignment.grade.toString());
      setAssignmentWeight(assignment.weight.toString());
      setAssignmentDueDate(assignment.due_date);  //  Handle date formatting if needed
    } else {
      setSelectedAssignmentId(null);
      setAssignmentTitle('');
      setAssignmentGrade('');
      setAssignmentWeight('');
      setAssignmentDueDate('');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const saveAssignment = async () => {
    try {
      if (selectedAssignmentId) {
        const { error } = await supabase
          .from('Assignments')
          .update({
            title: assignmentTitle,
            grade: parseFloat(assignmentGrade),
            weight: parseFloat(assignmentWeight),
            due_date: assignmentDueDate,
          })
          .eq('id', selectedAssignmentId);

        if (error) {
          Alert.alert('Error updating assignment', error.message);
        } else {
          setAssignments(assignments.map(a => a.id === selectedAssignmentId ? { ...a, title: assignmentTitle, grade: parseFloat(assignmentGrade), weight: parseFloat(assignmentWeight), due_date: assignmentDueDate } : a));
          closeModal();
          fetchAssignments(); // Refresh
        }
      } else {
        const { data, error } = await supabase
          .from('Assignments')
          .insert([{
            course_id: courseId,
            title: assignmentTitle,
            grade: parseFloat(assignmentGrade),
            weight: parseFloat(assignmentWeight),
            due_date: assignmentDueDate,
          }]);

        if (error) {
          Alert.alert('Error adding assignment', error.message);
        } else if (data) {
          setAssignments([...assignments, data[0]]);
          closeModal();
          fetchAssignments(); // Refresh
        }
      }
    } catch (error) {
      Alert.alert('Error saving assignment', error.message);
    }
  };

  const deleteAssignment = async (id) => {
    Alert.alert(
      "Delete Assignment",
      "Are you sure you want to delete this assignment?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress:
          async () => {
            try {
              const { error } = await supabase
                .from('Assignments')
                .delete()
                .eq('id', id);

              if (error) {
                Alert.alert('Error deleting assignment', error.message);
              } else {
                setAssignments(assignments.filter(assignment => assignment.id !== id));
                fetchAssignments(); // Refresh
              }
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const addGradingCriterion = () => {
    if (newCategory && newWeight) {
      setGradingCriteria([...gradingCriteria, { category: newCategory, weight: parseFloat(newWeight) }]);
      setNewCategory('');
      setNewWeight('');
    }
  };

  const updateGradingCriterion = (index, weight) => {
    const updatedCriteria = gradingCriteria.map((item, i) =>
      i === index ? { ...item, weight: parseFloat(weight) } : item
    );
    setGradingCriteria(updatedCriteria);
  };

  const deleteGradingCriterion = (index) => {
    const updatedCriteria = gradingCriteria.filter((_, i) => i !== index);
    setGradingCriteria(updatedCriteria);
  };

  const courseAverage = calculateCourseAverage(assignments, gradingCriteria);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>{courseName} Details</Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>Assignments</Text>
      <FlatList
        data={assignments}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text>{item.title} - Grade: {item.grade}, Weight: {item.weight}%</Text>
            <View style={{ flexDirection: 'row' }}>
              <Button title="Edit" onPress={() => openModal(item)} />
              <Button title="Delete" onPress={() => deleteAssignment(item.id)} />
            </View>
          </View>
        )}
      />
      <Button title="Add Assignment" onPress={() => openModal(null)} />

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>Grading Criteria</Text>
      {gradingCriteria.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ marginRight: 8 }}>{item.category}:</Text>
          <TextInput
            style={{ height: 40, width: 50, borderColor: 'gray', borderWidth: 1, marginRight: 8, paddingHorizontal: 4 }}
            value={item.weight.toString()}
            onChangeText={(text) => updateGradingCriterion(index, text)}
            keyboardType="numeric"
          />
          <Text>%</Text>
          <Button title="Delete" onPress={() => deleteGradingCriterion(index)} />
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        <TextInput
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginRight: 8, paddingHorizontal: 8 }}
          placeholder="Category"
          value={newCategory}
          onChangeText={setNewCategory}
        />
        <TextInput
          style={{ height: 40, width: 50, borderColor: 'gray', borderWidth: 1, marginRight: 8, paddingHorizontal: 4 }}
          placeholder="Weight"
          value={newWeight}
          onChangeText={setNewWeight}
          keyboardType="numeric"
        />
        <Button title="Add" onPress={addGradingCriterion} />
      </View>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
        Course Average: {courseAverage !== null ? courseAverage.toFixed(2) : 'N/A'}
      </Text>


      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{selectedAssignmentId ? 'Edit Assignment' : 'Add Assignment'}</Text>
            <TextInput
              placeholder="Title"
              value={assignmentTitle}
              onChangeText={setAssignmentTitle}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
            />
            <TextInput
              placeholder="Grade"
              value={assignmentGrade}
              onChangeText={setAssignmentGrade}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Weight"
              value={assignmentWeight}
              onChangeText={setAssignmentWeight}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
              keyboardType="numeric"
            />
             <TextInput
              placeholder="Due Date (YYYY-MM-DD)"
              value={assignmentDueDate}
              onChangeText={setAssignmentDueDate}
              style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Button title="Cancel" onPress={closeModal} />
              <Button title="Save" onPress={saveAssignment} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default CourseDetails;