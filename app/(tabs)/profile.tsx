import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Easing
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/api';

interface Profile {
  fullName: string;
  email: string;
  address?: string;
  idCardNumber?: string;
  phoneNumber?: string;
}

const ProfileScreen = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, updatedUser , signOut }: any = useAuth();
  const [profile, setProfile] = useState<any>({
    fullName: '',
    email: '',
    address: '',
    idCardNumber: '',
    phoneNumber: ''
  });
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Snackbar states
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error'>('success');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await profileService.getProfile();
        setProfile(response.data);
        updatedUser(response.data);
      } catch (error) {
        showSnackbar(t('profileLoadError'), 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (!user?.email) {
      fetchProfile();
    } else {
      setProfile(user);
      setIsLoading(false);
    }
  }, []);

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
    
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      hideSnackbar();
    }, 3000);
  };

  const hideSnackbar = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setSnackbarVisible(false);
    });
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      const updatedProfile = await profileService.updateProfile(profile);
      setProfile(updatedProfile.data.user);
      await updatedUser(updatedProfile.data.user);
      
      showSnackbar(t('profileUpdated'), 'success');
      setEditing(false);
    } catch (error) {
      showSnackbar(t('profileUpdateError'), 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      showSnackbar(t('logoutFailed'), 'error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with title and buttons */}
        <View style={styles.header}>
          <Text style={styles.title}>{profile.fullName || t('profile')}</Text>
          <View style={styles.headerButtons}>
            {!editing && (
              <TouchableOpacity 
                onPress={() => setEditing(true)} 
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={24} color="#2E86C1" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setShowSettings(!showSettings)} 
              style={styles.settingsButton}
            >
              <MaterialIcons 
                name={showSettings ? "close" : "settings"} 
                size={24} 
                color="#2C3E50" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Panel */}
        {showSettings && (
          <View style={styles.settingsContainer}>
            <Text style={styles.settingsTitle}>{t('settings')}</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>{t('language')}</Text>
              <View style={styles.languageToggle}>
                <Text style={styles.languageText}>{t('english')}</Text>
                <Switch
                  value={language === 'fr'}
                  onValueChange={toggleLanguage}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={language === 'fr' ? "#2E86C1" : "#f4f3f4"}
                />
                <Text style={styles.languageText}>{t('french')}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator color="#E74C3C" />
              ) : (
                <>
                  <MaterialIcons name="logout" size={20} color="#E74C3C" />
                  <Text style={styles.logoutButtonText}>{t('logout')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Edit Mode */}
        {editing ? (
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                value={profile.fullName}
                onChangeText={(text) => setProfile({...profile, fullName: text})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('email')}</Text>
              <TextInput
                style={styles.input}
                value={profile.email}
                editable={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('currentAddress')}</Text>
              <TextInput
                style={styles.input}
                value={profile.address || ''}
                onChangeText={(text) => setProfile({...profile, address: text})}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
              <TextInput
                style={styles.input}
                value={profile.phoneNumber || ''}
                onChangeText={(text) => setProfile({...profile, phoneNumber: text})}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setEditing(false)}
              >
                <Text style={[styles.buttonText, { color: '#2C3E50' }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>{t('saveChanges')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* View Mode */
          <View style={styles.profileContainer}>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>{t('fullName')}</Text>
              <Text style={styles.value}>{profile.fullName}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.label}>{t('email')}</Text>
              <Text style={styles.value}>{profile.email}</Text>
            </View>

            {profile.address && (
              <View style={styles.profileInfo}>
                <Text style={styles.label}>{t('currentAddress')}</Text>
                <Text style={styles.value}>{profile.address}</Text>
              </View>
            )}

            {profile.phoneNumber && (
              <View style={styles.profileInfo}>
                <Text style={styles.label}>{t('phoneNumber')}</Text>
                <Text style={styles.value}>{profile.phoneNumber}</Text>
              </View>
            )}

            {profile.idCardNumber && (
              <View style={styles.profileInfo}>
                <Text style={styles.label}>{t('idCardNumber')}</Text>
                <Text style={styles.value}>{profile.idCardNumber}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Custom Snackbar */}
      {snackbarVisible && (
        <Animated.View 
          style={[
            styles.snackbar,
            snackbarType === 'success' ? styles.successSnackbar : styles.errorSnackbar,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                })
              }]
            }
          ]}
        >
          <MaterialIcons 
            name={snackbarType === 'success' ? 'check-circle' : 'error'} 
            size={24} 
            color="white" 
          />
          <Text style={styles.snackbarText}>{snackbarMessage}</Text>
          <TouchableOpacity onPress={hideSnackbar}>
            <MaterialIcons name="close" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    paddingBottom: 80, // Extra padding for snackbar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  editButton: {
    padding: 8,
    marginRight: 10,
  },
  settingsButton: {
    padding: 8,
  },
  settingsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  settingItem: {
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 10,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20
  },
  profileContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495E',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FDFEFE',
  },
  profileInfo: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDED',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#2C3E50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#E6E6E6',
  },
  saveButton: {
    backgroundColor: '#2E86C1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FDEDED',
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  snackbar: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100
  },
  successSnackbar: {
    backgroundColor: '#4CAF50',
    zIndex: 1000
  },
  errorSnackbar: {
    backgroundColor: '#F44336',
    zIndex: 1000
  },
  snackbarText: {
    color: 'white',
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
    fontSize: 16,
  },
});

export default ProfileScreen;