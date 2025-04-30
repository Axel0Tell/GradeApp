import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabaseService';

export default function CourseForm({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    semester: course?.semester?.toString() || '1',
    exam_weight: course?.exam_weight?.toString() || '30',
    written_work_weight: course?.written_work_weight?.toString() || '30',
    participation_weight: course?.participation_weight?.toString() || '20',
    attendance_weight: course?.attendance_weight?.toString() || '20'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate total weights
  const calculateTotal = () => {
    return (
      parseFloat(formData.exam_weight || 0) +
      parseFloat(formData.written_work_weight || 0) +
      parseFloat(formData.participation_weight || 0) +
      parseFloat(formData.attendance_weight || 0)
    );
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    const total = calculateTotal();

    if (!formData.name.trim()) newErrors.name = 'Course name is required';
    if (!formData.semester || !/^[1-9]$/.test(formData.semester)) {
      newErrors.semester = 'Please enter a valid semester (1-9)';
    }
    if (Math.abs(total - 100) >= 0.01) {
      newErrors.weights = 'Weights must total exactly 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Authentication required');

      // Prepare course data
      const courseData = {
        name: formData.name.trim(),
        semester: parseInt(formData.semester, 10),
        exam_weight: parseFloat(formData.exam_weight),
        written_work_weight: parseFloat(formData.written_work_weight),
        participation_weight: parseFloat(formData.participation_weight),
        attendance_weight: parseFloat(formData.attendance_weight),
        user_id: user.id
      };

      // Save to database
      const { data, error } = course?.id
        ? await supabase.from('courses').update(courseData).eq('id', course.id)
        : await supabase.from('courses').insert(courseData);

      if (error) throw error;
      
      Alert.alert('Success', 'Course saved successfully');
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'semester') {
      processedValue = value.replace(/[^1-9]/g, '');
      if (processedValue.length > 1) return;
    }
    
    if (field.includes('_weight')) {
      processedValue = value
        .replace(/[^0-9.]/g, '')
        .replace(/(\..*)\./g, '$1');
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const currentTotal = calculateTotal();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{course ? 'Edit Course' : 'Add Course'}</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Course Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={text => handleChange('name', text)}
          placeholder="e.g. Mathematics 101"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Semester */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Semester (1-9) *</Text>
        <TextInput
          style={[styles.input, errors.semester && styles.inputError]}
          value={formData.semester}
          onChangeText={text => handleChange('semester', text)}
          placeholder="e.g. 2"
          keyboardType="number-pad"
          maxLength={1}
        />
        {errors.semester && <Text style={styles.errorText}>{errors.semester}</Text>}
      </View>

      <Text style={styles.sectionTitle}>Grading Weights (Total must be 100%)</Text>

      {[
        { key: 'exam_weight', label: 'Exams' },
        { key: 'written_work_weight', label: 'Written Work' },
        { key: 'participation_weight', label: 'Participation' },
        { key: 'attendance_weight', label: 'Attendance' }
      ].map((item) => (
        <View key={item.key} style={styles.weightRow}>
          <Text>{item.label}:</Text>
          <TextInput
            value={formData[item.key]}
            onChangeText={text => handleChange(item.key, text)}
            keyboardType="decimal-pad"
            style={[styles.weightInput, errors.weights && styles.inputError]}
          />
          <Text>%</Text>
        </View>
      ))}

      <Text style={[styles.totalText, errors.weights && styles.errorText]}>
        Current Total: {currentTotal}%
      </Text>
      {errors.weights && <Text style={styles.errorText}>{errors.weights}</Text>}

      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          onPress={onCancel}
          color="#999"
          disabled={loading}
        />
        <Button
          title={loading ? "Saving..." : "Save Course"}
          onPress={handleSubmit}
          disabled={loading}
        />
      </View>

      {loading && <ActivityIndicator style={styles.loader} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  inputError: {
    borderColor: 'red',
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weightInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 10,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  totalText: {
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
});