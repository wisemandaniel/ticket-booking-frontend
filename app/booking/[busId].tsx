import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Pressable, TextInput, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { mockAgencies } from '../mockData';
import { useLanguage } from '../../contexts/LanguageContext';

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
  idPhoto?: string;
}

export default function BookingScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  const { agencyName, location, destination } = params;
  
  const [selectedBusType, setSelectedBusType] = useState<string>('30');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [serviceFee] = useState<number>(500);
  const [busTypeModalVisible, setBusTypeModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [passengersInfo, setPassengersInfo] = useState<Record<string, PassengerInfo>>({});
  const [activeSeatForPhoto, setActiveSeatForPhoto] = useState<string | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  
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
        newPassengersInfo[seat] = { name: '', idNumber: '' };
      } else {
        newPassengersInfo[seat] = passengersInfo[seat];
      }
    });
    setPassengersInfo(newPassengersInfo);
  }, [selectedSeats]);

  const generateSeatLayout = (totalSeats: number): Seat[] => {
    const seats: Seat[] = [];
    let seatNumber = 1;
    
    seats.push({
      seatNumber: 'DRIVER',
      row: 1,
      position: 'left',
      isDriverSeat: true,
      isAvailable: false
    });
    
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
          Alert.alert(t('maximumSeats'), t('maxSeatsMessage'));
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
      Alert.alert(t('noSeatsSelected'), t('selectSeatsMessage'));
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

  const pickImage = async (seatNumber: string) => {
    setActiveSeatForPhoto(seatNumber);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      handlePassengerInfoChange(seatNumber, 'idPhoto', result.assets[0].uri);
    }
    setActiveSeatForPhoto(null);
  };

  const confirmBooking = () => {
    for (const seat of selectedSeats) {
      if (!passengersInfo[seat]?.name || !passengersInfo[seat]?.idNumber) {
        Alert.alert(t('missingInfo'), `${t('fillAllInfo')} ${seat}`);
        return;
      }
    }
    
    setConfirmModalVisible(false);
    Alert.alert(
    t('bookingConfirmed'),
    t('bookingConfirmationMessage', {
        count: selectedSeats.length,
        agency: agencyName,
        total: calculateTotal().toLocaleString()
    }),
    [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const proceedToPayment = () => {
    // Validate all passenger info is filled
    for (const seat of selectedSeats) {
      if (!passengersInfo[seat]?.name || !passengersInfo[seat]?.idNumber) {
        Alert.alert(t('missingInfo'), `${t('fillAllInfo')} ${seat}`);
        return;
      }
    }
    
    setConfirmModalVisible(false);
    setPaymentAmount(calculateTotal().toLocaleString());
    setPaymentModalVisible(true);
  };

  const completePayment = () => {
    if (!momoNumber) {
      Alert.alert(t('paymentError'), t('provideMomoNumber'));
      return;
    }
    
    setPaymentModalVisible(false);
    Alert.alert(
      t('bookingConfirmed'),
      t('paymentConfirmationMessage', {
        count: selectedSeats.length,
        agency: agencyName,
        total: calculateTotal().toLocaleString()
      }),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('bookYourSeats')}</Text>
      <Text style={styles.agencyName}>{agencyName}</Text>
      <Text style={styles.routeText}>
        {location} → {destination}
      </Text>
      
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
                          seat.position === 'left' && styles.leftSeat,
                          seat.position === 'right' && styles.rightSeat,
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
                  
                  <Text style={styles.inputLabel}>{t('idCardPhoto')}</Text>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={() => pickImage(seat)}
                    disabled={activeSeatForPhoto !== null}
                  >
                    <Text style={styles.photoButtonText}>
                      {passengersInfo[seat]?.idPhoto ? t('changePhoto') : t('selectPhoto')}
                    </Text>
                  </TouchableOpacity>
                  
                  {passengersInfo[seat]?.idPhoto && (
                    <View style={styles.photoPreviewContainer}>
                      <Image 
                        source={{ uri: passengersInfo[seat]?.idPhoto }} 
                        style={styles.photoPreview}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.confirmModalButtons}>
              <Pressable
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text 
                  style={styles.confirmModalButtonText}
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {t('cancel')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.confirmModalButton, styles.confirmButton]}
                onPress={proceedToPayment}
              >
                <Text 
                  style={styles.confirmModalButtonText}
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.8}
                >
                  {t('proceedToPayment')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2c3e50',
  },
  agencyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#3498db',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  busTypeContainer: {
    marginBottom: 20,
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
    padding: 15,
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
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2c3e50',
  },
  modalOption: {
    padding: 15,
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
    marginTop: 15,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  seatInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  seatInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
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
    marginBottom: 20,
    alignItems: 'center',
  },
  row: {
    marginBottom: 15,
    width: '100%',
    maxWidth: 360,
  },
  seatsInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  spacedSeatContainer: {
    marginRight: 30,
  },
  seat: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    elevation: 2,
  },
  leftSeat: {},
  rightSeat: {},
  driverSeat: {
    backgroundColor: 'red',
    width: 150,
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
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#7f8c8d',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 10,
  },
  totalRow: {
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  bookButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#2c3e50',
  },
  confirmModalText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 5,
    textAlign: 'center',
  },
  confirmModalSeats: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center',
  },
  passengerFormContainer: {
    maxHeight: 300,
    marginBottom: 15,
  },
  passengerForm: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  passengerFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  photoButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  photoButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  photoPreview: {
    width: 150,
    height: 100,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10, // Adds consistent spacing between buttons
  },
  confirmModalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    minHeight: 44, // Minimum touch target size
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
    textAlign: 'center', // Ensure text alignment
    width: '100%', // Take full width of button
    paddingHorizontal: 4, // Prevent text from touching edges
  },
  paymentForm: {
    marginVertical: 15,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  phoneInputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 10,
},
countryCodeContainer: {
  backgroundColor: '#f8f9fa',
  padding: 9,
  borderWidth: 1,
  borderColor: '#ddd',
  borderRightWidth: 0,
  borderTopLeftRadius: 6,
  borderBottomLeftRadius: 6,
  marginBottom: 10,
},
countryCodeText: {
  fontSize: 16,
  color: '#2c3e50',
},
phoneInput: {
  flex: 1,
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeftWidth: 0,
},
});