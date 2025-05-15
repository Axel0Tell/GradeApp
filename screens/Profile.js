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
  Platform,
  Pressable,
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../services/supabaseService';

const SUPABASE_PROJECT_REF = 'rmhxczezynardogopcpr';

// GradeKo Colors
const gradeKoColors = {
  grade: '#ffbd59',
  ko: '#d0d0d0',
  texts: '#e7c0e4',
  background: '#2c2c3e',
  cardBackground: '#393952',
  inputBackground: '#252535',
  placeholderText: '#a0a0c0',
  danger: '#e74c3c',
  success: '#2ecc71',
  buttonTextDark: '#2c2c3e',
  buttonTextLight: '#FFFFFF',
  borderColor: '#505065',
  overlay: 'rgba(44, 44, 62, 0.85)',
};

// Simple Icon Component
const Icon = ({ name, size = 20, color = gradeKoColors.texts, style }) => {
  let iconChar = '';
  switch (name) {
    case 'profile': iconChar = '👤'; break;
    case 'edit': iconChar = '✏️'; break;
    case 'save': iconChar = '💾'; break;
    case 'delete': iconChar = '🗑️'; break;
    case 'camera': iconChar = '📷'; break;
    case 'logout': iconChar = "Sign out"; break;
    case 'close': iconChar = '✕'; break;
    default: iconChar = '?';
  }
  return <Text style={[{ fontSize: size, color: color }, style]}>{iconChar}</Text>;
};

