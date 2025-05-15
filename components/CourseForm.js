import React, { useState, useEffect } from 'react'; // Added useEffect for potential use
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity, // Added TouchableOpacity
  ScrollView,     // Added ScrollView
} from 'react-native';
import { supabase } from '../services/supabaseService';

// Define or import gradeKoColors here
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e', // For input background, or slightly lighter for form background if needed
  cardBackground: '#393952', // Assuming this form is in a modal with this background
  placeholderText: '#a0a0c0',
  danger: '#e74c3c', // For error text and borders
  success: '#2ecc71',
  inputErrorBg: '#4f2f3e', // Darker red for error input background
};

export default function CourseForm({ course, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: course?.name || '',
    semester: course?.semester?.toString() || '1', // Ensure semester is a string for TextInput
    exam_weight: course?.exam_weight?.toString() || '30',
    written_work_weight: course?.written_work_weight?.toString() || '30',
    participation_weight: course?.participation_weight?.toString() || '20',
    attendance_weight: course?.attendance_weight?.toString() || '20',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // This effect updates formData if the 'course' prop changes (e.g., selecting a different course to edit without closing form)
  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        semester: course.semester?.toString() || '1',
        exam_weight: course.exam_weight?.toString() || '30',
        written_work_weight: course.written_work_weight?.toString() || '30',
        participation_weight: course.participation_weight?.toString() || '20',
        attendance_weight: course.attendance_weight?.toString() || '20',
      });
    } else {
      // Reset form if no course is passed (e.g., for 'Add Course')
      setFormData({
        name: '', semester: '1', exam_weight: '30', written_work_weight: '30',
        participation_weight: '20', attendance_weight: '20'
      });
    }
    setErrors({}); // Clear errors when course changes or form is reset
  }, [course]);


  const calculateTotal = () => {
    return (
      parseFloat(formData.exam_weight || 0) +
      parseFloat(formData.written_work_weight || 0) +
      parseFloat(formData.participation_weight || 0) +
      parseFloat(formData.attendance_weight || 0)
    );
  };

  const validateForm = () => {
    const newErrors = {};
    const total = calculateTotal();

    if (!formData.name.trim()) newErrors.name = 'Course name is required';
    if (!formData.semester || !/^[1-9]$/.test(formData.semester)) {
      newErrors.semester = 'Please enter a valid semester (1-9)';
    }
    // Check individual weights
    ['exam_weight', 'written_work_weight', 'participation_weight', 'attendance_weight'].forEach(key => {
        const val = parseFloat(formData[key]);
        if (isNaN(val) || val < 0 || val > 100) {
            newErrors[key] = 'Must be 0-100';
        }
    });

    if (Math.abs(total - 100) >= 0.01) { // Using a small tolerance for float comparison
      newErrors.weights_total = 'Weights must total exactly 100%';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Authentication required. Please log in again.');

      const courseData = {
        name: formData.name.trim(),
        semester: parseInt(formData.semester, 10),
        exam_weight: parseFloat(formData.exam_weight),
        written_work_weight: parseFloat(formData.written_work_weight),
        participation_weight: parseFloat(formData.participation_weight),
        attendance_weight: parseFloat(formData.attendance_weight),
        user_id: user.id,
      };

      let response;
      if (course?.id) {
        response = await supabase.from('courses').update(courseData).eq('id', course.id).select();
      } else {
        response = await supabase.from('courses').insert(courseData).select();
      }

      if (response.error) throw response.error;
      
      Alert.alert('Success', `Course "${response.data[0].name}" ${course?.id ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save course. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    let processedValue = value;
    
    if (field === 'semester') {
      processedValue = value.replace(/[^1-9]/g, ''); // Allow only 1-9
      // No need to check length > 1 if TextInput has maxLength={1}
    } else if (field.includes('_weight')) {
      // Allow numbers and a single decimal point
      processedValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = processedValue.split('.');
      if (parts.length > 2) {
        processedValue = `${parts[0]}.${parts.slice(1).join('')}`;
      }
      // Optional: Limit to 100
      // if (parseFloat(processedValue) > 100) processedValue = '100';
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    // Clear specific error when user starts typing in the field
    if (errors[field]) {
        setErrors(prev => ({...prev, [field]: null}));
    }
    if (field.includes('_weight') && errors.weights_total) {
        setErrors(prev => ({...prev, weights_total: null}));
    }
  };

  const currentTotal = calculateTotal();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{course ? 'Edit Course' : 'Add New Course'}</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Course Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={text => handleChange('name', text)}
          placeholder="e.g. Mathematics 101"
          placeholderTextColor={gradeKoColors.placeholderText}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Semester (1-9) *</Text>
        <TextInput
          style={[styles.input, errors.semester && styles.inputError]}
          value={formData.semester}
          onChangeText={text => handleChange('semester', text)}
          placeholder="e.g. 2"
          placeholderTextColor={gradeKoColors.placeholderText}
          keyboardType="number-pad"
          maxLength={1}
        />
        {errors.semester && <Text style={styles.errorText}>{errors.semester}</Text>}
      </View>

      <Text style={styles.sectionTitle}>Grading Weights (Total must be 100%)</Text>

      {[
        { key: 'exam_weight', label: 'Exams' },
        { key: 'written_work_weight', label: 'Written Work' },
        { key: 'participation_weight', label: 'Class Participation' },
        { key: 'attendance_weight', label: 'Attendance' },
      ].map((item) => (
        <View key={item.key} style={styles.weightRow}>
          <Text style={styles.weightLabel}>{item.label}:</Text>
          <TextInput
            value={formData[item.key]}
            onChangeText={text => handleChange(item.key, text)}
            keyboardType="decimal-pad"
            style={[
                styles.weightInput,
                (errors[item.key] || errors.weights_total) && styles.inputError // Highlight if individual or total weight error
            ]}
            placeholder="0-100"
            placeholderTextColor={gradeKoColors.placeholderText}
            maxLength={5} // e.g., 100.0
          />
          <Text style={styles.percentSign}>%</Text>
          {errors[item.key] && <Text style={[styles.errorText, styles.inlineErrorText]}>{errors[item.key]}</Text>}
        </View>
      ))}

      <Text style={[
        styles.totalText,
        errors.weights_total && { color: gradeKoColors.danger } // Change color if there's a total weight error
      ]}>
        Current Total: {currentTotal.toFixed(2)}% {/* Show with 2 decimal places */}
      </Text>
      {errors.weights_total && <Text style={[styles.errorText, {textAlign: 'center'}]}>{errors.weights_total}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.formButton, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={[styles.formButtonText, styles.cancelButtonText]}>CANCEL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formButton, styles.saveButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={gradeKoColors.background} />
          ) : (
            <Text style={styles.formButtonText}>SAVE COURSE</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Only if it's the root view of a screen, not for modal content
    padding: 20,
    // backgroundColor: gradeKoColors.cardBackground, // Assuming form is in a modal, parent modalContent handles this
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: gradeKoColors.texts,
    marginBottom: 25,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: gradeKoColors.texts,
    marginBottom: 7,
    // fontWeight: '500',
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
  },
  inputError: {
    borderColor: gradeKoColors.danger,
    backgroundColor: gradeKoColors.inputErrorBg, // Darker red for error background
  },
  errorText: {
    color: gradeKoColors.danger,
    fontSize: 13,
    marginTop: 5,
  },
  inlineErrorText: { // For errors beside the input
    marginLeft: 10,
    flexShrink: 1, // Allow text to wrap
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: gradeKoColors.texts,
    marginTop: 20,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: gradeKoColors.ko,
    paddingTop: 15,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between', // Distribute elements
  },
  weightLabel: {
    color: gradeKoColors.texts,
    fontSize: 15,
    flex: 1.5, // Give more space to label
  },
  weightInput: {
    backgroundColor: gradeKoColors.background,
    color: gradeKoColors.texts,
    borderWidth: 1,
    borderColor: gradeKoColors.ko,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 15,
    width: 70, // Fixed width for weight input
    // marginHorizontal: 8,
  },
  percentSign: {
    color: gradeKoColors.texts,
    fontSize: 15,
    marginLeft: 5,
  },
  totalText: {
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: 'bold',
    fontSize: 16,
    color: gradeKoColors.texts, // Default color
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  formButton: {
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    minHeight: 48, // Ensure consistent button height with loader
    justifyContent: 'center',
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
  // loader style is removed, using ActivityIndicator directly in button
});