import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable } from 'react-native';
import { mockAgencies } from '../mockData';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';

const cities = ['Buea', 'Limbe', 'Douala', 'Bamenda', 'Yaounde', 'Baffoussam'];

export default function AgenciesScreen() {
  const { t } = useLanguage();
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);

  const renderAgency = ({ item, index }: { item: any; index: number }) => (
  <TouchableOpacity 
    style={[
      styles.agencyCard,
      (!location || !destination) && styles.disabledCard,
      index === mockAgencies.length - 1 && styles.lastCard // Add this line
    ]}
    onPress={() => {
      if (location && destination) {
        router.push({
          pathname: `/booking/${item.buses[0].id}`,
          params: { 
            agencyName: item.name,
            location,
            destination,
          }
        });
      }
    }}
  >
    <Text style={styles.agencyName}>{item.name}</Text>
    <Text style={styles.agencyLocation}>{item.location}</Text>
    <Text style={styles.agencyDestinations}>
      {t('destinations')}: {item.destinations.join(', ')}
    </Text>
    {(!location || !destination) && (
      <Text style={styles.selectRouteText}>{t('selectRouteText')}</Text>
    )}
  </TouchableOpacity>
);

  const renderPickerModal = (
    visible: boolean, 
    onClose: () => void, 
    onSelect: (city: string) => void, 
    selectedValue: string
  ) => (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('selectCity')}</Text>
          {cities.map((city) => (
            <Pressable
              key={city}
              style={[styles.cityItem, city === selectedValue && styles.selectedCity]}
              onPress={() => {
                onSelect(city);
                onClose();
              }}
            >
              <Text style={styles.cityText}>{city}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('agenciesTitle')}</Text>
      
      <View style={styles.routeSelectionContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('currentLocation')}</Text>
          <Pressable 
            style={styles.pickerInput}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={location ? styles.pickerText : styles.pickerPlaceholder}>
              {location || t('selectLocation')}
            </Text>
          </Pressable>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('destination')}</Text>
          <Pressable 
            style={styles.pickerInput}
            onPress={() => setShowDestinationPicker(true)}
          >
            <Text style={destination ? styles.pickerText : styles.pickerPlaceholder}>
              {destination || t('selectDestination')}
            </Text>
          </Pressable>
        </View>
      </View>
      
      <FlatList
        data={mockAgencies}
        renderItem={renderAgency}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('noAgencies')}</Text>
        }
      />

      {renderPickerModal(
        showLocationPicker,
        () => setShowLocationPicker(false),
        (city) => setLocation(city),
        location
      )}

      {renderPickerModal(
        showDestinationPicker,
        () => setShowDestinationPicker(false),
        (city) => setDestination(city),
        destination
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  routeSelectionContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e',
    fontWeight: '600',
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#95a5a6',
  },
  listContent: {
    paddingBottom: 20,
  },
  agencyCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  disabledCard: {
    opacity: 0.7,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2c3e50',
  },
  agencyLocation: {
    color: '#666',
    marginBottom: 5,
  },
  agencyDestinations: {
    color: '#444',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  selectRouteText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  cityItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCity: {
    backgroundColor: '#f0f7ff',
  },
  cityText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  cancelButton: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lastCard: {
    marginBottom: 70, 
  },
});