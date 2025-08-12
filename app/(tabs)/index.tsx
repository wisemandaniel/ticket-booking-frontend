import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { mockBookings } from '../mockData';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DashboardScreen() {
  const { t } = useLanguage();
  const now = new Date();
  
  const totalBookings = mockBookings.length;
  const upcomingBookings = mockBookings.filter(
    (b: any) => new Date(b.departureTime) > now && b.status === 'confirmed'
  ).length;
  const pastBookings = mockBookings.filter(
    (b: any) => new Date(b.departureTime) < now && b.status === 'confirmed'
  ).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('dashboardTitle')}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalBookings}</Text>
          <Text style={styles.statLabel}>{t('totalBookings')}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingBookings}</Text>
          <Text style={styles.statLabel}>{t('upcomingTrips')}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pastBookings}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 15,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});