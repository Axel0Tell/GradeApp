import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // ✅ updated

const CATEGORIES = [
  { label: 'Exams', value: 'exams' },
  { label: 'Written Work', value: 'written_work' },
  { label: 'Class Participation', value: 'class_participation' },
  { label: 'Attendance', value: 'attendance' },
];

function AssignmentForm({ assignment, onSave, onCancel }) {
  const [title, setTitle] = React.useState(assignment ? assignment.title : '');
  const [grade, setGrade] = React.useState(assignment ? assignment.grade?.toString() : '');
  const [weight, setWeight] = React.useState(assignment ? assignment.weight?.toString() : '');
  const [dueDate, setDueDate] = React.useState(assignment ? assignment.due_date : '');
  const [category, setCategory] = React.useState(assignment ? assignment.category : 'exams');

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
        {assignment ? 'Edit Grade Item' : 'Add Grade Item'}
      </Text>

      <Text style={{ marginBottom: 5 }}>Category:</Text>
      <Picker
        selectedValue={category}
        onValueChange={setCategory}
        style={{ marginBottom: 10 }}
      >
        {CATEGORIES.map((cat) => (
          <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
        ))}
      </Picker>

      <TextInput
        placeholder="Title (e.g., Midterm Exam)"
        value={title}
        onChangeText={setTitle}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
      />
      <TextInput
        placeholder="Grade (0-100)"
        value={grade}
        onChangeText={setGrade}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Weight (%)"
        value={weight}
        onChangeText={setWeight}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Due Date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button title="Cancel" onPress={onCancel} />
        <Button 
          title="Save" 
          onPress={() => onSave({ 
            title, 
            grade: parseFloat(grade) || 0, 
            weight: parseFloat(weight) || 0, 
            dueDate, 
            category 
          })} 
        />
      </View>
    </View>
  );
}

export default AssignmentForm;
