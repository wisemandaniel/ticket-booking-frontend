import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, Animated, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { bookingsService } from '../services/api';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

interface HistoryItem {
  _id: string;
  agency: string;
  route: string;
  date: string | Date;
  seats: number;
  totalAmount: number;
  status?: 'confirmed' | 'cancelled' | 'completed' | 'upcoming';
}

type SnackbarType = 'error' | 'success' | 'info';

export default function TravelHistoryScreen() {
  const { t } = useLanguage();
  const { user }: any = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'info' as SnackbarType,
  });
  const translateY = useRef(new Animated.Value(100)).current;

  const fetchTravelHistory = useCallback(async () => {
    try {
      const response = await bookingsService.getTravelHistory(user?._id);
      console.log('Travel history response:', response.data);
      
      // Process the data to add status based on date
      const processedHistory = response.data.history.map((item: any) => {
        const travelDate = new Date(item.date);
        const today = new Date();
        
        let status: 'completed' | 'upcoming' | 'confirmed' = 'confirmed';
        if (travelDate < today) {
          status = 'completed';
        } else if (travelDate > today) {
          status = 'upcoming';
        }
        
        return {
          ...item,
          status
        };
      });
      
      setHistory(processedHistory);
      if (!refreshing) {
        showSnackbar(t('historyLoadedSuccess'), 'success');
      }
    } catch (err) {
      console.error('Error fetching travel history:', err);
      showSnackbar(t('failedToLoadHistory'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, refreshing, t]);

  useEffect(() => {
    if (user?._id) {
      fetchTravelHistory();
    }
  }, [user?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTravelHistory();
  }, [fetchTravelHistory]);

  const showSnackbar = (message: string, type: SnackbarType) => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setSnackbar({ visible: true, message, type });
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const timer = setTimeout(() => hideSnackbar(), 3000);
        return () => clearTimeout(timer);
      });
    });
  };

  const hideSnackbar = () => {
    Animated.timing(translateY, {
      toValue: 100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSnackbar(prev => ({ ...prev, visible: false }));
    });
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="directions-bus" size={24} color="#4a6fa5" />
        <View style={styles.routeContainer}>
          <Text style={styles.route} numberOfLines={1} ellipsizeMode="tail">
            {item.route}
          </Text>
          <Text style={styles.agency} numberOfLines={1} ellipsizeMode="tail">
            {item.agency}
          </Text>
        </View>
        {item.status && (
          <View style={[
            styles.statusBadge,
            item.status === 'completed' ? styles.completedBadge : 
            item.status === 'upcoming' ? styles.upcomingBadge : styles.confirmedBadge
          ]}>
            <Text style={styles.statusText}>{t(item.status)}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <MaterialIcons name="calendar-today" size={16} color="#6c757d" />
          <Text style={styles.detailText} numberOfLines={1}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <MaterialIcons name="event-seat" size={16} color="#6c757d" />
          <Text style={styles.detailText} numberOfLines={1}>
            {t('seats')}: {item.seats}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.amountText} numberOfLines={1}>
          {t('currency')} {item.totalAmount.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const getSnackbarStyle = () => {
    switch (snackbar.type) {
      case 'error': return styles.snackbarError;
      case 'success': return styles.snackbarSuccess;
      default: return styles.snackbarInfo;
    }
  };

  const getSnackbarIcon = () => {
    switch (snackbar.type) {
      case 'error': return <MaterialIcons name="error-outline" size={24} color="white" />;
      case 'success': return <MaterialIcons name="check-circle" size={24} color="white" />;
      default: return <MaterialIcons name="info" size={24} color="white" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6fa5" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={history}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <Text style={styles.header}>{t('travelHistory')}</Text>
          }
          contentContainerStyle={[styles.listContent, history.length === 0 && styles.emptyListContent]}
          renderItem={renderHistoryItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={48} color="#adb5bd" />
              <Text style={styles.emptyText}>{t('noTravelHistory')}</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4a6fa5']}
              tintColor="#4a6fa5"
            />
          }
        />

        {snackbar.visible && (
          <Animated.View 
            style={[
              styles.snackbar, 
              getSnackbarStyle(), 
              { transform: [{ translateY }] }
            ]}
          >
            <View style={styles.snackbarContent}>
              {getSnackbarIcon()}
              <Text style={styles.snackbarText} numberOfLines={2}>{snackbar.message}</Text>
              <TouchableOpacity onPress={hideSnackbar}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  route: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  agency: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  confirmedBadge: {
    backgroundColor: '#d1ecf1',
  },
  completedBadge: {
    backgroundColor: '#d4edda',
  },
  upcomingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0c5460',
  },
  detailsContainer: {
    marginLeft: 36,
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  amountContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#adb5bd',
    marginTop: 16,
    textAlign: 'center',
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderRadius: 4,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snackbarText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
    marginHorizontal: 12,
  },
  snackbarError: {
    backgroundColor: '#dc3545',
  },
  snackbarSuccess: {
    backgroundColor: '#28a745',
  },
  snackbarInfo: {
    backgroundColor: '#17a2b8',
  },
});