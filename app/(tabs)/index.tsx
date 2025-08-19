import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { bookingsService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

type SnackbarType = 'error' | 'success' | 'info';

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  pastBookings: number;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 3; // 20px padding * 2 + 20px gap

export default function DashboardScreen() {
  const { t } = useLanguage();
  const { user }: any = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    pastBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'info' as SnackbarType,
  });
  const translateY = useRef(new Animated.Value(100)).current;
  const snackbarTimeout = useRef<NodeJS.Timeout>();

  const fetchDashboardStats = useCallback(async (isRefresh = false) => {
    try {
      if (!user?._id) {
        setError(t('userNotAuthenticated'));
        return;
      }
      
      setError('');
      const response = await bookingsService.getDashboardStats(user._id);

      if (response.data?.stats) {
        // Ensure all stats are numbers, defaulting to 0 if undefined
        const statsData = {
          totalBookings: Number(response.data.stats.totalBookings) || 0,
          upcomingBookings: Number(response.data.stats.upcomingTrips) || 0,
          pastBookings: Number(response.data.stats.pastTrips) || 0
        };
        setStats(statsData);
        
        if (!isRefresh) {
          showSnackbar(t('dashboardDataLoaded'), 'success');
        }
      } else {
        setError(t('invalidDataReceived'));
        showSnackbar(t('invalidDataReceived'), 'error');
      }
    } catch (err) {
      setError(t('failedToLoadData'));
      showSnackbar(t('failedToLoadData'), 'error');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchDashboardStats();
    return () => {
      if (snackbarTimeout.current) {
        clearTimeout(snackbarTimeout.current);
      }
    };
  }, [fetchDashboardStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const showSnackbar = (message: string, type: SnackbarType) => {
    // Clear any existing timeout
    if (snackbarTimeout.current) {
      clearTimeout(snackbarTimeout.current);
    }

    // Hide current snackbar before showing new one
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
        snackbarTimeout.current = setTimeout(() => hideSnackbar(), 3000);
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
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4a6fa5" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialIcons name="error-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchDashboardStats();
          }}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4a6fa5']}
            tintColor="#4a6fa5"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('dashboardTitle')}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>{t('totalBookings')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.upcomingBookings}</Text>
            <Text style={styles.statLabel}>{t('upcomingTrips')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pastBookings}</Text>
            <Text style={styles.statLabel}>{t('pastTrips')}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.navigate('/travel-history')}
        >
          <Text style={styles.buttonText}>{t('viewTravelHistory')}</Text>
        </TouchableOpacity>
      </ScrollView>

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
            <Text style={styles.snackbarText}>{snackbar.message}</Text>
            <TouchableOpacity onPress={hideSnackbar}>
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2c3e50',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    minWidth: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 3 
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 10,
    color: '#4a6fa5',
  },
  statLabel: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#4a6fa5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 3 
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 18,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#4a6fa5',
    padding: 16,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginHorizontal: 12,
    fontWeight: '500',
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