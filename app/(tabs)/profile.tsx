import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Switch 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { mockUsers } from '../mockData';

const ProfileScreen = () => {
  const [profile, setProfile] = useState(mockUsers[0]);
  const [editing, setEditing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const handleUpdate = () => {
    Alert.alert(t('success'), t('profileUpdated'));
    setEditing(false);
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with title and buttons */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('title')}</Text>
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
        </View>
      )}

      {/* Edit Mode */}
      {editing ? (
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('fullName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('fullName')}
              value={profile.fullName}
              onChangeText={(text) => setProfile({ ...profile, fullName: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('currentAddress')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('currentAddress')}
              value={profile.currentAddress}
              onChangeText={(text) =>
                setProfile({ ...profile, currentAddress: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('idCardNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('idCardNumber')}
              value={profile.idCardNumber}
              onChangeText={(text) =>
                setProfile({ ...profile, idCardNumber: text })
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('phoneNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('phoneNumber')}
              value={profile.phoneNumber}
              onChangeText={(text) =>
                setProfile({ ...profile, phoneNumber: text })
              }
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.buttonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleUpdate}
            >
              <Text style={styles.buttonText}>{t('saveChanges')}</Text>
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

          <View style={styles.profileInfo}>
            <Text style={styles.label}>{t('currentAddress')}</Text>
            <Text style={styles.value}>{profile.currentAddress}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.label}>{t('idCardNumber')}</Text>
            <Text style={styles.value}>{profile.idCardNumber}</Text>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.label}>{t('phoneNumber')}</Text>
            <Text style={styles.value}>{profile.phoneNumber}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
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
    marginBottom: 100
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
    marginBottom: 100
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
});

export default ProfileScreen;