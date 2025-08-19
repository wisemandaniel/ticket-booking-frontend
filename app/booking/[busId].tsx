import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Pressable, 
  TextInput,
  Dimensions,
  Animated
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { mockAgencies } from '../mockData';
import { useLanguage } from '../../contexts/LanguageContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsService } from '@/services/api';

interface Seat {
  seatNumber: string;
  row: number;
  position: 'left' | 'right' | 'center';
  isDriverSeat: boolean;
  isAvailable?: boolean;
}

interface BusType {
  id: string;
  name: string;
  totalSeats: number;
  basePrice: number;
}

interface PassengerInfo {
  name: string;
  idNumber: string;
}

interface SnackbarProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
  onDismiss: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ visible, message, type, onDismiss }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#2ecc71' : 
                         type === 'error' ? '#e74c3c' : '#3498db';

  return (
    <Animated.View 
      style={[
        styles.snackbar,
        { 
          backgroundColor,
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.snackbarText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}>
        <MaterialIcons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BookingScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { agencyName, location, destination, busId }: any = params;
  const { user }: any = useAuth();
  
  const [selectedBusType, setSelectedBusType] = useState<string>('30');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [serviceFee] = useState<number>(500);
  const [busTypeModalVisible, setBusTypeModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [passengersInfo, setPassengersInfo] = useState<Record<string, PassengerInfo>>({});
  const [momoNumber, setMomoNumber] = useState(user?.whatsappNumber || user?.phoneNumber || '');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo'>('cash');
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  });
  
  const agency = mockAgencies.find(a => a.name === agencyName) || mockAgencies[0];
  
  const busTypes: BusType[] = [
    { id: '30', name: '30-Seater', totalSeats: 30, basePrice: 6500 },
    { id: '56', name: '56-Seater', totalSeats: 56, basePrice: 6500 },
    { id: '70', name: '70-Seater', totalSeats: 70, basePrice: 6500 },
  ];

  const selectedBus = busTypes.find(bus => bus.id === selectedBusType) || busTypes[0];
  
  useEffect(() => {
    const newPassengersInfo: Record<string, PassengerInfo> = {};
    selectedSeats.forEach(seat => {
      if (!passengersInfo[seat]) {
        newPassengersInfo[seat] = { 
          name: user?.fullName || user?.legalBusinessName || '', 
          idNumber: user?.idCardNumber || '',
        };
      } else {
        newPassengersInfo[seat] = passengersInfo[seat];
      }
    });
    setPassengersInfo(newPassengersInfo);
  }, [selectedSeats, user]);

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info') => {
    setSnackbar({ visible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar({ ...snackbar, visible: false });
  };

  const generateSeatLayout = (totalSeats: number): Seat[] => {
  const seats: Seat[] = [];
  let seatNumber = 1;
  
  // Driver seat - use a unique key that won't conflict with numeric seats
  seats.push({
    seatNumber: 'DRIVER',
    row: 1,
    position: 'left',
    isDriverSeat: true,
    isAvailable: false
  });
  
  // First row seats
  seats.push({
    seatNumber: seatNumber.toString(),
    row: 1,
    position: 'right',
    isDriverSeat: false,
    isAvailable: true
  });
  seatNumber++;
  
  seats.push({
    seatNumber: seatNumber.toString(),
    row: 1,
    position: 'right',
    isDriverSeat: false,
    isAvailable: true
  });
  seatNumber++;
  
  const remainingSeats = totalSeats - 2;
  const fullRows = Math.floor(remainingSeats / 5);
  const lastRowSeats = remainingSeats % 5;
  
  let currentRow = 2;
  for (let r = 0; r < fullRows; r++) {
    // Left side seats (3 per row)
    for (let i = 0; i < 3 && seatNumber <= totalSeats; i++) {
      seats.push({
        seatNumber: seatNumber.toString(),
        row: currentRow,
        position: 'left',
        isDriverSeat: false,
        isAvailable: true
      });
      seatNumber++;
    }
    
    // Right side seats (2 per row)
    for (let i = 0; i < 2 && seatNumber <= totalSeats; i++) {
      seats.push({
        seatNumber: seatNumber.toString(),
        row: currentRow,
        position: 'right',
        isDriverSeat: false,
        isAvailable: true
      });
      seatNumber++;
    }
    
    currentRow++;
  }
  
  // Last row seats if any remaining
  if (lastRowSeats > 0) {
    for (let i = 0; i < lastRowSeats && seatNumber <= totalSeats; i++) {
      seats.push({
        seatNumber: seatNumber.toString(),
        row: currentRow,
        position: i < 3 ? 'left' : 'right',
        isDriverSeat: false,
        isAvailable: true
      });
      seatNumber++;
    }
  }
  
  return seats;
};

  const seatLayout = generateSeatLayout(selectedBus.totalSeats);
  const rows: Record<number, Seat[]> = {};
  seatLayout.forEach((seat: Seat) => {
    if (!rows[seat.row]) {
      rows[seat.row] = [];
    }
    rows[seat.row].push(seat);
  });

  const toggleSeatSelection = (seatNumber: string, isAvailable: boolean | undefined) => {
    if (!isAvailable) return;
    
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber);
      } else {
        if (prev.length >= 5) {
          showSnackbar(t('maxSeatsMessage'), 'error');
          return prev;
        }
        return [...prev, seatNumber];
      }
    });
  };

  const calculateTotal = () => {
    return (selectedBus.basePrice * selectedSeats.length + serviceFee);
  };

  const handleBookSeats = () => {
    if (selectedSeats.length === 0) {
      showSnackbar(t('selectSeatsMessage'), 'error');
      return;
    }
    setConfirmModalVisible(true);
  };

  const handlePassengerInfoChange = (seatNumber: string, field: keyof PassengerInfo, value: string) => {
    setPassengersInfo(prev => ({
      ...prev,
      [seatNumber]: {
        ...prev[seatNumber],
        [field]: value
      }
    }));
  };

  const confirmBooking = async () => {
  for (const seat of selectedSeats) {
    if (!passengersInfo[seat]?.name || !passengersInfo[seat]?.idNumber) {
      showSnackbar(`${t('fillAllInfo')} ${seat}`, 'error');
      return;
    }
  }
  
  try {
    setIsProcessingPayment(true);
    
    // Prepare booking data with correct field names
    const bookingData = {
      user: user?._id, 
      agency: agency.name,
      kickoff_location: location,
      destination: destination,
      busType: selectedBusType,
      seats: selectedSeats,
      passengers: selectedSeats.map(seat => ({
        name: passengersInfo[seat].name,
        idNumber: passengersInfo[seat].idNumber
      })),
      totalAmount: calculateTotal(),
      serviceFee,
      paymentMethod,
      momoNumber: paymentMethod === 'momo' ? momoNumber : undefined,
      travelDate: new Date().toISOString(),
      bookingReference: generateBookingReference(),
    };
    
    // Make API call to create booking
    const response = await bookingsService.createBooking(bookingData);
    
    console.log('Booking created successfully:', response.data);
    
    setConfirmModalVisible(false);
    
    if (paymentMethod === 'momo') {
      setPaymentAmount(calculateTotal().toLocaleString());
      setPaymentModalVisible(true);
    } else {
      showSnackbar(
        t('bookingConfirmationMessage', {
          count: selectedSeats.length,
          agency: agencyName,
          total: calculateTotal().toLocaleString()
        }), 
        'success'
      );
      setTimeout(() => router.back(), 3500);
    }
  } catch (error) {
    console.error('Booking creation error:', error);
    showSnackbar(t('bookingSaveError'), 'error');
  } finally {
    setIsProcessingPayment(false);
  }
};

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `BUS-${timestamp}-${randomStr}`.toUpperCase();
};

  const completePayment = () => {
    if (!momoNumber && paymentMethod === 'momo') {
      showSnackbar(t('provideMomoNumber'), 'error');
      return;
    }
    
    setPaymentModalVisible(false);
    showSnackbar(
      t('paymentConfirmationMessage', {
        count: selectedSeats.length,
        agency: agencyName,
        total: calculateTotal().toLocaleString()
      }),
      'success'
    );
    setTimeout(() => router.back(), 3500);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('bookYourSeats')}</Text>
        <Text style={styles.agencyName}>{agencyName}</Text>
        <View style={styles.routeContainer}>
          <Text style={styles.routeTextArrow}>{location}</Text>
          <MaterialIcons name="arrow-forward" size={16} color="#2c3e50" />
          <Text style={styles.routeTextArrow}>{destination}</Text>
        </View>
        
        <View style={styles.busTypeContainer}>
          <Text style={styles.label}>{t('selectBusType')}</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setBusTypeModalVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {selectedBus.name}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={busTypeModalVisible}
          onRequestClose={() => setBusTypeModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('selectBusType')}</Text>
              <ScrollView>
                {busTypes.map(bus => (
                  <Pressable
                    key={bus.id}
                    style={[styles.modalOption, selectedBusType === bus.id && styles.selectedOption]}
                    onPress={() => {
                      setSelectedBusType(bus.id);
                      setSelectedSeats([]);
                      setBusTypeModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{bus.name}</Text>
                    <Text style={styles.modalOptionPrice}>FCFA {bus.basePrice.toLocaleString()} {t('pricePerSeat')}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={[styles.modalCloseButton, styles.cancelButton]}
                onPress={() => setBusTypeModalVisible(false)}
              >
                <Text style={styles.confirmModalButtonText}>{t('cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        
        <View style={styles.seatInfoContainer}>
          <Text style={styles.seatInfoText}>
            {t('availableSeats')}: {selectedBus.totalSeats - selectedSeats.length} / {selectedBus.totalSeats}
          </Text>
          <Text style={styles.seatInfoText}>
            {t('pricePerSeat')}: FCFA {selectedBus.basePrice.toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
            <Text style={styles.legendText}>{t('selected')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ecf0f1' }]} />
            <Text style={styles.legendText}>{t('available')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#95a5a6' }]} />
            <Text style={styles.legendText}>{t('booked')}</Text>
          </View>
        </View>
        
        <View style={styles.seatLayout}>
          {Object.entries(rows).map(([row, seats]) => {
            const isFirstRow = parseInt(row) === 1;
            const isLastRow = parseInt(row) === Math.max(...Object.keys(rows).map(Number));
            
            return (
              <View key={row} style={styles.row}>
                <View style={styles.seatsInRow}>
                  {seats.map((seat: Seat, index: number) => {
                    const addSpace = !isFirstRow && !isLastRow && 
                                   seat.position === 'left' && 
                                   index === 2;
                    
                    return (
                      <View key={seat.seatNumber} style={addSpace ? styles.spacedSeatContainer : null}>
                        <TouchableOpacity
                          style={[
                            styles.seat,
                            seat.isDriverSeat && styles.driverSeat,
                            !seat.isAvailable && styles.bookedSeat,
                            selectedSeats.includes(seat.seatNumber) && styles.selectedSeat,
                          ]}
                          onPress={() => toggleSeatSelection(seat.seatNumber, seat.isAvailable)}
                          disabled={!seat.isAvailable}
                        >
                          <Text style={styles.seatText}>
                            {seat.isDriverSeat ? t('driver') : seat.seatNumber}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
        
        {selectedSeats.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>{t('bookingSummary')}</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('selectedSeatsLabel')}</Text>
              <Text style={styles.summaryValue}>{selectedSeats.join(', ')}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('seatPriceLabel')}</Text>
              <Text style={styles.summaryValue}>
                {selectedSeats.length} × FCFA {selectedBus.basePrice.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('serviceFeeLabel')}</Text>
              <Text style={styles.summaryValue}>FCFA {serviceFee.toLocaleString()}</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={[styles.summaryLabel, styles.totalLabel]}>{t('totalLabel')}</Text>
              <Text style={[styles.summaryValue, styles.totalValue]}>
                FCFA {calculateTotal().toLocaleString()}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={handleBookSeats}
            >
              <Text style={styles.bookButtonText}>
                {t('confirmBooking')} - FCFA {calculateTotal().toLocaleString()}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>{t('confirmBookingTitle')}</Text>
            <Text style={styles.confirmModalText}>
              {t('bookingConfirmationMessage', {
                count: selectedSeats.length,
                agency: agencyName,
                total: calculateTotal().toLocaleString()
              })}
            </Text>

            <View style={styles.paymentMethodContainer}>
              <Text style={styles.paymentMethodLabel}>{t('paymentMethod')}</Text>
              <View style={styles.paymentMethodOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'cash' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'cash' && styles.selectedPaymentMethodText
                  ]}>
                    {t('cash')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === 'momo' && styles.selectedPaymentMethod
                  ]}
                  onPress={() => setPaymentMethod('momo')}
                >
                  <Text style={[
                    styles.paymentMethodText,
                    paymentMethod === 'momo' && styles.selectedPaymentMethodText
                  ]}>
                    {t('momo')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.passengerFormContainer}>
              {selectedSeats.map(seat => (
                <View key={seat} style={styles.passengerForm}>
                  <Text style={styles.passengerFormTitle}>
                    {t('passengerForSeat')} {seat}
                  </Text>
                  
                  <Text style={styles.inputLabel}>{t('fullName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('fullName')}
                    value={passengersInfo[seat]?.name || ''}
                    onChangeText={(text) => handlePassengerInfoChange(seat, 'name', text)}
                  />
                  
                  <Text style={styles.inputLabel}>{t('idNumber')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('idNumber')}
                    value={passengersInfo[seat]?.idNumber || ''}
                    onChangeText={(text) => handlePassengerInfoChange(seat, 'idNumber', text)}
                  />
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.confirmModalButtons}>
              <Pressable
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmModalButtonText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmModalButton, styles.confirmButton]}
                onPress={confirmBooking}
                disabled={isProcessingPayment}
              >
                <Text style={styles.confirmModalButtonText}>
                  {isProcessingPayment ? t('processing') : t('confirmBooking')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalTitle}>{t('paymentTitle')}</Text>
            <Text style={styles.confirmModalText}>
              {t('paymentInstructions')}
            </Text>
            
            <View style={styles.paymentForm}>
              <Text style={styles.inputLabel}>{t('momoNumber')}</Text>
              <View style={styles.phoneInputContainer}>
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+237</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder={t('enterMomoNumber')}
                  value={momoNumber}
                  onChangeText={setMomoNumber}
                  keyboardType="phone-pad"
                />
              </View>
              
              <Text style={styles.inputLabel}>{t('amount')}</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={`FCFA ${paymentAmount}`}
                editable={false}
              />
            </View>
            
            <View style={styles.confirmModalButtons}>
              <Pressable
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={styles.confirmModalButtonText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmModalButton, styles.confirmButton]}
                onPress={completePayment}
              >
                <Text style={styles.confirmModalButtonText}>{t('confirmPayment')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  agencyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#3498db',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  routeTextArrow: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginHorizontal: 12,
  },
  busTypeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#2c3e50',
  },
  modalOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f0f7ff',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  modalOptionPrice: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  seatInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  seatInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#34495e',
  },
  seatLayout: {
    marginBottom: 16,
    alignItems: 'center',
  },
  row: {
    marginBottom: 12,
    width: '100%',
  },
  seatsInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  spacedSeatContainer: {
    marginRight: 24,
  },
  seat: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#ecf0f1',
  },
  driverSeat: {
    backgroundColor: '#e74c3c',
    width: 120,
    opacity: 0.7,
  },
  bookedSeat: {
    backgroundColor: '#95a5a6',
    opacity: 0.5,
  },
  selectedSeat: {
    backgroundColor: '#2ecc71',
  },
  seatText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  bookButton: {
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  bookButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmModalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2c3e50',
  },
  confirmModalText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
    textAlign: 'center',
  },
  passengerFormContainer: {
    maxHeight: Dimensions.get('window').height * 0.4,
    marginBottom: 12,
  },
  passengerForm: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  passengerFormTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c3e50',
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: 4,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    fontSize: 14,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  confirmModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  confirmButton: {
    backgroundColor: '#2ecc71',
  },
  confirmModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    fontSize: 14,
  },
  paymentForm: {
    marginVertical: 12,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  countryCodeContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRightWidth: 0,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 0,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1000,
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  paymentMethodContainer: {
    marginBottom: 16,
  },
  paymentMethodLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#34495e',
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedPaymentMethod: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  selectedPaymentMethodText: {
    color: 'white',
  },
});