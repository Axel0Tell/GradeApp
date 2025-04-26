import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

function AssignmentForm({ assignment, onSave, onCancel }) {
  const [title, setTitle] = React.useState(assignment ? assignment.title : '');
  const [grade, setGrade] = React.useState(assignment ? assignment.grade.toString() : '');
  const [weight, setWeight] = React.useState(assignment ? assignment.weight.toString() : '');
  const [dueDate, setDueDate] = React.useState(assignment ? assignment.due_date : '');

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{assignment ? 'Edit Assignment' : 'Add Assignment'}</Text>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
      />
      <TextInput
        placeholder="Grade"
        value={grade}
        onChangeText={setGrade}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Weight"
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
        <Button title="Save" onPress={() => onSave({ title, grade, weight, dueDate })} />
      </View>
    </View>
  );
}

export default AssignmentForm;