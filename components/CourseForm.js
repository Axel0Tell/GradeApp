import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';

function CourseForm({ course, onSave, onCancel }) {
  const [name, setName] = React.useState(course ? course.name : '');
  const [term, setTerm] = React.useState(course ? course.term : '');

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{course ? 'Edit Course' : 'Add Course'}</Text>
      <TextInput
        placeholder="Course Name"
        value={name}
        onChangeText={setName}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10 }}
      />
      <TextInput
        placeholder="Term"
        value={term}
        onChangeText={setTerm}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <Button title="Cancel" onPress={onCancel} />
        <Button title="Save" onPress={() => onSave({ name, term })} />
      </View>
    </View>
  );
}

export default CourseForm;