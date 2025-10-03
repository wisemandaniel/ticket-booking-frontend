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
  TextInput,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const { width } = Dimensions.get('window');
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

// Translation dictionary
const translations = {
  en: {
    agenciesTitle: "Travel Agencies",
    searchAgencies: "Search agencies...",
    selectYourRoute: "Select Your Route",
    currentLocation: "Current Location",
    selectLocation: "Select Location",
    destination: "Destination",
    selectDestination: "Select Destination",
    clearSelection: "Clear Selection",
    agenciesFound: "agencies found",
    destinations: "Destinations",
    selectRouteText: "Select route to book",
    agencyAvailable: "Available for booking",
    routeNotSelected: "Route Not Selected",
    pleaseSelectRouteFirst: "Please select both location and destination first",
    ok: "OK",
    cancel: "Cancel",
    loadingAgencies: "Loading agencies... ",
    errorLoadingAgencies: "Error loading agencies",
    retry: "Retry",
    noAgenciesMatchSearch: "No agencies match your search",
    noAgenciesForRoute: "No agencies available for this route",
    selectRouteToViewAgencies: "Select a route to view available agencies",
    showAllAgencies: "Show All Agencies",
    agenciesLoadedSuccess: "Agencies loaded successfully"
  },
  fr: {
    agenciesTitle: "Agences de Voyage",
    searchAgencies: "Rechercher des agences...",
    selectYourRoute: "Sélectionnez Votre Itinéraire",
    currentLocation: "Emplacement Actuel",
    selectLocation: "Sélectionnez un Emplacement",
    destination: "Destination",
    selectDestination: "Sélectionnez une Destination",
    clearSelection: "Effacer la Sélection",
    agenciesFound: "agences trouvées",
    destinations: "Destinations",
    selectRouteText: "Sélectionnez un itinéraire pour réserver",
    agencyAvailable: "Disponible pour réservation",
    routeNotSelected: "Itinéraire Non Sélectionné",
    pleaseSelectRouteFirst: "Veuillez d'abord sélectionner le lieu de départ et la destination",
    ok: "D'accord",
    cancel: "Annuler",
    loadingAgencies: "Chargement des agences...",
    errorLoadingAgencies: "Erreur lors du chargement des agences",
    retry: "Réessayer",
    noAgenciesMatchSearch: "Aucune agence ne correspond à votre recherche",
    noAgenciesForRoute: "Aucune agence disponible pour cet itinéraire",
    showAllAgencies: "Afficher Toutes les Agences",
    agenciesLoadedSuccess: "Agences chargées avec succès"
  }
};

