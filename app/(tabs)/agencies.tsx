import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal, 
  Pressable,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const cities = ['Buea', 'Limbe', 'Douala', 'Bamenda', 'Yaounde', 'Baffoussam'];

interface Agency {
  _id: string;
  name: string;
  destinations: string[];
  location?: string;
  contactInfo?: {
    phone: string;
    email?: string;
    address?: string;
  };
}

export default function AgenciesScreen() {
  const { t } = useLanguage();
  const { authToken } = useAuth();
  const [location, setLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/agencies');
      
      const normalizedAgencies = response.data.data?.agencies?.map((agency: any) => ({
        ...agency,
        destinations: agency.destinations || []
      })) || [];
      
      setAgencies(normalizedAgencies);
    } catch (err: any) {
      setError(err.response?.data?.message || t('errorLoadingAgencies'));
      if (err.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgencies();
  };

  const filteredAgencies = agencies.filter(agency => {
    if (!location || !destination) return true;
    return agency.destinations.includes(location) && 
           agency.destinations.includes(destination);
  });

  const handleAgencyPress = (agency: Agency) => {
    if (!location || !destination) {
      Alert.alert(
        t('routeNotSelected'),
        t('pleaseSelectRouteFirst'),
        [{ text: t('ok') }]
      );
      return;
    }

    router.push({
      pathname: '/booking/[busId]',
      params: {
        busId: 'default',
        agencyName: agency.name,
        location,
        destination,
        agencyId: agency._id
      }
    });
  };

  const renderAgency = ({ item, index }: { item: Agency; index: number }) => {
    const destinations = item.destinations || [];
    const canBook = location && destination;

    return (
      <TouchableOpacity 
        style={[
          styles.agencyCard,
          !canBook && styles.disabledCard,
          index === filteredAgencies.length - 1 && styles.lastCard
        ]}
        onPress={() => handleAgencyPress(item)}
        disabled={!canBook}
      >
        <View style={styles.agencyHeader}>
          <Text style={styles.agencyName}>{item.name}</Text>
          {item.contactInfo?.phone && (
            <Text style={styles.agencyPhone}>
              <MaterialIcons name="phone" size={14} color="#3498db" /> {item.contactInfo.phone}
            </Text>
          )}
        </View>
        
        {item.location && (
          <Text style={styles.agencyLocation}>
            <MaterialIcons name="location-on" size={14} color="#666" /> {item.location}
          </Text>
        )}
        
        <Text style={styles.agencyDestinations}>
          <MaterialIcons name="map" size={14} color="#444" /> {t('destinations')}: {destinations.join(', ')}
        </Text>
        
        <View style={styles.agencyFooter}>
          {!location || !destination ? (
            <Text style={styles.selectRouteText}>
              <MaterialIcons name="info" size={14} color="#e74c3c" /> {t('selectRouteText')}
            </Text>
          ) : (
            <Text style={styles.busesAvailableText}>
              <MaterialIcons name="directions-bus" size={14} color="#27ae60" /> {t('agencyAvailable')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          <ScrollView>
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
          </ScrollView>
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E86C1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchAgencies();
          }}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        data={filteredAgencies}
        renderItem={renderAgency}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2E86C1']}
            tintColor={'#2E86C1'}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {location && destination 
                ? t('noAgenciesForRoute') 
                : t('selectRouteToViewAgencies')}
            </Text>
            {!location && !destination && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => {
                  setLocation('');
                  setDestination('');
                }}
              >
                <Text style={styles.showAllButtonText}>{t('showAllAgencies')}</Text>
              </TouchableOpacity>
            )}
          </View>
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
  agencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  agencyPhone: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 10,
  },
  agencyLocation: {
    color: '#666',
    marginBottom: 5,
    fontSize: 14,
  },
  agencyDestinations: {
    color: '#444',
    marginBottom: 5,
    fontSize: 14,
  },
  agencyFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  disabledCard: {
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  showAllButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2E86C1',
    borderRadius: 6,
  },
  showAllButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  selectRouteText: {
    color: '#e74c3c',
    fontSize: 14,
    fontStyle: 'italic',
  },
  busesAvailableText: {
    color: '#27ae60',
    fontSize: 14,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2E86C1',
    padding: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});