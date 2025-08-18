import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Alert,
  TextInput
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset to first page when search changes
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch agencies data using the actual API
  const fetchAgencies = useCallback(async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      setError(null);
      
      const response = await api.get('/agencies', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      
      const normalizedAgencies = response.data.data?.agencies?.map((agency: any) => ({
        ...agency,
        destinations: agency.destinations || []
      })) || [];
      
      setAgencies(pageNum === 1 ? normalizedAgencies : [...agencies, ...normalizedAgencies]);
      setHasMore(normalizedAgencies.length > 0);
    } catch (err: any) {
      setError(err.response?.data?.message || t('errorLoadingAgencies'));
      if (err.response?.status === 401) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and refresh
  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchAgencies(1);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchAgencies(page + 1);
    }
  };

  // Filter agencies based on search and route selection
  const filteredAgencies = useMemo(() => {
    return agencies.filter(agency => {
      const matchesSearch = agency.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      if (!location && !destination) return matchesSearch;
      return matchesSearch && 
             (!location || agency.destinations.includes(location)) && 
             (!destination || agency.destinations.includes(destination));
    });
  }, [agencies, location, destination, debouncedSearchQuery]);

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
        accessibilityLabel={`Agency: ${item.name}`}
        accessibilityRole="button"
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

  const CityPickerModal = ({
    visible,
    onClose,
    onSelect,
    selectedValue,
    title
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (city: string) => void;
    selectedValue: string;
    title: string;
  }) => (
    <Modal
      transparent={true}
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {cities.map((city) => (
              <Pressable
                key={city}
                style={[styles.cityItem, city === selectedValue && styles.selectedCity]}
                onPress={() => {
                  onSelect(city);
                  onClose();
                }}
                accessibilityLabel={`Select ${city}`}
                accessibilityRole="button"
              >
                <Text style={styles.cityText}>{city}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable 
            style={styles.cancelButton} 
            onPress={onClose}
            accessibilityLabel="Cancel selection"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing && page === 1) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>{t('loadingAgencies')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <MaterialIcons name="error-outline" size={50} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchAgencies();
          }}
          accessibilityLabel="Retry loading agencies"
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('agenciesTitle')}</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchAgencies')}
          placeholderTextColor="#95a5a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search agencies"
        />
        <MaterialIcons name="search" size={20} color="#95a5a6" style={styles.searchIcon} />
      </View>
      
      <View style={styles.routeSelectionContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('currentLocation')}</Text>
          <Pressable 
            style={styles.pickerInput}
            onPress={() => setShowLocationPicker(true)}
            accessibilityLabel="Select current location"
            accessibilityRole="button"
          >
            <Text style={location ? styles.pickerText : styles.pickerPlaceholder}>
              {location || t('selectLocation')}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#95a5a6" />
          </Pressable>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('destination')}</Text>
          <Pressable 
            style={styles.pickerInput}
            onPress={() => setShowDestinationPicker(true)}
            accessibilityLabel="Select destination"
            accessibilityRole="button"
          >
            <Text style={destination ? styles.pickerText : styles.pickerPlaceholder}>
              {destination || t('selectDestination')}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#95a5a6" />
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              <Text style={styles.emptyText}>
                {t('noAgenciesMatchSearch')}
              </Text>
            ) : location && destination ? (
              <Text style={styles.emptyText}>
                {t('noAgenciesForRoute')}
              </Text>
            ) : (
              <>
                <Text style={styles.emptyText}>
                  {t('selectRouteToViewAgencies')}
                </Text>
                <TouchableOpacity
                  style={styles.showAllButton}
                  onPress={() => {
                    setLocation('');
                    setDestination('');
                    setSearchQuery('');
                  }}
                  accessibilityLabel="Show all agencies"
                  accessibilityRole="button"
                >
                  <Text style={styles.showAllButtonText}>{t('showAllAgencies')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          loading && page > 1 ? (
            <ActivityIndicator size="small" color="#2E86C1" style={styles.footerLoader} />
          ) : null
        }
      />

      <CityPickerModal
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelect={(city) => setLocation(city)}
        selectedValue={location}
        title={t('selectLocation')}
      />

      <CityPickerModal
        visible={showDestinationPicker}
        onClose={() => setShowDestinationPicker(false)}
        onSelect={(city) => setDestination(city)}
        selectedValue={destination}
        title={t('selectDestination')}
      />
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
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    paddingLeft: 40,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 15,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingText: {
    marginTop: 10,
    color: '#2c3e50',
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
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#2E86C1',
    padding: 12,
    borderRadius: 6,
    width: '50%',
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footerLoader: {
    marginVertical: 20,
  }
});