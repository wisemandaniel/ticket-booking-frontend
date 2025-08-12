import { View, Text, StyleSheet, FlatList } from 'react-native';
import { mockAgencies, mockBookings } from './mockData';
import { useLanguage } from '../contexts/LanguageContext';

export default function TravelHistoryScreen() {
  const { t } = useLanguage();
  
  // Enhance bookings with agency and bus data
  const enhancedBookings = mockBookings.map(booking => {
    const agency = mockAgencies.find(a => a.id === booking.agencyId);
    const bus = agency?.buses.find(b => b.id === booking.busId);
    
    return {
      ...booking,
      agencyId: agency,
      busId: bus,
      // Translate status directly here
      status: t(booking.status) || booking.status
    };
  });

  const renderBooking = ({ item }: any) => (
    <View style={styles.bookingCard}>
      <Text style={styles.agencyName}>{item.agencyId?.name || t('unknownAgency')}</Text>
      <Text style={styles.busNumber}>
        {t('busLabel')}: {item.busId?.busNumber || 'N/A'}
      </Text>
      <Text style={styles.route}>
        {item.from} {t('routeSeparator')} {item.to}
      </Text>
      <Text style={styles.date}>
        {new Date(item.departureTime).toLocaleDateString()} {t('at')}{' '}
        {new Date(item.departureTime).toLocaleTimeString()}
      </Text>
      <Text style={styles.seats}>
        {t('seatsLabel')}: {item.seats.join(', ')}
      </Text>
      <Text style={styles.status}>
        {t('statusLabel')}: {item.status}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('travelHistoryTitle')}</Text>
      
      <FlatList
        data={enhancedBookings}
        renderItem={renderBooking}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('noHistoryText')}</Text>
        }
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
  },
  listContent: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  agencyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  busNumber: {
    color: '#666',
    marginBottom: 5,
  },
  route: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: 'blue',
  },
  date: {
    color: '#666',
    marginBottom: 5,
  },
  seats: {
    color: '#444',
  },
  status: {
    marginTop: 5,
    fontStyle: 'italic',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});