import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
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
          upcomingBookings: Number(response.data.stats.upcomingBookings) || 0,
          pastBookings: Number(response.data.stats.pastBookings) || 0
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
    <ScrollView 
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4a6fa5']}
          tintColor="#4a6fa5"
        />
      }
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    width: '30%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#4a6fa5',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4a6fa5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a6fa5',
    padding: 12,
    borderRadius: 8,
    width: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  snackbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderRadius: 8,
    margin: 16,
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