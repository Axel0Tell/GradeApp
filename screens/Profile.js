import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Button,
  Platform,
  Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabaseService';
import { useTheme } from '../contexts/ThemeContext';

const SUPABASE_PROJECT_REF = 'rmhxczezynardogopcpr';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    grade: '',
    course: '',
    studentId: '',
    updated_at: null,
    avatar_url: null
  });
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const years = [
    { label: '1st Year', value: '1st Year' },
    { label: '2nd Year', value: '2nd Year' },
    { label: '3rd Year', value: '3rd Year' },
    { label: '4th Year', value: '4th Year' }
  ];

  const courses = [
    { label: 'Bachelor of Science in Information Technology', value: 'BSIT' },
    { label: 'Bachelor of Science in Computer Science', value: 'BSCS' },
    { label: 'Bachelor of Science in Information Systems', value: 'BSIS' },
    { label: 'Bachelor of Science in Computer Engineering', value: 'BSCpE' },
    { label: 'Bachelor of Science in Electronics Engineering', value: 'BSEE' },
    { label: 'Bachelor of Science in Electrical Engineering', value: 'BSEEE' },
    { label: 'Bachelor of Science in Civil Engineering', value: 'BSCE' },
    { label: 'Bachelor of Science in Mechanical Engineering', value: 'BSME' },
    { label: 'Bachelor of Science in Chemical Engineering', value: 'BSChemE' },
    { label: 'Bachelor of Science in Industrial Engineering', value: 'BSIE' }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageUpload = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('No user found');

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll access is needed!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const fileExt = uri.split('.').pop().split('?')[0];
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Get the user's access token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('No access token found');

      // Upload using FileSystem.uploadAsync
      const uploadUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/avatars/${filePath}`;
      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          },
        }
      );

      if (uploadResult.status !== 200 && uploadResult.status !== 201) {
        throw new Error('Upload failed: ' + uploadResult.body);
      }

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      console.log('Public URL:', publicUrl);

      // Save public URL to profile
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };
  
  
  

  // Handle file input change for web
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('No user found');
      return;
    }
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) {
      alert('Upload failed: ' + error.message);
      return;
    }
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    await supabase
      .from('profiles')
      .update({ avatar_url: publicData.publicUrl })
      .eq('id', user.id);
    await fetchProfile();
    alert('Upload success!');
  };

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        console.log('Profile data received:', data);
        setProfile({
          fullName: data.full_name || '',
          grade: data.grade || '',
          course: data.course || '',
          studentId: data.student_id || '',
          updated_at: data.updated_at,
          avatar_url: data.avatar_url
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      Alert.alert('Error', 'Failed to load profile data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      console.log('Starting profile update...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const now = new Date().toISOString();
      const updates = {
        id: user.id,
        full_name: profile.fullName,
        grade: profile.grade,
        course: profile.course,
        student_id: profile.studentId,
        updated_at: now
      };

      console.log('Updating profile with:', updates);

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      console.log('Profile updated successfully');
      Alert.alert('Success', 'Profile updated successfully');
      
      // Refresh profile
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setUploading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('No user found');

      // Get the current avatar URL
      const currentAvatarUrl = profile.avatar_url;
      if (!currentAvatarUrl) return;

      // Extract the file path from the URL
      // Example: https://rmhxczezynardogopcpr.supabase.co/storage/v1/object/public/avatars/USER_ID/FILENAME.jpg
      // We want: USER_ID/FILENAME.jpg
      const urlParts = currentAvatarUrl.split('/avatars/');
      const filePath = urlParts.length > 1 ? urlParts[1] : null;
      if (!filePath) throw new Error('Could not extract file path from avatar URL');

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) throw new Error('Error deleting from storage: ' + deleteError.message);

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw new Error('Error updating profile: ' + updateError.message);

      // Update local state
      setProfile(prev => ({
        ...prev,
        avatar_url: null,
        updated_at: new Date().toISOString()
      }));

      Alert.alert('Success', 'Profile picture deleted successfully');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  const deleteProfile = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Delete profile picture if exists
      if (profile.avatar_url) {
        const filePath = profile.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      }

      // Delete profile (no more profile_history delete)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) throw deleteError;

      // Sign out the user
      await supabase.auth.signOut();

      Alert.alert('Success', 'Profile deleted successfully');
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert('Error', 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    // You can customize the format here if you want
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ViewProfileModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showViewProfile}
        onRequestClose={() => setShowViewProfile(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: '#2c3e50' }]}>Profile Information</Text>
            
            <View style={styles.avatarContainer}>
              {uploading ? (
                <ActivityIndicator />
              ) : profile.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#3498db' }]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {profile.fullName ? profile.fullName[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.profileInfoContainer, { backgroundColor: '#f5f6fa' }]}>
              <View style={[styles.profileInfoRow, { borderBottomColor: '#dcdde1' }]}>
                <Text style={[styles.profileLabel, { color: '#2c3e50' }]}>Full Name:</Text>
                <Text style={[styles.profileValue, { color: '#2c3e50' }]}>{profile.fullName || 'Not set'}</Text>
              </View>

              <View style={[styles.profileInfoRow, { borderBottomColor: '#dcdde1' }]}>
                <Text style={[styles.profileLabel, { color: '#2c3e50' }]}>Grade/Year:</Text>
                <Text style={[styles.profileValue, { color: '#2c3e50' }]}>{profile.grade || 'Not set'}</Text>
              </View>

              <View style={[styles.profileInfoRow, { borderBottomColor: '#dcdde1' }]}>
                <Text style={[styles.profileLabel, { color: '#2c3e50' }]}>Course:</Text>
                <Text style={[styles.profileValue, { color: '#2c3e50' }]}>{profile.course || 'Not set'}</Text>
              </View>

              <View style={[styles.profileInfoRow, { borderBottomColor: '#dcdde1' }]}>
                <Text style={[styles.profileLabel, { color: '#2c3e50' }]}>Student ID:</Text>
                <Text style={[styles.profileValue, { color: '#2c3e50' }]}>{profile.studentId || 'Not set'}</Text>
              </View>

              {profile.updated_at && (
                <View style={[styles.profileInfoRow, { borderBottomColor: '#dcdde1' }]}>
                  <Text style={[styles.profileLabel, { color: '#2c3e50' }]}>Last Updated:</Text>
                  <Text style={[styles.profileValue, { color: '#2c3e50' }]}>{formatDate(profile.updated_at)}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: '#3498db' }]}
              onPress={() => setShowViewProfile(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const testUpload = async () => {
    const response = await fetch('https://via.placeholder.com/150');
    const blob = await response.blob();
    const filePath = `test/${Date.now()}.png`;
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, { upsert: true });
    console.log('Manual upload result:', data, error);
  };

  const CustomPicker = ({ visible, onClose, items, onSelect, selectedValue, title }) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <ScrollView style={styles.pickerScrollView}>
            {items.map((item) => (
              <Pressable
                key={item.value}
                style={[
                  styles.pickerItem,
                  selectedValue === item.value && styles.pickerItemSelected
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  selectedValue === item.value && styles.pickerItemTextSelected
                ]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.pickerCloseButton}
            onPress={onClose}
          >
            <Text style={styles.pickerCloseButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f5f6fa' }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: '#2c3e50' }]}>Profile</Text>
        
        {/* Profile Picture Section */}
        <View style={styles.avatarSection}>
          {uploading ? (
            <ActivityIndicator />
          ) : profile.avatar_url ? (
            <View>
              <Image
                key={profile.avatar_url}
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
                onError={(e) => {
                  console.error('Image loading error:', e.nativeEvent.error);
                  console.log('Failed to load image from URI:', profile.avatar_url);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully from URI:', profile.avatar_url);
                }}
              />
              <TouchableOpacity
                style={[styles.deletePhotoButton, { backgroundColor: '#e74c3c' }]}
                onPress={handleDeletePhoto}
              >
                <Text style={styles.deletePhotoButtonText}>Delete Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#3498db' }]}>
              <Text style={styles.avatarPlaceholderText}>
                {profile.fullName ? profile.fullName[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
          {/* Hidden file input for web */}
          {Platform.OS === 'web' && (
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}
          <TouchableOpacity
            style={[styles.changePhotoButton, { backgroundColor: '#3498db' }]}
            onPress={handleImageUpload}
          >
            <Text style={styles.changePhotoButtonText}>
              {profile.avatar_url ? 'Change Photo' : 'Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Profile Button */}
        <TouchableOpacity
          style={[styles.viewProfileButton, { backgroundColor: '#3498db' }]}
          onPress={() => setShowViewProfile(true)}
        >
          <Text style={styles.viewProfileButtonText}>View Profile</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: '#2c3e50' }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#ffffff', color: '#2c3e50' }]}
            value={profile.fullName}
            onChangeText={(text) => setProfile({ ...profile, fullName: text })}
            placeholder="Enter your full name"
            placeholderTextColor="#95a5a6"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: '#2c3e50' }]}>Grade/Year</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: '#ffffff' }]}
            onPress={() => setShowGradePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {profile.grade || 'Select Year'}
            </Text>
          </TouchableOpacity>
          <CustomPicker
            visible={showGradePicker}
            onClose={() => setShowGradePicker(false)}
            items={years}
            onSelect={(value) => setProfile({ ...profile, grade: value })}
            selectedValue={profile.grade}
            title="Select Year"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: '#2c3e50' }]}>Course</Text>
          <TouchableOpacity
            style={[styles.pickerButton, { backgroundColor: '#ffffff' }]}
            onPress={() => setShowCoursePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {profile.course || 'Select Course'}
            </Text>
          </TouchableOpacity>
          <CustomPicker
            visible={showCoursePicker}
            onClose={() => setShowCoursePicker(false)}
            items={courses}
            onSelect={(value) => setProfile({ ...profile, course: value })}
            selectedValue={profile.course}
            title="Select Course"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: '#2c3e50' }]}>Student ID</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#ffffff', color: '#2c3e50' }]}
            value={profile.studentId}
            onChangeText={(text) => setProfile({ ...profile, studentId: text })}
            placeholder="Enter your student ID"
            placeholderTextColor="#95a5a6"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#3498db' }]}
          onPress={updateProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Last Update Section */}
        {profile.updated_at && (
          <View style={[styles.lastUpdateSection, { backgroundColor: '#ecf0f1' }]}>
            <Text style={[styles.lastUpdateText, { color: '#7f8c8d' }]}>
              Last updated: {formatDate(profile.updated_at)}
            </Text>
          </View>
        )}

        {/* Delete Profile Section */}
        <View style={[styles.deleteSection, { backgroundColor: '#fde8e8' }]}>
          <Text style={[styles.deleteWarning, { color: '#c0392b' }]}>
            Warning: Deleting your profile will remove all your data and cannot be undone.
          </Text>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: '#e74c3c' }]}
            onPress={() => {
              Alert.alert(
                'Delete Profile',
                'Are you sure you want to delete your profile? This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                  {
                    text: 'Delete',
                    onPress: deleteProfile,
                    style: 'destructive'
                  }
                ]
              );
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* View Profile Modal */}
      <ViewProfileModal />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderColor: '#dcdde1',
  },
  pickerButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#dcdde1',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  pickerScrollView: {
    maxHeight: 300,
  },
  pickerItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerItemTextSelected: {
    color: '#3498db',
    fontWeight: 'bold',
  },
  pickerCloseButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#3498db',
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    width: 220,
    alignSelf: 'center',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: '#3498db',
    borderWidth: 1,
    borderColor: '#2980b9',
    boxShadow: Platform.OS === 'web' ? '0 1px 4px rgba(52,152,219,0.08)' : undefined,
    transition: Platform.OS === 'web' ? 'background 0.2s, box-shadow 0.2s' : undefined,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  lastUpdateSection: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  lastUpdateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 30,
    padding: 15,
    borderRadius: 8,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  historyItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcdde1',
  },
  historyDate: {
    fontSize: 12,
    marginBottom: 5,
  },
  historyChanges: {
    fontSize: 14,
  },
  viewProfileButton: {
    width: 220,
    alignSelf: 'center',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 14,
    backgroundColor: '#3498db',
    borderWidth: 1,
    borderColor: '#2980b9',
    boxShadow: Platform.OS === 'web' ? '0 1px 4px rgba(52,152,219,0.08)' : undefined,
    transition: Platform.OS === 'web' ? 'background 0.2s, box-shadow 0.2s' : undefined,
  },
  viewProfileButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#3498db',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#3498db',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  changePhotoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  deletePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deletePhotoButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteSection: {
    marginTop: 40,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  deleteWarning: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
  deleteButton: {
    width: 220,
    alignSelf: 'center',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    borderWidth: 1,
    borderColor: '#c0392b',
    marginTop: 10,
    marginBottom: 8,
    boxShadow: Platform.OS === 'web' ? '0 1px 4px rgba(231,76,60,0.08)' : undefined,
    transition: Platform.OS === 'web' ? 'background 0.2s, box-shadow 0.2s' : undefined,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
    textTransform: 'none',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileInfoContainer: {
    marginBottom: 20,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  profileLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    flex: 2,
    textAlign: 'right',
  },
  closeButton: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default Profile; 