function Profile({ navigation }) {
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
    if (navigation) {
      navigation.setOptions({
        title: 'My Profile',
        headerStyle: { backgroundColor: gradeKoColors.background },
        headerTintColor: gradeKoColors.grade,
        headerTitleStyle: { fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 15, padding: 5 }}>
            <Icon name="logout" size={20} color={gradeKoColors.danger} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation]);

  // --- LOGIC FUNCTIONS (no changes to logic) ---
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

      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('No access token found');

      setUploading(true);
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

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('No user found');
      return;
    }
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      if (data) {
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
      Alert.alert('Error', 'Failed to load profile data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
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
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully');
      await fetchProfile();
    } catch (error) {
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
      const currentAvatarUrl = profile.avatar_url;
      if (!currentAvatarUrl) return;
      const urlParts = currentAvatarUrl.split('/avatars/');
      const filePath = urlParts.length > 1 ? urlParts[1] : null;
      if (!filePath) throw new Error('Could not extract file path from avatar URL');
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);
      if (deleteError) throw new Error('Error deleting from storage: ' + deleteError.message);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) throw new Error('Error updating profile: ' + updateError.message);
      setProfile(prev => ({
        ...prev,
        avatar_url: null,
        updated_at: new Date().toISOString()
      }));
      Alert.alert('Success', 'Profile picture deleted successfully');
    } catch (error) {
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
      if (profile.avatar_url) {
        const filePath = profile.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([filePath]);
      }
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      if (deleteError) throw deleteError;
      await supabase.auth.signOut();
      Alert.alert('Success', 'Profile deleted successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out", style: "destructive",
          onPress: async () => {
            setSaving(true);
            const { error } = await supabase.auth.signOut();
            setSaving(false);
            if (error) Alert.alert('Error', 'Failed to sign out: ' + error.message);
          }
        }
      ]
    );
  };

  // --- MODALS ---
  const ViewProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showViewProfile}
      onRequestClose={() => setShowViewProfile(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalViewContent}>
          <TouchableOpacity style={styles.modalCloseButtonTop} onPress={() => setShowViewProfile(false)}>
            <Icon name="close" size={24} color={gradeKoColors.texts} />
          </TouchableOpacity>
          <Text style={styles.modalTitleText}>Profile Information</Text>
          <View style={styles.avatarContainerModal}>
            {uploading ? (
              <ActivityIndicator color={gradeKoColors.grade} />
            ) : profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarModal} />
            ) : (
              <View style={styles.avatarPlaceholderModal}>
                <Text style={styles.avatarPlaceholderTextModal}>
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </View>
          <ScrollView>
            <View style={styles.profileInfoRowModal}>
              <Text style={styles.profileLabelModal}>Full Name:</Text>
              <Text style={styles.profileValueModal}>{profile.fullName || 'Not set'}</Text>
            </View>
            <View style={styles.profileInfoRowModal}>
              <Text style={styles.profileLabelModal}>Grade/Year:</Text>
              <Text style={styles.profileValueModal}>{profile.grade || 'Not set'}</Text>
            </View>
            <View style={styles.profileInfoRowModal}>
              <Text style={styles.profileLabelModal}>Course:</Text>
              <Text style={styles.profileValueModal}>{profile.course || 'Not set'}</Text>
            </View>
            <View style={styles.profileInfoRowModal}>
              <Text style={styles.profileLabelModal}>Student ID:</Text>
              <Text style={styles.profileValueModal}>{profile.studentId || 'Not set'}</Text>
            </View>
            {profile.updated_at && (
              <View style={styles.profileInfoRowModal}>
                <Text style={styles.profileLabelModal}>Last Updated:</Text>
                <Text style={styles.profileValueModal}>{formatDate(profile.updated_at)}</Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: gradeKoColors.grade, marginTop: 20 }]}
            onPress={() => setShowViewProfile(false)}
          >
            <Text style={[styles.actionButtonText, { color: gradeKoColors.buttonTextDark }]}>CLOSE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CustomPicker = ({ visible, onClose, items, onSelect, selectedValue, title }) => (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Pressable style={styles.pickerModalView}>
          <Text style={styles.pickerTitleText}>{title}</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {items.map((item) => (
              <TouchableOpacity key={item.value}
                style={[styles.pickerItem, selectedValue === item.value && styles.pickerItemSelected]}
                onPress={() => { onSelect(item.value); onClose(); }}>
                <Text style={[styles.pickerItemText, selectedValue === item.value && styles.pickerItemTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.actionButton, styles.pickerCancelButton]} onPress={onClose}>
            <Text style={[styles.actionButtonText, { color: gradeKoColors.texts }]}>CANCEL</Text>
          </TouchableOpacity>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );

  // --- RENDER ---
  if (loading) {
    return (
      <ImageBackground source={require('../assets/bg.png')} style={styles.backgroundImageContainer} resizeMode="cover">
        <View style={[styles.fullScreenLoader, { backgroundColor: gradeKoColors.overlay }]}>
          <ActivityIndicator size="large" color={gradeKoColors.grade} />
          <Text style={{ color: gradeKoColors.texts, marginTop: 15, fontSize: 16 }}>Loading Profile...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../assets/bg.png')} style={styles.backgroundImageContainer} resizeMode="cover">
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Card */}
        <View style={styles.card}>
          <View style={styles.avatarSection}>
  <View style={styles.avatarImageContainer}>
    {uploading ? (
      <ActivityIndicator size="large" color={gradeKoColors.grade} />
    ) : profile.avatar_url ? (
      <Image source={{ uri: profile.avatar_url }} style={styles.avatarDisplay} />
    ) : (
      <View style={styles.avatarPlaceholderDisplay}>
        <Text style={styles.avatarPlaceholderTextDisplay}>
          {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
    )}
  </View>
  {Platform.OS === 'web' && (
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      style={{ display: 'none' }}
      onChange={handleFileChange}
    />
  )}
  <TouchableOpacity
    style={[styles.actionButton, styles.photoButton]}
    onPress={
      uploading
        ? null
        : Platform.OS === 'web'
        ? () => fileInputRef.current.click()
        : handleImageUpload
    }
    disabled={uploading}
  >
    {uploading ? (
      <ActivityIndicator color={gradeKoColors.buttonTextDark} />
    ) : (
      <Icon name="camera" size={18} color={gradeKoColors.buttonTextDark} />
    )}
    <Text
      style={[
        styles.actionButtonText,
        { color: gradeKoColors.buttonTextDark, marginLeft: 8 },
      ]}
    >
      {uploading
        ? 'UPLOADING...'
        : profile.avatar_url
        ? 'CHANGE PHOTO'
        : 'ADD PHOTO'}
    </Text>
  </TouchableOpacity>
  {/* Delete Photo button below Change Photo */}
  {profile.avatar_url && !uploading && (
    <TouchableOpacity
      style={styles.deletePhotoTextButton}
      onPress={handleDeletePhoto}
      disabled={uploading}
    >
      <Text style={styles.deletePhotoText}>Delete Photo</Text>
    </TouchableOpacity>
  )}
  
</View>
        </View>

        {/* View Profile Info Button */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewProfileInfoButton]}
            onPress={() => setShowViewProfile(true)} >
            <Text style={[styles.actionButtonText, { color: gradeKoColors.buttonTextDark }]}>VIEW FULL PROFILE INFO</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={profile.fullName} onChangeText={(text) => setProfile({ ...profile, fullName: text })} placeholder="Enter your full name" placeholderTextColor={gradeKoColors.placeholderText} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grade/Year</Text>
            <TouchableOpacity style={styles.pickerTouchable} onPress={() => setShowGradePicker(true)}>
              <Text style={[styles.pickerTouchableText, !profile.grade && { color: gradeKoColors.placeholderText }]}>{profile.grade || 'Select Year Level'}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course</Text>
            <TouchableOpacity style={styles.pickerTouchable} onPress={() => setShowCoursePicker(true)}>
              <Text style={[styles.pickerTouchableText, !profile.course && { color: gradeKoColors.placeholderText }]}>{profile.course || 'Select Course'}</Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput style={styles.input} value={profile.studentId} onChangeText={(text) => setProfile({ ...profile, studentId: text })} placeholder="Enter your student ID" placeholderTextColor={gradeKoColors.placeholderText} />
          </View>
          <TouchableOpacity style={[styles.actionButton, styles.saveChangesButton]} onPress={updateProfile} disabled={saving || loading}>
            {saving ? <ActivityIndicator color={gradeKoColors.buttonTextDark} /> : <Icon name="save" size={18} color={gradeKoColors.buttonTextDark} />}
            <Text style={[styles.actionButtonText, { color: gradeKoColors.buttonTextDark, marginLeft: 8 }]}>SAVE CHANGES</Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        {profile.updated_at && (
          <View style={[styles.card, { marginTop: 15, paddingVertical: 15 }]}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {formatDate(profile.updated_at)}
            </Text>
          </View>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerZoneCard}>
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          <Text style={styles.deleteWarningText}> Warning: This action is irreversible and will delete all your data.</Text>
          <TouchableOpacity style={[styles.actionButton, styles.deleteProfileButton]}
            onPress={() => {
              Alert.alert('Delete Profile', 'Are you sure? This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'DELETE', onPress: deleteProfile, style: 'destructive' }
                ]);
            }} disabled={saving || loading} >
            {saving && <ActivityIndicator color={gradeKoColors.buttonTextLight} />}
            {!saving && <Icon name="delete" size={18} color={gradeKoColors.buttonTextLight} />}
            <Text style={[styles.actionButtonText, { color: gradeKoColors.buttonTextLight, marginLeft: 8 }]}>DELETE MY PROFILE</Text>
          </TouchableOpacity>
        </View>

        <ViewProfileModal />
        <CustomPicker visible={showGradePicker} onClose={() => setShowGradePicker(false)} items={years} onSelect={(value) => setProfile({ ...profile, grade: value })} selectedValue={profile.grade} title="Select Year Level" />
        <CustomPicker visible={showCoursePicker} onClose={() => setShowCoursePicker(false)} items={courses} onSelect={(value) => setProfile({ ...profile, course: value })} selectedValue={profile.course} title="Select Course" />
      </ScrollView>
    </ImageBackground>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  backgroundImageContainer: { flex: 1 },
  mainScrollView: { flex: 1 },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: 15, paddingBottom: 40 },

  card: {
    backgroundColor: gradeKoColors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  deletePhotoTextButton: {
  marginTop: 10,
  marginBottom: 5,
  alignSelf: 'center',
},
deletePhotoText: {
  color: gradeKoColors.danger,
  fontWeight: 'bold',
  fontSize: 16,
  textAlign: 'center',
},

  avatarSection: { alignItems: 'center' },
  avatarImageContainer: { position: 'relative', marginBottom: 15, alignItems: 'center' },
  avatarDisplay: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: gradeKoColors.grade },
  avatarPlaceholderDisplay: { width: 140, height: 140, borderRadius: 70, backgroundColor: gradeKoColors.grade, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: gradeKoColors.ko },
  avatarPlaceholderTextDisplay: { fontSize: 60, color: gradeKoColors.buttonTextDark, fontWeight: 'bold' },
  deletePhotoFab: { position: 'absolute', bottom: 5, right: 50, backgroundColor: gradeKoColors.danger, borderRadius: 20, padding: 8, elevation: 3 },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: gradeKoColors.texts, marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: gradeKoColors.borderColor, textAlign: 'center' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 16, color: gradeKoColors.texts, marginBottom: 8, fontWeight: '500' },
  input: { backgroundColor: gradeKoColors.inputBackground, color: gradeKoColors.texts, borderWidth: 1, borderColor: gradeKoColors.borderColor, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, height: 50 },

  pickerTouchable: { backgroundColor: gradeKoColors.inputBackground, borderWidth: 1, borderColor: gradeKoColors.borderColor, borderRadius: 8, paddingHorizontal: 15, height: 50, justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row' },
  pickerTouchableText: { fontSize: 16, color: gradeKoColors.texts },
  pickerArrow: { color: gradeKoColors.texts, fontSize: 14, fontWeight: 'bold' },

  actionButton: { flexDirection: 'row', paddingVertical: 13, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginVertical: 8, elevation: 2, minHeight: 48 },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },

  photoButton: { backgroundColor: gradeKoColors.grade, marginTop: 10 },
  viewProfileInfoButton: { backgroundColor: gradeKoColors.ko, borderWidth: 1, borderColor: gradeKoColors.grade },
  saveChangesButton: { backgroundColor: gradeKoColors.grade },

  lastUpdatedText: { fontSize: 13, color: gradeKoColors.ko, textAlign: 'center', fontStyle: 'italic' },

  dangerZoneCard: {
    backgroundColor: gradeKoColors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginTop: 25,
    borderWidth: 1.5,
    borderColor: gradeKoColors.danger,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  dangerZoneTitle: { fontSize: 18, fontWeight: 'bold', color: gradeKoColors.danger, textAlign: 'center', marginBottom: 10 },
  deleteProfileButton: { backgroundColor: gradeKoColors.danger, marginTop: 15 },
  deleteWarningText: { fontSize: 14, color: gradeKoColors.ko, textAlign: 'center', marginTop: 5, lineHeight: 20 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.80)' },
  modalViewContent: { backgroundColor: gradeKoColors.cardBackground, width: '90%', maxHeight: '85%', borderRadius: 15, padding: 20, paddingTop: 15, elevation: 5 },
  modalCloseButtonTop: { position: 'absolute', top: 10, right: 10, padding: 5, zIndex: 10 },
  modalTitleText: { fontSize: 20, fontWeight: 'bold', color: gradeKoColors.texts, marginBottom: 20, textAlign: 'center' },
  avatarContainerModal: { alignItems: 'center', marginBottom: 20 },
  avatarModal: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: gradeKoColors.grade },
  avatarPlaceholderModal: { width: 100, height: 100, borderRadius: 50, backgroundColor: gradeKoColors.grade, justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderTextModal: { fontSize: 40, color: gradeKoColors.buttonTextDark, fontWeight: 'bold' },
  profileInfoRowModal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: gradeKoColors.borderColor },
  profileLabelModal: { fontSize: 15, color: gradeKoColors.texts, fontWeight: '600', flex: 0.4 },
  profileValueModal: { fontSize: 15, color: gradeKoColors.ko, textAlign: 'right', flex: 0.6, flexShrink: 1 },

  pickerModalView: { backgroundColor: gradeKoColors.cardBackground, width: '85%', maxHeight: '70%', borderRadius: 10, padding: 15, elevation: 5 },
  pickerTitleText: { fontSize: 18, fontWeight: 'bold', color: gradeKoColors.texts, marginBottom: 15, textAlign: 'center' },
  pickerItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: gradeKoColors.borderColor },
  pickerItemSelected: { backgroundColor: gradeKoColors.grade },
  pickerItemText: { fontSize: 16, color: gradeKoColors.texts, textAlign: 'center' },
  pickerItemTextSelected: { color: gradeKoColors.buttonTextDark, fontWeight: 'bold' },
  pickerCancelButton: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: gradeKoColors.ko, marginTop: 15 },
});

export default Profile;