export default function AgenciesScreen() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => (translations[language as keyof typeof translations] as typeof translations.en)[key];
  
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
  const [hasMore, setHasMore] = useState(false); // Changed to false initially
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
  const fetchAgencies = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      setLoading(pageNum === 1);
      setError(null);
      
      // Check if we're loading more but there's no more data
      if (pageNum > 1 && !hasMore) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const response = await api.get('/agencies');
      
      const normalizedAgencies = response.data.data?.agencies?.map((agency: any) => ({
        ...agency,
        destinations: agency.destinations || []
      })) || [];
      
      // For now, disable pagination since the API doesn't seem to support it
      // Always replace the agencies list instead of appending
      setAgencies(normalizedAgencies);
      setHasMore(false); // Disable load more since API doesn't support pagination
      
      if (!isRefresh && pageNum === 1) {
        showSnackbar(t('agenciesLoadedSuccess'), 'success');
      }
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

  // Simple snackbar function (you can replace with your actual snackbar implementation)
  const showSnackbar = (message: string, type: 'success' | 'error' | 'info') => {
    console.log(`${type}: ${message}`);
  };

  // Initial load and refresh
  useEffect(() => {
    fetchAgencies(1);
  }, [fetchAgencies]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgencies(1, true);
  };

  const handleLoadMore = () => {
    // Disable load more for now since API doesn't support pagination
    return;
    
    /*if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAgencies(nextPage);
    }*/
  };

  // Filter agencies based on search and route selection
  const filteredAgencies = useMemo(() => {
    // Remove duplicates by _id first
    const uniqueAgencies = agencies.filter((agency, index, self) =>
      index === self.findIndex(a => a._id === agency._id)
    );
    
    return uniqueAgencies.filter(agency => {
      const matchesSearch = agency.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      
      // If no location or destination is selected, show all agencies that match search
      if (!location && !destination) return matchesSearch;
      
      // If both location and destination are selected, filter agencies that serve both
      if (location && destination) {
        return matchesSearch && 
               agency.destinations.includes(location) && 
               agency.destinations.includes(destination);
      }
      
      // If only one of location or destination is selected, show agencies that serve at least one
      return matchesSearch && 
             (agency.destinations.includes(location) || 
              agency.destinations.includes(destination));
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
          <Text style={styles.agencyName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
          {item.contactInfo?.phone && (
            <View style={styles.phoneContainer}>
              <MaterialIcons name="phone" size={16} color="#3498db" />
              <Text style={styles.agencyPhone} numberOfLines={1} ellipsizeMode="tail">
                {item.contactInfo.phone}
              </Text>
            </View>
          )}
        </View>
        
        {item.location && (
          <View style={styles.locationContainer}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.agencyLocation} numberOfLines={1} ellipsizeMode="tail">
              {item.location}
            </Text>
          </View>
        )}
        
        <View style={styles.destinationsContainer}>
          <MaterialIcons name="map" size={16} color="#444" />
          <Text style={styles.agencyDestinations} numberOfLines={2} ellipsizeMode="tail">
            {t('destinations')}: {destinations.join(', ')}
          </Text>
        </View>
        
        <View style={styles.agencyFooter}>
          {!location || !destination ? (
            <View style={styles.infoContainer}>
              <MaterialIcons name="info" size={16} color="#e74c3c" />
              <Text style={styles.selectRouteText} numberOfLines={1} ellipsizeMode="tail">
                {t('selectRouteText')}
              </Text>
            </View>
          ) : (
            <View style={styles.availableContainer}>
              <MaterialIcons name="directions-bus" size={16} color="#27ae60" />
              <Text style={styles.busesAvailableText} numberOfLines={1} ellipsizeMode="tail">
                {t('agencyAvailable')}
              </Text>
            </View>
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
          <ScrollView style={styles.modalScrollView}>
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
                {city === selectedValue && (
                  <MaterialIcons name="check" size={20} color="#2E86C1" />
                )}
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
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#2E86C1" />
          <Text style={styles.loadingText}>{t('loadingAgencies')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.errorContainer]}>
          <MaterialIcons name="error-outline" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchAgencies(1);
            }}
            accessibilityLabel="Retry loading agencies"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('agenciesTitle')}</Text>
        
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#95a5a6" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchAgencies')}
            placeholderTextColor="#95a5a6"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search agencies"
          />
        </View>
        
        <View style={styles.routeSelectionContainer}>
          <Text style={styles.sectionTitle}>{t('selectYourRoute')}</Text>
          
          <View style={styles.routeInputsContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('currentLocation')}</Text>
              <Pressable 
                style={styles.pickerInput}
                onPress={() => setShowLocationPicker(true)}
                accessibilityLabel="Select current location"
                accessibilityRole="button"
              >
                <Text 
                  style={location ? styles.pickerText : styles.pickerPlaceholder} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {location || t('selectLocation')}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#95a5a6" />
              </Pressable>
            </View>
            
            <MaterialIcons name="arrow-forward" size={24} color="#2E86C1" style={styles.arrowIcon} />
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('destination')}</Text>
              <Pressable 
                style={styles.pickerInput}
                onPress={() => setShowDestinationPicker(true)}
                accessibilityLabel="Select destination"
                accessibilityRole="button"
              >
                <Text 
                  style={destination ? styles.pickerText : styles.pickerPlaceholder} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {destination || t('selectDestination')}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#95a5a6" />
              </Pressable>
            </View>
          </View>
          
          {(location || destination) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setLocation('');
                setDestination('');
              }}
            >
              <Text style={styles.clearButtonText}>{t('clearSelection')}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.resultsText}>
          {filteredAgencies.length} {t('agenciesFound')}
        </Text>
        
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
              <MaterialIcons name="travel-explore" size={50} color="#bdc3c7" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '##2c3e50',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  searchIcon: {
    marginRight: 8,
  },
  routeSelectionContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  routeInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: '#34495e',
    fontWeight: '600',
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#95a5a6',
    flex: 1,
  },
  arrowIcon: {
    marginHorizontal: 12,
    marginTop: 20,
  },
  clearButton: {
    alignSelf: 'center',
    padding: 8,
  },
  clearButtonText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  agencyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  agencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '50%',
  },
  agencyPhone: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 4,
    flexShrink: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agencyLocation: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },
  destinationsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agencyDestinations: {
    color: '#444',
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
    flexShrink: 1,
  },
  agencyFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectRouteText: {
    color: '#e74c3c',
    fontSize: 14,
    marginLeft: 6,
    flexShrink: 1,
  },
  busesAvailableText: {
    color: '#27ae60',
    fontSize: 14,
    marginLeft: 6,
    flexShrink: 1,
  },
  disabledCard: {
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 16,
    lineHeight: 24,
  },
  showAllButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#2E86C1',
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  showAllButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
    color: '#2c3e50',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalScrollView: {
    maxHeight: 300,
  },
  cityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
    padding: 16,
    backgroundColor: '#e74c3c',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  lastCard: {
    marginBottom: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#2c3e50',
    fontSize: 16,
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
    marginTop: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2E86C1',
    padding: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLoader: {
    marginVertical: 20,
  }
});