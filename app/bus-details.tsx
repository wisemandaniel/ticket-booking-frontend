import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Link, router } from 'expo-router';

// Mock bus data with 70 seats in 3+2 layout
const mockBus = {
  id: '1',
  busNumber: 'CM 237 BS',
  operator: 'Musango Bus Service',
  departure: 'Buea',
  destination: 'Bamenda',
  departureTime: '2023-06-15T08:00:00',
  arrivalTime: '2023-06-15T14:00:00',
  price: 6500, // Price per seat in FCFA
  serviceFee: 1000, // Service and delivery fee in FCFA
  totalSeats: 70,
  availableSeats: Array.from({length: 70}, (_, i) => i + 1), // All seats initially available
  layout: {
    rows: 14,    // 70 seats / 5 seats per row
    seatsPerRow: 5, // 3 left + 2 right
    aisleAfter: 3,  // Aisle after 3 seats
  },
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const bus = mockBus;
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');

  const toggleSeatSelection = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatNumber));
    } else {
      if (selectedSeats.length < 5) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        Alert.alert('Limit reached', 'You can select up to 5 seats per booking');
      }
    }
  };

  const renderSeats = () => {
    const seats = [];
    const { rows, seatsPerRow, aisleAfter } = bus.layout;

    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      
      for (let seatInRow = 1; seatInRow <= seatsPerRow; seatInRow++) {
        const seatNumber = (row - 1) * seatsPerRow + seatInRow;
        const isAvailable = bus.availableSeats.includes(seatNumber);
        const isSelected = selectedSeats.includes(seatNumber);
        
        rowSeats.push(
          <TouchableOpacity
            key={`seat-${seatNumber}`}
            style={[
              styles.seat,
              !isAvailable && styles.seatUnavailable,
              isSelected && styles.seatSelected,
              seatInRow > aisleAfter && styles.rightSection,
            ]}
            onPress={() => isAvailable && toggleSeatSelection(seatNumber)}
            disabled={!isAvailable}
          >
            <Text style={[
              styles.seatText,
              !isAvailable && styles.seatTextUnavailable,
              isSelected && styles.seatTextSelected,
            ]}>
              {seatNumber}
            </Text>
          </TouchableOpacity>
        );

        // Add aisle space after 3 seats
        if (seatInRow === aisleAfter) {
          rowSeats.push(
            <View key={`aisle-${row}`} style={styles.aisleSpace} />
          );
        }
      }

      seats.push(
        <View key={`row-${row}`} style={styles.seatRow}>
          {rowSeats}
        </View>
      );
    }

    return seats;
  };

  const calculateTotal = () => {
    return (selectedSeats.length * bus.price) + bus.serviceFee;
  };

  const handleBooking = () => {
    if (!passengerName || !passengerPhone || selectedSeats.length === 0) {
      Alert.alert('Missing Information', 'Please fill all details and select at least one seat');
      return;
    }
    
    if (passengerPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    router.push({
      pathname: '/confirmation',
      params: {
        busNumber: bus.busNumber,
        operator: bus.operator,
        departure: bus.departure,
        destination: bus.destination,
        date: new Date(bus.departureTime).toLocaleDateString(),
        time: `${new Date(bus.departureTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(bus.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        seats: selectedSeats.join(','),
        total: calculateTotal().toString(),
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.busInfo}>
        <Text style={styles.busNumber}>{bus.busNumber}</Text>
        <Text style={styles.route}>{bus.departure} → {bus.destination}</Text>
        <Text style={styles.price}>{bus.price.toLocaleString()} FCFA per seat</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Seats ({selectedSeats.length} selected)</Text>
        
        <View style={styles.busLayout}>
          {/* Driver's cabin */}
          <View style={styles.driverCabin}>
            <View style={styles.driverSeat} />
            <Text style={styles.driverText}>Driver</Text>
          </View>
          
          {/* Door */}
          <View style={styles.door} />
          
          {/* Seats */}
          <View style={styles.seatsContainer}>
            {renderSeats()}
          </View>
        </View>
        
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendAvailable]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, styles.legendUnavailable]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Passenger Details</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={passengerName}
          onChangeText={setPassengerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={passengerPhone}
          onChangeText={setPassengerPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Selected Seats:</Text>
          <Text style={styles.summaryValue}>{selectedSeats.join(', ')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Price per seat:</Text>
          <Text style={styles.summaryValue}>{bus.price.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Fee:</Text>
          <Text style={styles.summaryValue}>{bus.serviceFee.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total:</Text>
          <Text style={styles.summaryTotal}>{calculateTotal().toLocaleString()} FCFA</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.bookButton,
          selectedSeats.length === 0 && styles.bookButtonDisabled
        ]}
        onPress={handleBooking}
        disabled={selectedSeats.length === 0}
      >
        <Text style={styles.bookButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  busInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    margin: 15,
    elevation: 2,
  },
  busNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  route: {
    fontSize: 16,
    color: '#495057',
    marginVertical: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4361EE',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
  },
  busLayout: {
    alignItems: 'center',
    marginBottom: 20,
  },
  driverCabin: {
    alignItems: 'center',
    marginBottom: 15,
  },
  driverSeat: {
    width: 60,
    height: 40,
    backgroundColor: '#343A40',
    borderRadius: 5,
  },
  driverText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 5,
  },
  door: {
    width: 40,
    height: 20,
    backgroundColor: '#ADB5BD',
    marginBottom: 20,
  },
  seatsContainer: {
    width: '100%',
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  seat: {
    width: 36,
    height: 36,
    backgroundColor: '#E9ECEF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  rightSection: {
    marginLeft: 24,
  },
  seatSelected: {
    backgroundColor: '#4361EE',
  },
  seatUnavailable: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  seatText: {
    fontWeight: 'bold',
    color: '#212529',
    fontSize: 12,
  },
  seatTextSelected: {
    color: '#fff',
  },
  seatTextUnavailable: {
    color: '#ADB5BD',
  },
  aisleSpace: {
    width: 24,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 5,
  },
  legendAvailable: {
    backgroundColor: '#E9ECEF',
  },
  legendSelected: {
    backgroundColor: '#4361EE',
  },
  legendUnavailable: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  legendText: {
    fontSize: 14,
    color: '#495057',
  },
  input: {
    height: 50,
    borderColor: '#DEE2E6',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#495057',
  },
  summaryValue: {
    fontSize: 16,
    color: '#212529',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4361EE',
  },
  bookButton: {
    backgroundColor: '#4361EE',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 15,
    elevation: 2,
  },
  bookButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});