import React, { useState, useEffect } from 'react'; // Make sure useEffect is imported
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

// ... (gradeKoColors and CATEGORIES definition) ...

function AssignmentForm({ assignment, onSave, onCancel }) {
  const [title, setTitle] = useState(assignment ? assignment.title : '');
  const [grade, setGrade] = useState(assignment ? assignment.grade?.toString() : '');
  const [weight, setWeight] = useState(assignment ? assignment.weight?.toString() : '');
  // Initial state for dueDate can be empty or try to format immediately if assignment exists
  const [dueDate, setDueDate] = useState(''); // Start with empty or formatted initial value
  const [category, setCategory] = useState(assignment ? assignment.category : '');

  // This useEffect runs when the 'assignment' prop changes (e.g., when opening the form for editing)
  useEffect(() => {
    if (assignment && assignment.due_date) {
      // Check if due_date needs formatting.
      // If it's already 'YYYY-MM-DD', no need for this.
      // If it's an ISO string like "2025-05-15T00:00:00.000Z"
      try {
        const dateObject = new Date(assignment.due_date);
        // Check if dateObject is valid
        if (!isNaN(dateObject.getTime())) {
          const year = dateObject.getFullYear();
          const month = (dateObject.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
          const day = dateObject.getDate().toString().padStart(2, '0');
          setDueDate(`${year}-${month}-${day}`);
        } else {
          // If date is invalid string, or already YYYY-MM-DD, maybe just use it
          // Or set to empty if it's clearly invalid and not YYYY-MM-DD
          if (typeof assignment.due_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(assignment.due_date)) {
            setDueDate(assignment.due_date); // It's already in YYYY-MM-DD format
          } else {
            console.warn("Invalid date format received for due_date:", assignment.due_date);
            setDueDate(''); // Fallback to empty or keep as is if it might be manually entered
          }
        }
      } catch (error) {
        console.error("Error formatting due_date:", error);
        setDueDate(''); // Fallback if parsing fails
      }
    } else if (!assignment) {
      // If it's a new assignment (no 'assignment' prop), clear the due date
      setDueDate('');
    }
  }, [assignment]); // The dependency array: this effect runs when 'assignment' changes

  // ... (rest of your component, handleSavePress, JSX, styles) ...

  // Example in JSX (no change here):
  // <TextInput
  //   placeholder="YYYY-MM-DD"
  //   value={dueDate}
  //   onChangeText={setDueDate}
  //   style={styles.input}
  //   placeholderTextColor={gradeKoColors.placeholderText}
  // />

// ... (rest of your component: handleSavePress, JSX, styles)
// Make sure your styles are correctly defined as in the previous example
  const handleSavePress = () => {
    if (!title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (!category) {
        alert('Please select a category.');
        return;
    }
    // Validate dueDate format before saving if user types it manually
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        alert('Please enter due date in YYYY-MM-DD format.');
        return;
    }

    onSave({
      title,
      grade: parseFloat(grade) || null,
      weight: parseFloat(weight) || 0,
      dueDate: dueDate || null, // Send null if dueDate is empty
      category
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>
        {assignment ? 'Edit Grade Item' : 'Add Grade Item'}
      </Text>

      <Text style={styles.label}>Category:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={styles.picker}
          dropdownIconColor={gradeKoColors.texts}
          prompt="Select a Category"
        >
          {CATEGORIES.map((cat) => (
            <Picker.Item
              key={cat.value}
              label={cat.label}
              value={cat.value}
              style={styles.pickerItem}
              color={cat.value === '' ? gradeKoColors.placeholderText : gradeKoColors.texts}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Title:</Text>
      <TextInput
        placeholder="e.g., Midterm Exam"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor={gradeKoColors.placeholderText}
      />

      <Text style={styles.label}>Grade (0-100):</Text>
      <TextInput
        placeholder="Enter grade (optional)"
        value={grade}
        onChangeText={setGrade}
        style={styles.input}
        keyboardType="numeric"
        placeholderTextColor={gradeKoColors.placeholderText}
      />

      <Text style={styles.label}>Weight (%):</Text>
      <TextInput
        placeholder="e.g., 30"
        value={weight}
        onChangeText={setWeight}
        style={styles.input}
        keyboardType="numeric"
        placeholderTextColor={gradeKoColors.placeholderText}
      />

      <Text style={styles.label}>Due Date (YYYY-MM-DD):</Text>
      <TextInput
        placeholder="YYYY-MM-DD"
        value={dueDate}
        onChangeText={setDueDate}
        style={styles.input}
        placeholderTextColor={gradeKoColors.placeholderText}
        maxLength={10}
      />

      <View style={styles.formActions}>
        <TouchableOpacity style={[styles.formButton, styles.cancelButton]} onPress={onCancel}>
          <Text style={[styles.formButtonText, styles.cancelButtonText]}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formButton, styles.saveButton]}
          onPress={handleSavePress}
        >
          <Text style={styles.formButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Define gradeKoColors and CATEGORIES as in the previous example
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e',
  cardBackground: '#393952',
  placeholderText: '#a0a0c0',
};

const CATEGORIES = [
  { label: 'Select Category...', value: '' },
  { label: 'Exams', value: 'exams' },
  { label: 'Written Work', value: 'written_work' },
  { label: 'Class Participation', value: 'class_participation' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Quiz', value: 'quiz'},
  { label: 'Project', value: 'project'},
];

// Define styles as in the previous example
const styles = StyleSheet.create({
  formContainer: {
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: gradeKoColors.texts,
    marginBottom: 25,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    color: gradeKoColors.texts,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: gradeKoColors.background,
    color: gradeKoColors.texts,
    borderWidth: 1,
    borderColor: gradeKoColors.ko,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  pickerContainer: {
    backgroundColor: gradeKoColors.background,
    borderColor: gradeKoColors.ko,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    color: gradeKoColors.texts,
  },
  pickerItem: {
    // Styling here
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  formButton: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 25,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: gradeKoColors.grade,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: gradeKoColors.ko,
  },
  formButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: gradeKoColors.background,
  },
  cancelButtonText: {
    color: gradeKoColors.texts,
  },
});


export default AssignmentForm;